'use client';

import { useState } from 'react';
import { Plus, LogOut, Calendar, Grid3x3 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useEvents } from './contexts/EventContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { EventCard } from './components/EventCard';
import { EventForm } from './components/EventForm';
import { AIEventCreator } from './components/AIEventCreator';
import { PriorityMatrix } from './components/PriorityMatrix';
import { Button } from './components/ui/Button';
import { Card, CardContent, CardHeader } from './components/ui/Card';
import type { Event } from './types';

export default function Home() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { events, updateEvent, deleteEvent, createEvent, isLoading: eventsLoading } = useEvents();
  const [showRegister, setShowRegister] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        {showRegister ? (
          <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
    );
  }

  const handleCreateEvent = async (data: any) => {
    await createEvent(data);
    setShowEventForm(false);
  };

  const handleUpdateEvent = async (data: any) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
      setEditingEvent(null);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    await updateEvent(id, { completed });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Event Schedule
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user.name || user.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}
              >
                {viewMode === 'list' ? <Grid3x3 className="w-4 h-4 mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                {viewMode === 'list' ? 'Matrix View' : 'List View'}
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Event Creation */}
          <div className="lg:col-span-1 space-y-6">
            <AIEventCreator />

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Manual Entry
                  </h2>
                  <Button size="sm" onClick={() => setShowEventForm(!showEventForm)}>
                    <Plus className="w-4 h-4 mr-1" />
                    New Event
                  </Button>
                </div>
              </CardHeader>
              {showEventForm && (
                <CardContent>
                  <EventForm
                    onSubmit={handleCreateEvent}
                    onCancel={() => setShowEventForm(false)}
                  />
                </CardContent>
              )}
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Events</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {events.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Completed</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {events.filter(e => e.completed).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Active</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {events.filter(e => !e.completed).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Events Display */}
          <div className="lg:col-span-2">
            {viewMode === 'matrix' ? (
              <PriorityMatrix
                events={events}
                onEventClick={(event) => setEditingEvent(event)}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    Your Events
                  </h2>
                  {eventsLoading ? (
                    <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                      Loading events...
                    </div>
                  ) : events.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                          No events yet. Create one using AI or manual entry!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {events
                        .filter(e => !e.completed)
                        .map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onEdit={setEditingEvent}
                            onDelete={deleteEvent}
                            onToggleComplete={handleToggleComplete}
                          />
                        ))}

                      {events.filter(e => e.completed).length > 0 && (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                            Completed Events
                          </h3>
                          {events
                            .filter(e => e.completed)
                            .map((event) => (
                              <EventCard
                                key={event.id}
                                event={event}
                                onEdit={setEditingEvent}
                                onDelete={deleteEvent}
                                onToggleComplete={handleToggleComplete}
                              />
                            ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Edit Event
              </h2>
            </CardHeader>
            <CardContent>
              <EventForm
                initialData={editingEvent}
                onSubmit={handleUpdateEvent}
                onCancel={() => setEditingEvent(null)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
