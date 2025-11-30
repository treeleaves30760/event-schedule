'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/app/lib/api-client';
import type { Event, CreateEventInput, UpdateEventInput } from '@/app/types';
import { useAuth } from './AuthContext';

interface EventContextType {
  events: Event[];
  isLoading: boolean;
  fetchEvents: (params?: { completed?: boolean; type?: string }) => Promise<void>;
  createEvent: (data: CreateEventInput) => Promise<{ success: boolean; event?: Event; error?: string }>;
  updateEvent: (id: string, data: UpdateEventInput) => Promise<{ success: boolean; error?: string }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; error?: string }>;
  createEventFromAI: (prompt: string) => Promise<{ success: boolean; data?: any[]; message?: string; error?: string }>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated]);

  const fetchEvents = async (params?: { completed?: boolean; type?: string }) => {
    setIsLoading(true);
    try {
      const response = await apiClient.getEvents(params);

      if (response.success && response.data) {
        // Convert date strings to Date objects
        const eventsWithDates = response.data.map(event => ({
          ...event,
          dueDate: event.dueDate ? new Date(event.dueDate) : null,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
        }));
        setEvents(eventsWithDates);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (data: CreateEventInput) => {
    try {
      const response = await apiClient.createEvent(data);

      if (response.success && response.data) {
        const newEvent = {
          ...response.data,
          dueDate: response.data.dueDate ? new Date(response.data.dueDate) : null,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };
        setEvents(prev => [...prev, newEvent]);
        return { success: true, event: newEvent };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Failed to create event' };
    }
  };

  const updateEvent = async (id: string, data: UpdateEventInput) => {
    try {
      const response = await apiClient.updateEvent(id, data);

      if (response.success && response.data) {
        const updatedEvent = {
          ...response.data,
          dueDate: response.data.dueDate ? new Date(response.data.dueDate) : null,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        };
        setEvents(prev =>
          prev.map(event => (event.id === id ? updatedEvent : event))
        );
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Failed to update event' };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await apiClient.deleteEvent(id);

      if (response.success) {
        setEvents(prev => prev.filter(event => event.id !== id));
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'Failed to delete event' };
    }
  };

  const createEventFromAI = async (prompt: string) => {
    try {
      const response = await fetch('/api/events/ai-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      // Refresh events to show new/updated ones
      await fetchEvents();

      return { 
        success: true, 
        data: data.data,
        message: data.message 
      };
    } catch (error) {
      console.error('Error creating event from AI:', error);
      return { success: false, error: 'Failed to create event' };
    }
  };

  return (
    <EventContext.Provider
      value={{
        events,
        isLoading,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        createEventFromAI,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
}
