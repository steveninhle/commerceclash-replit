# Commerce Clash

<div align="center">

![Commerce Clash Logo](./public/images/CommerceClash%20Logo%20Black.png)

**A Gamified Educational Platform for Business Learning**

[![Built by Texagon.io](https://img.shields.io/badge/Built%20by-Texagon.io-blue)](https://texagon.io)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.4-646cff)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE.md)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
  - [System Architecture](#system-architecture)
  - [Component Architecture](#component-architecture)
  - [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Development](#development)
  - [Available Scripts](#available-scripts)
  - [Code Quality](#code-quality)
- [Deployment](#deployment)
  - [Docker Deployment](#docker-deployment)
  - [Production Build](#production-build)
- [Features Deep Dive](#features-deep-dive)
  - [Teacher Dashboard](#teacher-dashboard)
  - [Student Portal](#student-portal)
  - [Gamification System](#gamification-system)
  - [Zoom Integration](#zoom-integration)
- [API Integration](#api-integration)
- [Browser Compatibility](#browser-compatibility)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [FAQ](#faq)
- [Performance Optimization](#performance-optimization)
- [Contributing](#contributing)
- [License](#license)
- [About Texagon.io](#about-texagonio)

---

## Overview

**Commerce Clash** is an innovative educational platform that gamifies business learning experiences. Built by [Texagon.io](https://texagon.io), it combines classroom management, video conferencing, and role-playing game mechanics to create an engaging learning environment where students compete as business tycoons.

The platform enables teachers to create virtual classrooms, manage students, conduct Zoom meetings, and track student progress through a sophisticated skill-based progression system. Students can choose from different business personas (Heroes), allocate skill points across business categories, compete for market share, and use special perks to gain advantages.

---

## Key Features

### For Teachers
- **Class Management**: Create and manage multiple virtual classrooms
- **Student Oversight**: Track student progress, skills, and performance metrics
- **Zoom Integration**: Schedule and conduct virtual meetings directly from the platform
- **Performance Analytics**: Monitor student engagement and skill development
- **XP & Rewards System**: Award experience points and manage student progression
- **Market Share Tracking**: Oversee competitive dynamics between students
- **CEO Assignment**: Designate top-performing students as class CEOs
- **Data Export**: Export class data for analysis and record-keeping

### For Students
- **Hero Selection**: Choose from 6 unique business personas with different playstyles
- **Skill Tree System**: Allocate points across 5 business skill categories
- **Market Share Competition**: Compete with classmates for market dominance
- **Power-Ups & Perks**: Unlock and use special abilities to gain advantages
- **Real-time Updates**: Experience live updates during competitive scenarios
- **Progress Tracking**: Monitor personal growth and achievements
- **Course Enrollment**: Join and manage multiple courses
- **Interactive Meetings**: Participate in Zoom classes directly from the platform

### Platform Features
- **Role-Based Access Control**: Separate interfaces for teachers and students
- **Real-time Communication**: WebSocket-powered live updates
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Theme Support**: Adaptive theming for user preference
- **Secure Authentication**: Cookie-based session management
- **Dockerized Deployment**: Easy containerized deployment

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Commerce Clash Frontend                   │
│                        (React + TypeScript)                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼────────┐          ┌──────▼──────┐
            │  REST API      │          │  WebSocket  │
            │  (Axios)       │          │  (Socket.io)│
            └───────┬────────┘          └──────┬──────┘
                    │                           │
            ┌───────▼───────────────────────────▼──────┐
            │          Backend API Server               │
            │      (VITE_BASE_URL)                     │
            └───────┬───────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼───┐  ┌───▼───┐  ┌───▼────┐
    │Database│  │ Zoom  │  │Storage │
    │        │  │  SDK  │  │        │
    └────────┘  └───────┘  └────────┘
```

### Component Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                          App.tsx                              │
│                      (Root Component)                         │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              UserProvider (Context)                     │  │
│  │         (Authentication & User State)                   │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │          BrowserRouter                            │  │  │
│  │  │                                                   │  │  │
│  │  │  ┌─────────────────────────────────────────────┐ │  │  │
│  │  │  │         Navigation / Routes                  │ │  │  │
│  │  │  │                                              │ │  │  │
│  │  │  │  ┌──────────────┬──────────────────────┐   │ │  │  │
│  │  │  │  │   Public     │    Protected         │   │ │  │  │
│  │  │  │  │   Routes     │    Routes            │   │ │  │  │
│  │  │  │  │              │                      │   │ │  │  │
│  │  │  │  │ • Sign In    │ • Teacher Dashboard  │   │ │  │  │
│  │  │  │  │ • Sign Up    │ • Student Courses    │   │ │  │  │
│  │  │  │  │              │ • Student Details    │   │ │  │  │
│  │  │  │  │              │ • Zoom Meeting       │   │ │  │  │
│  │  │  │  │              │ • Market Share       │   │ │  │  │
│  │  │  │  └──────────────┴──────────────────────┘   │ │  │  │
│  │  │  └─────────────────────────────────────────────┘ │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Action                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Component      │
                    │  Event Handler  │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼────────┐        ┌──────▼──────┐
        │  API Client    │        │   Local     │
        │  (axiosInstance)│        │   State     │
        └───────┬────────┘        └──────┬──────┘
                │                         │
        ┌───────▼────────┐                │
        │  Transformers  │                │
        │  (Request)     │                │
        └───────┬────────┘                │
                │                         │
        ┌───────▼────────┐                │
        │  Backend API   │                │
        │  + WebSocket   │                │
        └───────┬────────┘                │
                │                         │
        ┌───────▼────────┐                │
        │  Transformers  │                │
        │  (Response)    │                │
        └───────┬────────┘                │
                │                         │
                └────────────┬────────────┘
                             │
                    ┌────────▼────────┐
                    │  State Update   │
                    │  (Context/Local)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  UI Re-render   │
                    └─────────────────┘
```

---

## Technology Stack

### Frontend Core
- **React 18.3.1** - UI library for building interactive interfaces
- **TypeScript 5.8.3** - Type-safe JavaScript superset
- **Vite 7.0.4** - Next-generation frontend build tool
- **React Router DOM 7.9.1** - Client-side routing

### UI Framework & Styling
- **Tailwind CSS 4.1.13** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives
  - Alert Dialog, Avatar, Dialog, Label, Select, Slot, Tabs
- **shadcn/ui** - Re-usable component collection
- **Lucide React 0.544.0** - Icon library
- **Lottie React 2.4.1** - Animation library
- **next-themes 0.4.6** - Theme management (dark/light mode)
- **class-variance-authority 0.7.1** - Component variant styling
- **tailwind-merge 3.3.1** - Merge Tailwind classes intelligently
- **tailwind-scrollbar-hide 4.0.0** - Hide scrollbars utility

### Data & Communication
- **Axios 1.12.2** - HTTP client for API requests
- **Socket.io Client 4.8.1** - Real-time bidirectional communication
- **@zoom/meetingsdk 4.0.0** - Zoom video conferencing integration

### Data Visualization
- **Recharts 3.2.1** - Composable charting library

### UI Feedback
- **Sonner 2.0.7** - Toast notification system

### Development Tools
- **ESLint 9.31.0** - Code linting
- **TypeScript ESLint 8.37.0** - TypeScript-specific linting rules
- **@vitejs/plugin-react-swc 3.10.2** - Fast Refresh with SWC compiler
- **tw-animate-css 1.3.8** - Tailwind animation utilities

### Deployment
- **Docker** - Containerization
- **Nginx** - Web server for production
- **Node.js 22 Alpine** - Build environment

---

## Project Structure

```
zach-frontend/
├── .claude/                      # Claude Code configuration
│   └── settings.local.json
├── public/                       # Static assets
│   └── images/
│       ├── CommerceClash Logo Black.png
│       ├── CommerceClash Logo White.png
│       └── meetingsdk-web-*.gif
├── src/
│   ├── api/                      # API layer
│   │   ├── apiClient.ts         # API service functions
│   │   ├── axiosInstance.ts     # Axios configuration & interceptors
│   │   ├── endpoints.ts         # API endpoint definitions
│   │   └── index.ts
│   ├── assets/                   # Images, SVGs, animations
│   │   ├── animations/          # Lottie animation files
│   │   ├── images/              # Static images (heroes, logos)
│   │   └── svgs/                # SVG icons and graphics
│   ├── components/               # Reusable components
│   │   ├── ui/                  # shadcn/ui base components
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── header.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── switch.tsx
│   │   │   └── tabs.tsx
│   │   ├── AssignStudentCeo.tsx # CEO assignment component
│   │   ├── Ceo.tsx              # CEO display component
│   │   ├── CeoTeacherSkeleton.tsx
│   │   ├── ClassSection.tsx     # Class listing component
│   │   ├── ConfirmSkillModal.tsx # Skill confirmation dialog
│   │   ├── createMeetingDialog.tsx # Zoom meeting creation
│   │   ├── DateTimeInput.tsx    # Custom date/time picker
│   │   ├── DeleteConfirmationDialog.tsx
│   │   ├── dummyData.ts         # Hero definitions & skill categories
│   │   ├── EditButton.tsx
│   │   ├── EnrolledCoursesCard.tsx
│   │   ├── formField.tsx
│   │   ├── Gamification.tsx     # Gamification stats display
│   │   ├── HeroCard.tsx         # Hero selection card
│   │   ├── HeroCardSkeleton.tsx
│   │   ├── MarketShare.tsx      # Market share visualization
│   │   ├── MarketShareModal.tsx
│   │   ├── MeetingCard.tsx      # Zoom meeting card
│   │   ├── NumberInput.tsx
│   │   ├── Performance.tsx      # Performance metrics
│   │   ├── PerformancePanel.tsx
│   │   ├── PerformanceSkeleton.tsx
│   │   ├── PowerUpButton.tsx    # Perk activation button
│   │   ├── ProgressBar.tsx
│   │   ├── ReveredIconModal.tsx # Special perk modal
│   │   ├── RivalSkillTreesModal.tsx # View opponent skills
│   │   ├── SabotageRedistributeModal.tsx
│   │   ├── SabotageTargetModal.tsx
│   │   ├── ScenarioSelectionModal.tsx
│   │   ├── SkillAllocator.tsx   # Pentagon skill point allocator
│   │   ├── SkillBadge.tsx
│   │   ├── Skills.tsx           # Skill management component
│   │   ├── SkillsSkeleton.tsx
│   │   ├── StudentBadge.tsx
│   │   ├── StudentCard.tsx
│   │   ├── StudentInfo.tsx
│   │   ├── StudentMultiSelect.tsx
│   │   ├── StudentSkillCard.tsx
│   │   ├── StudentXpInputRow.tsx
│   │   ├── StudentXpModal.tsx   # XP award modal
│   │   ├── TextInput.tsx
│   │   ├── TrendsetterModal.tsx
│   │   └── types.ts             # Component type definitions
│   ├── context/                  # React Context providers
│   │   └── userContext/
│   │       └── userContext.tsx  # User authentication state
│   ├── hooks/                    # Custom React hooks
│   │   ├── useWidth.ts          # Responsive width hook
│   │   └── index.ts
│   ├── lib/                      # Utility libraries
│   │   └── utils.ts             # Common utility functions
│   ├── pages/                    # Page components
│   │   ├── Auth/
│   │   │   ├── signIn.tsx       # Login page
│   │   │   └── signUp.tsx       # Registration page
│   │   ├── home/
│   │   │   └── home.tsx         # Home page
│   │   ├── notFound/
│   │   │   └── notFound.tsx     # 404 page
│   │   ├── studentDetails/
│   │   │   └── studentDetails.tsx # Individual student view
│   │   ├── studentEnrolledCourses/
│   │   │   ├── studentEnrolledCourses.tsx
│   │   │   └── types.ts
│   │   ├── teacherDashboard/
│   │   │   ├── studentDashboard.tsx
│   │   │   ├── teacherDashboard.tsx
│   │   │   └── zoommeetingDashboard.tsx
│   │   ├── zoom/
│   │   │   └── zoom.tsx         # Zoom meeting interface
│   │   └── index.ts             # Page exports
│   ├── routes/                   # Routing configuration
│   │   ├── protected/
│   │   │   └── protect.tsx      # Protected route wrapper
│   │   ├── public/
│   │   │   └── public.tsx       # Public route wrapper
│   │   ├── index.tsx            # Main router
│   │   └── types.ts
│   ├── transformers/             # Data transformers
│   │   ├── request.ts           # Request payload transformers
│   │   ├── response.ts          # Response data transformers
│   │   ├── types.ts
│   │   └── index.ts
│   ├── utils/                    # Utility functions
│   │   ├── helper.ts            # Helper functions
│   │   └── validations.ts       # Input validation
│   ├── App.css                   # Global app styles
│   ├── App.tsx                   # Root component
│   ├── index.css                 # Global CSS & Tailwind imports
│   ├── main.tsx                  # Application entry point
│   └── vite-env.d.ts            # Vite TypeScript definitions
├── .gitignore                    # Git ignore rules
├── components.json               # shadcn/ui configuration
├── Dockerfile                    # Docker container definition
├── eslint.config.js             # ESLint configuration
├── index.html                    # HTML entry point
├── LICENSE.md                    # MIT License
├── nginx.conf                    # Nginx server configuration
├── package.json                  # NPM dependencies & scripts
├── package-lock.json             # Locked dependency versions
├── tsconfig.json                 # TypeScript configuration
├── tsconfig.app.json            # App-specific TS config
├── tsconfig.node.json           # Node-specific TS config
├── vite.config.ts               # Vite configuration
└── README.md                     # This file
```

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Docker** (optional, for containerized deployment) - [Download](https://www.docker.com/)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd zach-frontend
```

2. **Install dependencies**

```bash
npm install
```

This will install all required packages listed in `package.json`.

3. **Set up environment variables**

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Then edit `.env` and set your backend API URL and Stripe publishable key:

```bash
# .env
VITE_BASE_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

### Environment Variables

The frontend uses one `.env` file for both development and production builds. `.env.example` is the committed template; `.env` is ignored by Git. Do not add `.env.development`, `.env.production`, or `.env.local` files. Restart the development server after changing `.env`; rebuild and redeploy for production changes. Deployment environment variables and build arguments can override values in `.env`.

#### Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_BASE_URL` | Base URL of the backend API server. Used for all HTTP requests and WebSocket connections. | Yes | `https://api.commerceclash.com` or `http://localhost:3000` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key from the same account and sandbox/live mode as the backend Stripe secret key. | For checkout | `pk_test_your_publishable_key` |

**Why it's needed:**
- The frontend uses this URL to communicate with the backend REST API for all data operations (authentication, student management, class operations, etc.)
- WebSocket connections for real-time features (live skill updates, market share changes) also use this base URL
- The Axios instance in `src/api/axiosInstance.ts` is configured with this URL
- Multiple components use this for Socket.io connections to enable real-time updates

**Important Notes:**
- Do NOT include a trailing slash in the URL
- For local development, typically use `http://localhost:3000` (adjust port as needed)
- For production, use the HTTPS URL of your deployed backend
- The `VITE_` prefix is required for Vite to expose the variable to the client-side code

### Running the Application

#### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

#### Development with Network Access

To access the dev server from other devices on your network:

```bash
npm run host
```

The application will be accessible at your local IP address (e.g., `http://192.168.1.x:5173`)

#### Preview Production Build

Build and preview the production version locally:

```bash
npm run build
npm run preview
```

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run host` | Start development server with network access |
| `npm run build` | Build for production (TypeScript check + Vite build) |
| `npm run lint` | Run ESLint to check code quality |
| `npm run preview` | Preview production build locally |

### Code Quality

The project uses ESLint for code quality and consistency. Run linting before committing:

```bash
npm run lint
```

**ESLint Configuration:**
- React Hooks rules enforcement
- React Refresh compatibility
- TypeScript-specific linting
- Modern ES6+ globals

---

## Deployment

### Docker Deployment

The application includes a multi-stage Dockerfile optimized for production deployment.

#### Build Arguments

When building the Docker image, you must provide the backend API URL:

```bash
docker build \
  --build-arg VITE_BASE_URL=https://api.commerceclash.com \
  -t commerce-clash:latest .
```

#### Run Container

```bash
docker run -d \
  -p 80:80 \
  --name commerce-clash \
  commerce-clash:latest
```

The application will be available at `http://localhost`

#### Docker Compose (Optional)

Create a `docker-compose.yml` for easier management:

```yaml
version: '3.8'
services:
  frontend:
    build:
      context: .
      args:
        VITE_BASE_URL: https://api.commerceclash.com
    ports:
      - "80:80"
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

### Production Build

For non-Docker deployments:

1. **Build the application**

```bash
VITE_BASE_URL=https://api.commerceclash.com npm run build
```

2. **Deploy the `dist` folder**

The `dist` folder contains the optimized static files. Deploy to any static hosting service:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Azure Static Web Apps
- Railway
- etc.

3. **Configure Server**

For SPA routing to work, configure your server to serve `index.html` for all routes. The included `nginx.conf` provides this configuration for Nginx servers.

---

## Features Deep Dive

### Teacher Dashboard

The teacher dashboard provides comprehensive classroom management capabilities:

#### Class Management
- **Create Classes**: Set up new courses with custom details
- **Zoom Integration**: Schedule Zoom meetings directly from the dashboard
- **Student Roster**: View all enrolled students with status indicators
- **Class Status Toggle**: Enable/disable classes as needed
- **Delete Classes**: Remove classes and associated meetings

#### Student Management
- **Add Students**: Enroll new students in classes
- **Edit Student Details**: Update student information
- **Toggle Student Status**: Activate/deactivate student accounts
- **Delete Students**: Remove students from the system
- **Individual Student View**: Deep dive into individual student performance

#### Performance Tracking
- **XP Management**: Award experience points to students
- **Skill Monitoring**: View student skill allocations
- **Market Share Overview**: Track competitive standings
- **CEO Assignment**: Designate top performers as class CEOs
- **Export Data**: Download class data for external analysis

#### Real-time Features
- **Live Updates**: See student skill changes in real-time
- **Instant Notifications**: Receive toast notifications for important events
- **WebSocket Integration**: Real-time synchronization across all connected clients

### Student Portal

Students access a personalized learning experience:

#### Hero Selection
- **6 Unique Heroes**: Choose from distinct business personas
  - The Baron (Tyrant of Wealth)
  - The Tycoon (Unstoppable Force)
  - The Diplomat (Master of Influence)
  - The Visionary (Shaper of Destiny)
  - The Explorer (Trailblazer of Fate)
  - The General (Voice of Authority)
- **Hero Attributes**: Each hero has unique difficulty, playstyle, and stats
- **Perks System**: Unlock Core and Ultra tier abilities

#### Skill Management
- **Pentagon Skill Tree**: Visual skill point allocation across 5 categories
- **Dynamic Allocation**: Increase/decrease skills with real-time updates
- **Skill Confirmation**: Lock in skill choices for scenarios
- **Skill Redistribution**: Reallocate points between categories

#### Competition
- **Market Share**: Compete for market dominance
- **Rival Skill Trees**: View competitor skill allocations
- **Scenario Participation**: Engage in business challenges
- **Leaderboard**: Track standing among peers

#### Power-Ups & Perks
- **Sabotage**: Remove opponent skill points
- **Trendsetter**: Steal market share from rivals
- **Moment of Glory**: Special temporary advantages
- **Strategic Activation**: Use perks at optimal times

### Gamification System

The gamification engine drives student engagement:

#### XP (Experience Points)
- Teachers award XP based on performance
- XP unlocks new abilities and perks
- Visible progress tracking
- Cumulative advancement

#### Market Share
- Percentage-based competitive metric
- Visual representation with charts (Recharts)
- Dynamic updates during scenarios
- Win condition tracking

#### Skill Categories
Five business skill categories form a pentagon visualization:
1. **Innovation** - Top vertex
2. **Quality** - Upper-right vertex
3. **Team** - Lower-right vertex
4. **Logistics** - Lower-left vertex
5. **Marketing** - Upper-left vertex

Students allocate points across these categories to optimize for different scenarios.

#### Perks System
Two-tier perk system:
- **Core Perks**: Baseline abilities for each hero
- **Ultra Perks**: Advanced abilities unlocked through progression

### Zoom Integration

Seamless video conferencing integration:

- **Zoom Meeting SDK**: Embedded Zoom client
- **Direct Join**: One-click meeting access
- **Meeting Scheduling**: Create meetings with date/time selection
- **Meeting Management**: View, edit, and delete scheduled meetings
- **In-App Experience**: No external Zoom app required
- **Automatic Authentication**: Seamless session management

---

## API Integration

### API Client Architecture

The application uses a layered API architecture:

#### Axios Instance (`src/api/axiosInstance.ts`)
- **Base Configuration**: Centralized base URL and timeout
- **Credentials**: Automatic cookie inclusion for authentication
- **Request Interceptor**: Adds credentials to all requests
- **Response Interceptor**: Handles 401 unauthorized errors with automatic logout
- **Error Handling**: Graceful error propagation

#### Endpoints (`src/api/endpoints.ts`)
Centralized API endpoint definitions with path parameters:
- Authentication: `/auth/signin`, password setup and recovery endpoints
- Class Management: `/class/*`
- Student Operations: `/student/*`, `/teacher/*/students/*`
- Skills: `/student/*/classes/*/skills`
- Perks: `/class/*/students/*/perks/*`
- Market Share: `/class/*/students/market-share`
- CEO Management: `/class/*/students/*/assign-ceo`

#### Student registration and checkout

The only public registration and payment entry is `/choose-class` → `/checkout`. After payment, new students receive an email linking to `/set-password`, then continue to `/choose-ceo`. The login form serves existing accounts.

Old `/register`, `/auth/signup`, and `/payment/cancel` URLs redirect to `/choose-class`. Opening `/checkout` without a selected cohort also redirects there. `/payment/success` remains available only to finish payments started through the retired hosted checkout paths.

#### API Client (`src/api/apiClient.ts`)
Service layer with typed functions for all API operations. Provides a clean interface for components to interact with the backend.

#### Transformers (`src/transformers/`)
Data transformation layer:
- **Request Transformers**: Format client data for API consumption
- **Response Transformers**: Normalize API responses for frontend use
- **Type Safety**: Ensures data consistency across the application

### WebSocket Integration

Real-time features powered by Socket.io:

```typescript
// Example: Real-time skill updates
import io from 'socket.io-client';

const CONNECTION_URL = import.meta.env.VITE_BASE_URL;
const socket = io(CONNECTION_URL);

socket.on('skillUpdated', (data) => {
  // Handle real-time skill updates
});
```

Components using WebSocket:
- `HeroCard.tsx` - Real-time hero selection updates
- `SkillAllocator.tsx` - Live skill point changes
- `Skills.tsx` - Skill confirmation synchronization
- `Ceo.tsx` - CEO assignment notifications
- `AssignStudentCeo.tsx` - CEO selection updates
- `studentEnrolledCourses.tsx` - Course enrollment changes

---

## Browser Compatibility

Commerce Clash is tested and supported on the following browsers:

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Recommended for best performance |
| Firefox | 88+ | Fully supported |
| Safari | 14+ | Fully supported |
| Edge | 90+ | Chromium-based, fully supported |
| Opera | 76+ | Fully supported |

**Important Notes:**
- **Zoom Integration**: Requires a modern browser with WebRTC support
- **WebSocket Support**: All supported browsers have native WebSocket support
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **JavaScript**: Must be enabled
- **Cookies**: Must be enabled for authentication

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Application won't start

**Problem**: `npm run dev` fails or shows errors

**Solutions**:
- Ensure Node.js version is 18 or higher: `node --version`
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- Clear Vite cache:
  ```bash
  rm -rf node_modules/.vite
  ```

#### 2. API connection errors

**Problem**: "Network Error" or "Failed to fetch" messages

**Solutions**:
- Verify `VITE_BASE_URL` is set correctly in `.env`
- Ensure backend server is running and accessible
- Check CORS configuration on backend
- Verify network connectivity: `curl <VITE_BASE_URL>/health`
- Check browser console for specific error messages

#### 3. Authentication issues

**Problem**: Repeatedly redirected to login or "401 Unauthorized" errors

**Solutions**:
- Clear browser cookies and localStorage
- Ensure `withCredentials: true` is set in axios config (already configured)
- Verify backend session configuration
- Check if backend and frontend are on the same domain or CORS is properly configured
- Try logging in again with valid credentials

#### 4. WebSocket connection failures

**Problem**: Real-time updates not working

**Solutions**:
- Verify `VITE_BASE_URL` supports WebSocket connections
- Check if firewall or proxy is blocking WebSocket traffic
- Ensure backend WebSocket server is running
- Check browser console for Socket.io connection errors
- Verify backend allows Socket.io connections from your origin

#### 5. Zoom meeting fails to load

**Problem**: Zoom SDK not initializing or showing errors

**Solutions**:
- Ensure you have a valid Zoom meeting ID and credentials
- Check browser permissions for camera/microphone
- Verify Zoom SDK version compatibility
- Clear browser cache and reload
- Check browser console for Zoom SDK errors

#### 6. Build failures

**Problem**: `npm run build` fails with TypeScript errors

**Solutions**:
- Run TypeScript check separately: `tsc -b`
- Fix any type errors shown
- Ensure all dependencies are installed
- Check for missing or incompatible package versions
- Clear TypeScript build info: `rm *.tsbuildinfo`

#### 7. Docker build issues

**Problem**: Docker build fails or image doesn't work

**Solutions**:
- Ensure `VITE_BASE_URL` build arg is provided
- Check Docker logs: `docker logs commerce-clash`
- Verify nginx configuration is valid
- Ensure port 80 is not already in use
- Try building with `--no-cache` flag

### Getting Help

If you encounter issues not listed here:

1. Check the browser console for errors (F12 → Console tab)
2. Review the network tab for failed requests (F12 → Network tab)
3. Check backend logs for API errors
4. Search existing GitHub issues
5. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Browser and OS information
   - Console errors (if any)
   - Screenshots (if applicable)

---

## Security Considerations

### Authentication & Session Management

- **Cookie-based Authentication**: The application uses HTTP-only cookies for session management
- **Automatic Logout**: 401 responses trigger automatic logout and redirect to login
- **Credential Inclusion**: All API requests include credentials (`withCredentials: true`)
- **Protected Routes**: Route guards prevent unauthorized access to protected pages

### Best Practices

#### For Development
- **Never commit `.env` files**: Already included in `.gitignore`
- **Use HTTPS in production**: Always deploy with SSL/TLS certificates
- **Rotate secrets regularly**: Change API keys and credentials periodically
- **Validate environment variables**: Ensure `VITE_BASE_URL` is set before building

#### For Production
- **HTTPS Only**: Always serve the application over HTTPS
- **Secure Cookies**: Backend should set `Secure` and `SameSite` flags on cookies
- **CORS Configuration**: Properly configure allowed origins on backend
- **Content Security Policy**: Consider implementing CSP headers
- **Regular Updates**: Keep dependencies updated for security patches
- **Monitor Logs**: Set up logging and monitoring for suspicious activity

#### Data Privacy
- **User Data**: Student and teacher information should be handled per privacy regulations
- **Session Storage**: Sensitive data is stored in localStorage (consider encryption for sensitive fields)
- **API Keys**: Zoom API keys and secrets should be managed securely on backend

### Security Checklist for Deployment

- [ ] Environment variables are set correctly and not exposed
- [ ] Backend API is served over HTTPS
- [ ] CORS is configured to allow only trusted origins
- [ ] Cookies have Secure, HttpOnly, and SameSite flags set
- [ ] Rate limiting is implemented on backend APIs
- [ ] Input validation is performed on both frontend and backend
- [ ] Dependencies are up to date with latest security patches
- [ ] Authentication tokens/sessions have appropriate expiration times
- [ ] Error messages don't expose sensitive system information
- [ ] Logging is configured but doesn't log sensitive data

---

## FAQ

### General Questions

**Q: What is Commerce Clash?**
A: Commerce Clash is a gamified educational platform that combines business learning with RPG-style game mechanics. Students compete as business tycoons while learning business concepts.

**Q: Who built Commerce Clash?**
A: Commerce Clash is built by Texagon.io, a software development company specializing in educational technology.

**Q: Is Commerce Clash open source?**
A: The project is licensed under the MIT License. Check the LICENSE.md file for details.

### Technical Questions

**Q: What technologies does Commerce Clash use?**
A: The frontend uses React 18, TypeScript, Vite, Tailwind CSS, Socket.io, and the Zoom Meeting SDK. See the [Technology Stack](#technology-stack) section for the complete list.

**Q: Does Commerce Clash require a backend?**
A: Yes, Commerce Clash is a frontend application that requires a separate backend API server. The backend URL is configured via the `VITE_BASE_URL` environment variable.

**Q: Can I deploy Commerce Clash without Docker?**
A: Yes, you can build the application with `npm run build` and deploy the `dist` folder to any static hosting service like Netlify, Vercel, or AWS S3.

**Q: Does Commerce Clash work on mobile devices?**
A: Yes, the application is responsive and works on mobile browsers. However, some features like Zoom meetings may have limited functionality on mobile devices.

**Q: How do I enable HTTPS for local development?**
A: The `vite.config.ts` file includes commented-out HTTPS configuration. Uncomment it, generate certificates with mkcert, and place them in a `certs` folder. See the Vite documentation for details.

### Feature Questions

**Q: How many students can join a class?**
A: There is no hard limit in the frontend. The limitation would depend on the backend implementation and database constraints.

**Q: Can students see each other's skill allocations?**
A: Yes, students can view competitor skill trees using the "Rival Skill Trees" feature, which adds strategic depth to the competition.

**Q: How does the XP system work?**
A: Teachers award experience points (XP) to students based on their performance. XP unlocks progression and can be used to unlock perks and abilities.

**Q: What are the 6 Heroes?**
A: The Baron, The Tycoon, The Diplomat, The Visionary, The Explorer, and The General. Each has unique perks and playstyles. See the [Gamification System](#gamification-system) section for details.

**Q: Can I add more heroes or skill categories?**
A: Yes, heroes and skill categories are defined in `src/components/dummyData.ts`. You can modify this file to add or customize heroes and categories. Note that changing skill categories may require UI adjustments to the pentagon visualization.

### Deployment Questions

**Q: How do I deploy to production?**
A: Build the application with `VITE_BASE_URL=<your-api-url> npm run build`, then deploy the `dist` folder to your hosting service. See the [Deployment](#deployment) section for detailed instructions.

**Q: What ports does the application use?**
A: Development server uses port 5173 by default. The Docker container exposes port 80. You can customize these in the configuration files.

**Q: How do I update the backend API URL after deployment?**
A: The API URL is baked into the build at build time. To change it, you must rebuild the application with the new `VITE_BASE_URL` value and redeploy.

**Q: Can I use a CDN?**
A: Yes, after building, you can upload the `dist` folder to a CDN. Ensure your server is configured to serve `index.html` for all routes (SPA fallback).

---

## Performance Optimization

### Frontend Optimization Tips

#### 1. Code Splitting
The application uses Vite's automatic code splitting. To further optimize:

```typescript
// Use dynamic imports for heavy components
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

// Wrap in Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

#### 2. Image Optimization
- Compress images before adding to `/public/images/`
- Use modern formats (WebP) when possible
- Lazy load images not in the initial viewport
- Consider using CDN for large assets

#### 3. Bundle Size Management
Check bundle size:
```bash
npm run build
# Check dist/ folder size
```

Analyze bundle composition (optional):
```bash
npm install --save-dev rollup-plugin-visualizer
# Add to vite.config.ts and rebuild
```

#### 4. API Request Optimization
- The application already implements request interceptors
- Consider implementing request debouncing for search/filter operations
- Use React Query or SWR for advanced caching (future enhancement)

#### 5. WebSocket Connection Management
- Disconnect Socket.io when components unmount
- Implement reconnection logic with exponential backoff
- Batch multiple events when possible

#### 6. React Performance
Current optimizations:
- **SWC Compiler**: Using `@vitejs/plugin-react-swc` for faster builds
- **Component Memoization**: Consider using `React.memo()` for expensive components
- **useCallback/useMemo**: Apply to prevent unnecessary re-renders

Example optimization:
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => computeExpensiveValue(data), [data]);

// Memoize callbacks passed to child components
const handleClick = useCallback(() => {
  // handler code
}, [dependencies]);
```

#### 7. CSS Optimization
- Tailwind CSS purges unused styles in production
- Avoid inline styles when possible
- Use Tailwind's JIT mode (already enabled in v4)

### Backend Integration Optimization

#### Caching Strategy
Consider implementing these on the backend:
- **HTTP Caching**: Set appropriate `Cache-Control` headers
- **Response Compression**: Enable gzip/brotli compression
- **CDN**: Use CDN for static assets and API responses when possible

#### Database Query Optimization
Work with backend team to:
- Implement pagination for large datasets
- Add database indexing on frequently queried fields
- Use eager loading to reduce N+1 queries

### Production Deployment Optimization

#### Nginx Configuration
The included `nginx.conf` already has:
- Gzip compression enabled
- SPA fallback routing

Additional optimizations:
```nginx
# Add to nginx.conf for better caching
location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Docker Optimization
The Dockerfile is already optimized with:
- Multi-stage builds (reduces image size)
- Alpine Linux base (smaller footprint)
- Dependency caching layer

Further optimizations:
- Use `.dockerignore` to exclude unnecessary files
- Consider using `nginx:alpine` with gzip module

### Monitoring & Metrics

#### Performance Monitoring
Implement in production:
- **Web Vitals**: Measure Core Web Vitals (LCP, FID, CLS)
- **Error Tracking**: Sentry, LogRocket, or similar
- **Analytics**: Google Analytics, Mixpanel, or similar
- **Performance API**: Use browser Performance API for custom metrics

Example:
```typescript
// Measure page load performance
const perfData = performance.getEntriesByType('navigation')[0];
console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart);
```

#### Bundle Size Budget
Set size budgets in `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
      }
    }
  },
  chunkSizeWarningLimit: 500 // KB
}
```

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run linting**
   ```bash
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add: your feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

### Code Style Guidelines
- Follow existing code patterns
- Use TypeScript for type safety
- Write meaningful component and variable names
- Keep components focused and single-purpose
- Use custom hooks for reusable logic
- Document complex logic with comments

---

## License

This project is licensed under the MIT License. See the [LICENSE.md](./LICENSE.md) file for details.

---

## About Texagon.io

**Commerce Clash** is proudly built by [Texagon.io](https://texagon.io), a leading software development company specializing in innovative educational technology solutions.

### Contact & Support

For questions, support, or business inquiries:

- **Website**: [https://texagon.io](https://texagon.io)
- **Project Repository**: [GitHub Repository URL]
- **Issues**: [GitHub Issues URL]

---

<div align="center">

**Built with passion by Texagon.io**
</div>
