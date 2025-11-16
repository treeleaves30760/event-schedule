import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | null): string {
  if (!date) return 'No due date';

  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  } else if (days === 0) {
    return 'Due today';
  } else if (days === 1) {
    return 'Due tomorrow';
  } else if (days <= 7) {
    return `Due in ${days} days`;
  }

  return date.toLocaleDateString();
}

export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    event: 'bg-blue-500',
    homework: 'bg-purple-500',
    meeting: 'bg-green-500',
    task: 'bg-orange-500',
    reminder: 'bg-yellow-500',
    other: 'bg-gray-500',
  };

  return colors[type] || colors.other;
}

export function getUrgencyColor(urgency: number): string {
  if (urgency >= 4) return 'text-red-600 dark:text-red-400';
  if (urgency >= 3) return 'text-orange-600 dark:text-orange-400';
  return 'text-gray-600 dark:text-gray-400';
}

export function getImportanceColor(importance: number): string {
  if (importance >= 4) return 'text-purple-600 dark:text-purple-400';
  if (importance >= 3) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-600 dark:text-gray-400';
}
