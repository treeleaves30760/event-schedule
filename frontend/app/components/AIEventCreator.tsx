'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { useEvents } from '@/app/contexts/EventContext';

export function AIEventCreator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { createEventFromAI } = useEvents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResultMessage(null);

    try {
      const result = await createEventFromAI(prompt);

      if (result.success) {
        setPrompt('');
        const count = Array.isArray(result.data) ? result.data.length : 1;
        setResultMessage({ 
          type: 'success', 
          text: result.message || `Successfully processed ${count} event${count !== 1 ? 's' : ''}` 
        });
        
        // Clear success message after 5 seconds
        setTimeout(() => setResultMessage(null), 5000);
      } else {
        setResultMessage({ type: 'error', text: result.error || 'Failed to process events' });
      }
    } catch (err) {
      setResultMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Create & Update Events with AI
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Try: "Meeting tomorrow at 2pm. Change the Team Standup to 11am."'
            disabled={isLoading}
            className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y text-sm"
          />
        </div>

        {resultMessage && (
          <div className={`text-sm flex items-center gap-2 ${
            resultMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {resultMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {resultMessage.text}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Process Events
            </>
          )}
        </Button>
      </form>

      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        <p className="font-medium mb-1">You can create multiple events or update existing ones:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>"Submit report by Friday and schedule dentist for Monday 10am"</li>
          <li>"Change the Project Review meeting to 3pm"</li>
          <li>"Add a reminder to call Mom tonight"</li>
        </ul>
      </div>
    </div>
  );
}
