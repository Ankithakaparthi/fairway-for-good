import { type ClassValue, clsx } from 'clsx'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy')
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yy')
}

export function getMonthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleString('en-GB', { month: 'long' })
}

export function getScoreColor(score: number): string {
  if (score >= 36) return 'text-emerald-400'
  if (score >= 28) return 'text-green-400'
  if (score >= 20) return 'text-gold-400'
  if (score >= 12) return 'text-amber-400'
  return 'text-red-400'
}

export function getScoreLabel(score: number): string {
  if (score >= 36) return 'Excellent'
  if (score >= 28) return 'Good'
  if (score >= 20) return 'Average'
  if (score >= 12) return 'Below Average'
  return 'Poor'
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case 'match5': return '5-Number Match'
    case 'match4': return '4-Number Match'
    case 'match3': return '3-Number Match'
    default: return 'No Match'
  }
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case 'match5': return 'bg-gold-400 text-gold-900'
    case 'match4': return 'bg-forest-400 text-forest-900'
    case 'match3': return 'bg-forest-600 text-white'
    default: return 'bg-gray-700 text-gray-300'
  }
}

export function calculateCharityAmount(subscriptionAmount: number, percentage: number): number {
  return (subscriptionAmount * percentage) / 100
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
