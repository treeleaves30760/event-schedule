'use client';

import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import type { CreateEventInput, Event } from '@/app/types';

interface EventFormProps {
  onSubmit: (data: CreateEventInput) => Promise<void>;
  onCancel?: () => void;
  initialData?: Event;
}

const eventTypes = ['event', 'homework', 'meeting', 'task', 'reminder', 'other'];

// Event types that use start/end time (scheduled events)
const scheduledEventTypes = ['event', 'meeting'];

// Event types that use due date (deadline-based tasks)
const deadlineEventTypes = ['homework', 'task', 'reminder', 'other'];

export function EventForm({ onSubmit, onCancel, initialData }: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: (initialData?.type as any) || 'event',
    urgency: initialData?.urgency || 3,
    importance: initialData?.importance || 3,
    dueDate: initialData?.dueDate || undefined,
    startTime: initialData?.startTime || undefined,
    endTime: initialData?.endTime || undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine which time fields to show based on event type
  const showScheduledTime = scheduledEventTypes.includes(formData.type);
  const showDueDate = deadlineEventTypes.includes(formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle event type change - clear incompatible time fields
  const handleTypeChange = (newType: string) => {
    const updates: any = { type: newType };

    // If switching to scheduled event type, clear due date
    if (scheduledEventTypes.includes(newType)) {
      updates.dueDate = undefined;
    }

    // If switching to deadline event type, clear start/end time
    if (deadlineEventTypes.includes(newType)) {
      updates.startTime = undefined;
      updates.endTime = undefined;
    }

    setFormData({ ...formData, ...updates });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Enter event title"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter event description (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Type
        </label>
        <select
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.type}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {scheduledEventTypes.includes(formData.type)
            ? '📅 Scheduled event - uses start and end time'
            : '⏰ Deadline-based - uses due date'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Urgency (1-5)
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.urgency}
            onChange={(e) =>
              setFormData({ ...formData, urgency: parseInt(e.target.value) })
            }
            className="w-full"
          />
          <div className="text-center text-2xl font-bold text-red-600 dark:text-red-400">
            {formData.urgency}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Importance (1-5)
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.importance}
            onChange={(e) =>
              setFormData({ ...formData, importance: parseInt(e.target.value) })
            }
            className="w-full"
          />
          <div className="text-center text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formData.importance}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Show Start/End Time for scheduled events (Event, Meeting) */}
        {showScheduledTime && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Start Time"
              value={
                formData.startTime
                  ? new Date(formData.startTime).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  startTime: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
              required
            />

            <Input
              type="datetime-local"
              label="End Time (optional)"
              value={
                formData.endTime
                  ? new Date(formData.endTime).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endTime: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
            />
          </div>
        )}

        {/* Show Due Date for deadline-based events (Homework, Task, Reminder, Other) */}
        {showDueDate && (
          <Input
            type="datetime-local"
            label="Due Date"
            value={
              formData.dueDate
                ? new Date(formData.dueDate).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                dueDate: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
            required
          />
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : initialData ? 'Update Event' : 'Create Event'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
