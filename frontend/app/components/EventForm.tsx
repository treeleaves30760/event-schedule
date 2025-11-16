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

export function EventForm({ onSubmit, onCancel, initialData }: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: (initialData?.type as any) || 'event',
    urgency: initialData?.urgency || 3,
    importance: initialData?.importance || 3,
    dueDate: initialData?.dueDate || undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
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
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
        >
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
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

      <Input
        type="datetime-local"
        label="Due Date (optional)"
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
      />

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
