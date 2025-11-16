# Event Schedule

A modern, AI-powered event scheduling and prioritization application with multi-user authentication and flexible database support.

## Overview

Event Schedule helps you organize and prioritize your events, tasks, and deadlines using a visual priority matrix system. Create events using natural language powered by OpenAI, manage multiple event types, and access your schedule programmatically via API.

## Key Features

- **Visual Priority Matrix**: 5x5 grid visualization based on urgency (1-5) and importance (1-5)
- **AI-Powered Event Creation**: Use natural language to create events with OpenAI GPT-4
- **Multiple Event Types**: Support for events, homework, meetings, tasks, and reminders
- **Dual Authentication**: Local JWT-based authentication and Auth0 OAuth integration
- **API Access**: Generate personal API tokens for programmatic event management
- **Flexible Database**: Choose between SQLite (local development) or PostgreSQL (production with Supabase)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode**: Full dark mode support throughout the application

## Project Structure

```
event-schedule/
├── frontend/          # Next.js application
│   ├── app/          # App router pages and API routes
│   ├── components/   # React components
│   ├── lib/          # Utility functions and configurations
│   ├── migrations/   # Database migration files
│   └── scripts/      # Setup and migration scripts
├── Expectation.md    # Project requirements and specifications
└── README.md         # This file
```

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-schedule
   ```

2. **Navigate to frontend and follow setup**
   ```bash
   cd frontend
   ```

   See [frontend/README.md](./frontend/README.md) for detailed setup instructions.

## Technology Stack

### Frontend & Backend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling

### Database & ORM
- **Prisma** - Type-safe database ORM
- **SQLite** - Local development database
- **PostgreSQL** - Production database (via Supabase)

### Authentication
- **JWT** - Local authentication with bcrypt
- **Auth0** - OAuth 2.0 / OpenID Connect

### AI Integration
- **OpenAI GPT-4** - Natural language event parsing

### Additional Libraries
- **Zod** - Runtime type validation
- **date-fns** - Date manipulation
- **Lucide React** - Icon library

## Use Cases

- **Students**: Manage homework, exams, and study sessions with priority visualization
- **Professionals**: Track meetings, deadlines, and project tasks
- **Teams**: Coordinate events and access schedules via API
- **Developers**: Integrate event scheduling into other applications using API tokens

## Features in Detail

### Visual Priority Matrix
Events are displayed in a 5x5 grid where:
- **X-axis (Urgency)**: How time-sensitive is this event? (1 = not urgent, 5 = very urgent)
- **Y-axis (Importance)**: How critical is this to your goals? (1 = low importance, 5 = high importance)

This helps you focus on what matters most: urgent AND important tasks.

### AI Event Creation
Simply describe your event in natural language:
- "Submit CS homework by tomorrow 5pm"
- "Team standup meeting next Monday at 9am"
- "Review pull requests before Friday"

The AI automatically extracts:
- Event title and description
- Date and time
- Event type
- Suggested urgency and importance levels

### API Access
Generate API tokens and integrate with:
- Calendar applications
- Task management tools
- Custom scripts and automation
- Team collaboration platforms

## Contributing

This is a personal project. Feel free to fork and modify for your own use.

## License

This project is open source and available for personal and educational use.

## Support

For questions, issues, or feature requests, please open an issue on the repository.

## Development Status

This project is actively maintained and under development. New features and improvements are added regularly.
