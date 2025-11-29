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
        'transition-all duration-200 hover:shadow-md hover:border-primary/20',
        event.completed && 'opacity-60 bg-muted/50'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'inline-block w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-card',
                  getEventTypeColor(event.type)
                )}
              />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {event.type}
              </span>
            </div>

            <h3
              className={cn(
                'text-lg font-semibold text-foreground mb-1',
                event.completed && 'line-through text-muted-foreground'
              )}
            >
              {event.title}
            </h3>

            {event.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md font-medium">
                Urgency: {event.urgency}/5
              </span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md font-medium">
                Importance: {event.importance}/5
              </span>
              {event.dueDate && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md font-medium">
                  {formatDate(event.dueDate)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleComplete?.(event.id, !event.completed)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            >
              {event.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(event)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(event.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
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
