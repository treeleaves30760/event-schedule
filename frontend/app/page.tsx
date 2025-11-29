'use client';

import { useState } from 'react';
import { Plus, LogOut, Calendar, Grid3x3, List } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useEvents } from './contexts/EventContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { EventCard } from './components/EventCard';
import { EventForm } from './components/EventForm';
import { AIEventCreator } from './components/AIEventCreator';
import { PriorityMatrix } from './components/PriorityMatrix';
import { CalendarView } from './components/CalendarView';
import { Button } from './components/ui/Button';
import { Card, CardContent, CardHeader } from './components/ui/Card';
import type { Event } from './types';

export default function Home() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { events, updateEvent, deleteEvent, createEvent, isLoading: eventsLoading } = useEvents();
  const [showRegister, setShowRegister] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'matrix' | 'calendar'>('calendar');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Event Schedule
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.name || user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="h-8"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'matrix' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('matrix')}
                  className="h-8"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Creation */}
          <div className="lg:col-span-1 space-y-6">
            <AIEventCreator />

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Manual Entry
                  </h2>
                  <Button size="sm" onClick={() => setShowEventForm(!showEventForm)} variant="outline">
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
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Events</span>
                    <span className="font-bold text-foreground text-lg">
                      {events.length}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                      {events.filter(e => e.completed).length}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Active</span>
                    <span className="font-bold text-primary text-lg">
                      {events.filter(e => !e.completed).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Events Display */}
          <div className="lg:col-span-2">
            {viewMode === 'calendar' ? (
              <CalendarView
                events={events}
                onEventClick={(event) => setEditingEvent(event)}
              />
            ) : viewMode === 'matrix' ? (
              <PriorityMatrix
                events={events}
                onEventClick={(event) => setEditingEvent(event)}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    Your Events
                  </h2>
                  {eventsLoading ? (
                    <div className="text-center text-muted-foreground py-12">
                      Loading events...
                    </div>
                  ) : events.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">
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
                          <h3 className="text-lg font-semibold text-foreground mt-8 mb-4">
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full shadow-lg">
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">
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
