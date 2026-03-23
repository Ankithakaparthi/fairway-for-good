import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const charityId = session.metadata?.charity_id
      const charityPercentage = parseInt(session.metadata?.charity_percentage || '10')
      const plan = session.metadata?.plan as 'monthly' | 'yearly'

      if (!userId || !session.subscription) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer as string,
        plan,
        status: 'active',
        charity_id: charityId || null,
        charity_percentage: charityPercentage,
        amount_pence: subscription.items.data[0]?.price.unit_amount || 0,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }, { onConflict: 'stripe_subscription_id' })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (!invoice.subscription) break

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, user_id, charity_id, charity_percentage, amount_pence')
        .eq('stripe_subscription_id', invoice.subscription as string)
        .single()

      if (sub && sub.charity_id) {
        const donationAmount = (sub.amount_pence / 100) * (sub.charity_percentage / 100)
        await supabase.from('charity_contributions').insert({
          user_id: sub.user_id,
          charity_id: sub.charity_id,
          subscription_id: sub.id,
          amount: donationAmount,
          contribution_type: 'subscription',
          period_month: new Date().getMonth() + 1,
          period_year: new Date().getFullYear(),
        })

        // Update charity total
        await supabase.rpc('increment_charity_raised', {
          charity_id: sub.charity_id,
          amount: donationAmount,
        })
      }

      // Update subscription status
      await supabase.from('subscriptions').update({ status: 'active' }).eq('stripe_subscription_id', invoice.subscription as string)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions').update({
        status: sub.status as any,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await supabase.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', invoice.subscription as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
