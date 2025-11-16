'use client';

import React from 'react';
import { Trash2, Edit2, CheckCircle, Circle } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { formatDate, getEventTypeColor, cn } from '@/app/lib/utils';
import type { Event } from '@/app/types';

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

export function EventCard({ event, onEdit, onDelete, onToggleComplete }: EventCardProps) {
  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        event.completed && 'opacity-60'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full',
                  getEventTypeColor(event.type)
                )}
              />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {event.type}
              </span>
            </div>

            <h3
              className={cn(
                'text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1',
                event.completed && 'line-through'
              )}
            >
              {event.title}
            </h3>

            {event.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                Urgency: {event.urgency}/5
              </span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                Importance: {event.importance}/5
              </span>
              {event.dueDate && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {formatDate(event.dueDate)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleComplete?.(event.id, !event.completed)}
              className="p-2"
            >
              {event.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(event)}
                className="p-2"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(event.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
