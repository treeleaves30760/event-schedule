'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useEvents } from '@/app/contexts/EventContext';

export function AIEventCreator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { createEventFromAI } = useEvents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await createEventFromAI(prompt);

      if (result.success) {
        setPrompt('');
      } else {
        setError(result.error || 'Failed to create event');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Create Event with AI
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Try: "Submit project report by Friday 5pm" or "Team standup every Monday at 10am"'
          disabled={isLoading}
          error={error}
        />

        <Button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Event with AI
            </>
          )}
        </Button>
      </form>

      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        <p className="font-medium mb-1">Examples:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Complete homework assignment by tomorrow 11:59pm</li>
          <li>Schedule dentist appointment next week</li>
          <li>Prepare presentation for client meeting on Friday</li>
          <li>Review code before deployment</li>
        </ul>
      </div>
    </div>
  );
}
