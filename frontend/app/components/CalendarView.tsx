'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { getEventTypeColor } from '../lib/utils';
import type { Event } from '../types';

interface CalendarViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get the first day of the month
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  // Get the last day of the month
  const lastDayOfMonth = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }, [currentDate]);

  // Get the starting day of the week (0 = Sunday, 1 = Monday, etc.)
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Get number of days in the month
  const daysInMonth = lastDayOfMonth.getDate();

  // Generate calendar days (including previous and next month padding)
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }

    return days;
  }, [currentDate, startingDayOfWeek, daysInMonth]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, Event[]>();

    events.forEach((event) => {
      if (event.dueDate) {
        const dateKey = new Date(event.dueDate).toDateString();
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(event);
      }
    });

    return grouped;
  }, [events]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if a date is today
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if a date is in the past
  const isPast = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              <CalendarIcon className="w-4 h-4 mr-1" />
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const dateKey = date?.toDateString();
            const dayEvents = dateKey ? eventsByDate.get(dateKey) || [] : [];
            const today = isToday(date);
            const past = isPast(date);

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] border rounded-lg p-2
                  ${date ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
                  ${today ? 'border-blue-500 border-2' : 'border-gray-200 dark:border-gray-700'}
                  ${past && !today ? 'opacity-60' : ''}
                  transition-colors
                `}
              >
                {date && (
                  <>
                    {/* Date Number */}
                    <div
                      className={`
                        text-sm font-semibold mb-1
                        ${today
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-gray-100'
                        }
                      `}
                    >
                      {date.getDate()}
                    </div>

                    {/* Events for this day */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className={`
                            w-full text-left text-xs px-2 py-1 rounded
                            truncate hover:opacity-80 transition-opacity
                            ${getEventTypeColor(event.type)}
                            ${event.completed ? 'opacity-50 line-through' : ''}
                          `}
                          title={event.title}
                        >
                          {event.title}
                        </button>
                      ))}

                      {/* Show "+N more" if there are more events */}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-blue-500 rounded"></div>
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <span>Past</span>
              </div>
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Click on an event to edit
            </div>
          </div>
        </div>

        {/* Events without dates */}
        {events.filter(e => !e.dueDate).length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Events without due dates ({events.filter(e => !e.dueDate).length})
            </h3>
            <div className="space-y-1">
              {events
                .filter(e => !e.dueDate)
                .slice(0, 5)
                .map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`
                      w-full text-left text-xs px-3 py-2 rounded
                      hover:opacity-80 transition-opacity
                      ${getEventTypeColor(event.type)}
                      ${event.completed ? 'opacity-50 line-through' : ''}
                    `}
                  >
                    {event.title}
                  </button>
                ))}
              {events.filter(e => !e.dueDate).length > 5 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 px-3">
                  +{events.filter(e => !e.dueDate).length - 5} more without dates
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
