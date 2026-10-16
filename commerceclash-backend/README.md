# Commerce Clash - ZoomApp Backend

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E.svg)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.49.8-3ECF8E.svg)](https://supabase.io/)
[![Prisma](https://img.shields.io/badge/Prisma-6.8.2-2D3748.svg)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6.svg)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7.5-010101.svg)](https://socket.io/)

A comprehensive gamified learning platform backend built with NestJS that integrates with Zoom to create interactive classroom experiences. The system features real-time WebSocket communication, advanced gamification mechanics with perks and skills, role-based authentication, and sophisticated class management capabilities.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [WebSocket Events](#websocket-events)
- [Gamification System](#gamification-system)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

Commerce Clash is an educational platform that transforms traditional Zoom-based classes into engaging, gamified learning experiences. The backend system manages:

- **Teacher-Student Interactions**: Real-time classroom management via WebSockets
- **Gamification Engine**: Complex perk system with 13+ unique perks and skill management
- **Zoom Integration**: Seamless meeting creation and management via Zoom REST API
- **Role-Based Access**: Secure authentication with Supabase for teachers and students
- **Real-time Updates**: WebSocket-based bidirectional communication for live classroom events
- **Data Analytics**: Exportable class performance data and student metrics

---

## System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Student Web App]
        B[Teacher Web App]
    end

    subgraph "Backend Services"
        C[NestJS Application]
        D[WebSocket Gateway]
        E[REST API Controllers]
    end

    subgraph "External Services"
        F[Supabase Auth]
        G[Zoom API]
    end

    subgraph "Data Layer"
        H[PostgreSQL Database]
        I[Prisma ORM]
    end

    A -->|HTTP/WebSocket| C
    B -->|HTTP/WebSocket| C
    C --> D
    C --> E
    E --> F
    E --> G
    D --> I
    E --> I
    I --> H
    F -.->|Auth Sync| H
```

### Application Architecture

```mermaid
graph LR
    subgraph "NestJS Modules"
        A[App Module]
        A --> B[Auth Module]
        A --> C[Class Module]
        A --> D[Student Module]
        A --> E[Teacher Module]
        A --> F[User Module]
        A --> G[Skills Module]
    end

    subgraph "Utilities"
        H[Prisma Service]
        I[Supabase Service]
        J[Logger Service]
        K[Config Service]
    end

    subgraph "Gamification Engine"
        L[Perk Engine]
        M[Perk Systems]
        N[Skill Management]
    end

    C --> H
    C --> L
    D --> H
    D --> N
    E --> H
    B --> I
```

### WebSocket Communication Flow

```mermaid
sequenceDiagram
    participant S as Student Client
    participant G as WebSocket Gateway
    participant CS as Class Service
    participant PE as Perk Engine
    participant T as Teacher Client

    S->>G: join-room (classId, studentId)
    G->>S: joined-room (success)
    G->>S: class-status (current status)

    S->>G: perk-approve-request (perkId)
    G->>CS: Check enrollment & perk
    alt Auto-Approve Perk
        CS->>PE: Activate perk immediately
        PE-->>G: Activation result
        G->>S: perk-activated
        G->>T: perk-used (notification)
    else Requires Teacher Approval
        G->>T: perk-approve-request
        T->>G: perk-approve-response (approved)
        G->>CS: Activate perk
        CS->>PE: Execute perk logic
        PE-->>G: Activation result
        G->>S: perk-activated
        G->>T: perk-used
    end
```

### Database Entity Relationship

```mermaid
erDiagram
    users ||--o{ enrolled_students : enrolls
    users ||--o{ Renamedclass : creates
    users }o--|| roles : has
    Renamedclass ||--o{ enrolled_students : contains
    enrolled_students ||--o{ student_attributes : has
    enrolled_students ||--o{ student_perks : unlocks
    enrolled_students ||--o{ perk_usage : uses
    enrolled_students }o--o| archtypes : assigned
    archtypes ||--o{ perks : includes
    perks ||--o{ student_perks : unlocked_by
    perks }o--|| perk_types : categorized
    student_perks ||--o{ perk_usage : tracks
    attributes ||--o{ student_attributes : valued_in
```

---

## Features

### Authentication & Authorization

- Complete Supabase authentication flow (signup, signin, signout)
- Role-based access control (Teacher/Student)
- Token-based session management with specific session invalidation
- Account deletion with cascading data cleanup
- Password reset functionality

### Class Management

- Create and manage Zoom-integrated classes
- Real-time class status broadcasting (active/inactive)
- Student enrollment and unenrollment
- CEO (Character/Archetype) assignment to students
- Market share tracking and updates
- XP and leveling system
- Export class data to CSV format

### Gamification System

- **13+ Unique Perks** including:

  - **Moment of Glory**: Temporary XP boost
  - **Trendsetter**: Influence rival students
  - **Revered Icon**: Cancel rival perks with 7-second window
  - **Trailblazer**: Choose class scenario from scenario cards
  - **Sabotage**: Multi-phase skill point manipulation
  - **Compounding Gains**: Progressive skill point accumulation
  - **Corporate Empire/Espionage**: Market share manipulation
  - **Wipeout/Strategic Rebirth**: Reset mechanics
  - And more...

- **Skill Management**:

  - Student skill point allocation system
  - Skill shifting with cooldown mechanics
  - Teacher-controlled skill unlock/lock
  - Reset functionality

- **Perk Workflow**:
  - Student request → Teacher approval → Auto-activation
  - Auto-approve perks (no teacher intervention needed)
  - Perk cancellation via Revered Icon
  - Repeatable vs one-time perks
  - Usage tracking and cooldown management

### Real-Time WebSocket Features

- Room-based communication (class rooms)
- Student and teacher socket management
- Live perk activation and effects broadcasting
- Class status updates
- CEO assignment notifications
- Skill status updates

### Zoom Integration

- Automated meeting creation via Zoom REST API
- JWT token generation for Zoom SDK
- Meeting link management
- OAuth 2.0 integration

### Logging & Monitoring

- Winston-based structured logging
- Request/response logging middleware
- Error tracking and debugging
- Log levels: debug, info, warn, error

---

## Technology Stack

### Core Framework

- **NestJS 11.x**: Progressive Node.js framework
- **TypeScript 5.x**: Type-safe JavaScript
- **Node.js 16+**: JavaScript runtime

### Database & ORM

- **PostgreSQL**: Relational database
- **Prisma 6.x**: Next-generation ORM
- **Supabase**: Backend-as-a-Service with PostgreSQL

### Real-Time Communication

- **Socket.io 4.x**: WebSocket library
- **@nestjs/websockets**: NestJS WebSocket integration
- **@nestjs/platform-socket.io**: Socket.io adapter

### Authentication

- **@supabase/supabase-js**: Supabase client
- **Cookie-parser**: Cookie handling

### External Integrations

- **Axios**: HTTP client for Zoom API
- **jsrsasign**: JWT signing for Zoom SDK

### API Documentation

- **@nestjs/swagger**: OpenAPI/Swagger integration
- **swagger-ui-express**: Swagger UI

### Validation & Transformation

- **class-validator**: Decorator-based validation
- **class-transformer**: Object transformation

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Pre-commit linting
- **Jest**: Testing framework

### Utilities

- **Winston**: Logging
- **nest-winston**: Winston integration for NestJS
- **json2csv**: CSV export functionality

---

## Prerequisites

Before setting up the project, ensure you have:

- **Node.js**: v16.x or higher ([Download](https://nodejs.org/))
- **Bun**: Latest version ([Install](https://bun.sh/)) or npm/yarn
- **PostgreSQL**: v13+ database instance or Supabase project
- **Supabase Account**: For authentication ([Sign up](https://supabase.com/))
- **Zoom Developer Account**: For Zoom API integration ([Sign up](https://marketplace.zoom.us/))
- **Git**: For version control

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd zach-backend
```

### 2. Install Dependencies

```bash
bun install
# or
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Update the `.env` file with your actual credentials (see [Environment Variables](#environment-variables) section).

### 4. Database Setup

#### Option A: Using Supabase

1. Create a new Supabase project
2. Copy the database connection string
3. Update `DATABASE_URL` in `.env`

#### Option B: Local PostgreSQL

1. Create a new PostgreSQL database
2. Update `DATABASE_URL` with your local connection string

#### Run Migrations

```bash
# Run Prisma migrations
npx prisma migrate dev

# Execute Supabase auth triggers
npx prisma db execute --file ./prisma/manual/supabase_triggers.sql --schema ./prisma/schema.prisma
```

This creates triggers that automatically sync Supabase Auth users with your database.

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Start the Application

```bash
# Development mode with hot-reload
bun run start:dev

# Production build
bun run build
bun run start:prod

# Debug mode
bun run start:debug
```

The server will start on `http://localhost:4000` (or the port specified in `.env`).

### 7. Access Swagger Documentation

Navigate to:

```
http://localhost:4000/api
```

---

## Environment Variables

### Complete Environment Configuration

Create a `.env` file in the project root with the following variables:

#### Application Settings

| Variable     | Description             | Required | Default       | Example                                |
| ------------ | ----------------------- | -------- | ------------- | -------------------------------------- |
| `NODE_ENV`   | Application environment | Yes      | `development` | `development`, `production`, `staging` |
| `PORT`       | Server port number      | Yes      | `3000`        | `4000`                                 |
| `LOG_LEVEL`  | Winston logging level   | Yes      | `debug`       | `debug`, `info`, `warn`, `error`       |
| `APP_PREFIX` | API route prefix        | Yes      | `NestJS-Auth` | `commerce-clash`                       |

#### Supabase Configuration

| Variable               | Description                        | Required | Example                                   |
| ---------------------- | ---------------------------------- | -------- | ----------------------------------------- |
| `SUPABASE_URL`         | Supabase project URL               | Yes      | `https://xxxxx.supabase.co`               |
| `SUPABASE_ANON_KEY`    | Supabase anonymous/public key      | Yes      | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (secret) | Yes      | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**Where to find Supabase credentials:**

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy URL and Keys

#### Database Configuration

| Variable       | Description                          | Required | Example                                                     |
| -------------- | ------------------------------------ | -------- | ----------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string         | Yes      | `postgresql://user:password@host:5432/dbname?schema=public` |
| `DIRECT_URL`   | Direct database URL (for migrations) | No       | Same as `DATABASE_URL`                                      |

**Connection string format:**

```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

For Supabase, use the connection string from: Settings → Database → Connection string → URI

#### Zoom API Configuration

| Variable              | Description              | Required | Example                       |
| --------------------- | ------------------------ | -------- | ----------------------------- |
| `ZOOM_CLIENT_ID`      | Zoom OAuth Client ID     | Yes      | `abc123XYZ`                   |
| `ZOOM_CLIENT_SECRET`  | Zoom OAuth Client Secret | Yes      | `secret123`                   |
| `ZOOM_ACCOUNT_ID`     | Zoom Account ID          | Yes      | `account123`                  |
| `ZOOM_OAUTH_ENDPOINT` | Zoom OAuth endpoint      | Yes      | `https://zoom.us/oauth/token` |
| `ZOOM_API_BASE_URL`   | Zoom API base URL        | Yes      | `https://api.zoom.us/v2`      |

**Where to find Zoom credentials:**

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Create a Server-to-Server OAuth app
3. Copy Client ID, Client Secret, and Account ID

#### Frontend Configuration

| Variable       | Description              | Required | Example                         |
| -------------- | ------------------------ | -------- | ------------------------------- |
| `FRONTEND_URL` | Frontend application URL | Yes      | `https://app.commerceclash.com` |

**Note:** This is used for CORS configuration. Update `src/main.ts` CORS settings if needed.

### Example `.env` File

```env
# Application Settings
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug
APP_PREFIX=commerce-clash

# Supabase Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Database Connection
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?schema=public

# Zoom Credentials
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_OAUTH_ENDPOINT=https://zoom.us/oauth/token
ZOOM_API_BASE_URL=https://api.zoom.us/v2

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Security Notes

- **Never commit** `.env` file to version control
- Use `.env.example` as a template
- Store production secrets in secure secret managers (AWS Secrets Manager, Vault, etc.)
- Rotate `SUPABASE_SERVICE_KEY` periodically
- Keep `ZOOM_CLIENT_SECRET` confidential

---

## Project Structure

```
zach-backend/
├── prisma/                     # Database schema and migrations
│   ├── migrations/             # Prisma migration files
│   ├── manual/                 # Manual SQL scripts
│   │   └── supabase_triggers.sql  # Auth sync triggers
│   └── schema.prisma           # Prisma schema definition
│
├── src/                        # Source code
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root application module
│   │
│   ├── auth/                   # Authentication module
│   │   ├── auth.controller.ts  # Auth REST endpoints
│   │   ├── auth.service.ts     # Auth business logic
│   │   ├── auth.module.ts      # Auth module definition
│   │   ├── docs/               # Swagger decorators
│   │   └── dto/                # Data Transfer Objects
│   │       ├── sign-up.dto.ts
│   │       ├── sign-in.dto.ts
│   │       ├── forgot-password.dto.ts
│   │       └── reset-password.dto.ts
│   │
│   ├── class/                  # Class management module
│   │   ├── class.controller.ts # Class REST endpoints
│   │   ├── class.service.ts    # Class business logic
│   │   ├── class.gateway.ts    # WebSocket gateway (1130 lines)
│   │   ├── class.module.ts     # Class module definition
│   │   ├── docs/               # Swagger decorators
│   │   └── dto/                # DTOs for class operations
│   │       ├── create-class/
│   │       ├── assign-ceo/
│   │       ├── perk-dto/       # Perk-related DTOs
│   │       ├── student-xp/
│   │       └── join-room.dto.ts
│   │
│   ├── gamification/           # Gamification engine
│   │   ├── PerkEngine.ts       # Main perk execution engine
│   │   ├── core/               # Core perk infrastructure
│   │   │   ├── BasicPerkEffectHelper.ts
│   │   │   └── interfaces/
│   │   │       └── IPerkEffect.ts
│   │   ├── systems/            # Individual perk implementations
│   │   │   ├── CompoundingGains.ts
│   │   │   ├── CorporateEmpire.ts
│   │   │   ├── CorporateEspionage.ts
│   │   │   ├── DoubleDown.ts
│   │   │   ├── GenericPerk.ts
│   │   │   ├── MomentOfGlory.ts
│   │   │   ├── RallyingCry.ts
│   │   │   ├── ReveredIcon.ts   # Advanced: Perk cancellation
│   │   │   ├── Sabotage.ts      # Multi-phase perk
│   │   │   ├── StrategicRebirth.ts
│   │   │   ├── Trailblazer.ts   # Scenario selection
│   │   │   ├── Trensetter.ts
│   │   │   └── Wipeout.ts
│   │   └── utils/
│   │       └── types/types.ts
│   │
│   ├── student/                # Student module
│   │   ├── student.controller.ts
│   │   ├── student.service.ts
│   │   ├── student.module.ts
│   │   ├── docs/
│   │   └── dto/
│   │       ├── get-student.dto.ts
│   │       ├── upsert-skill/
│   │       ├── shift-skill-points.dto.ts/
│   │       └── unenroll-class.dto.ts
│   │
│   ├── teacher/                # Teacher module
│   │   ├── teacher.controller.ts
│   │   ├── teacher.service.ts
│   │   ├── teacher.module.ts
│   │   ├── docs/
│   │   └── dto/
│   │       ├── add-skill/
│   │       ├── edit-skill/
│   │       ├── delete-skill/
│   │       └── update-student.dto.ts
│   │
│   ├── user/                   # User management module
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── docs/
│   │   └── dto/
│   │
│   ├── skills/                 # Skills management
│   │   ├── skills.service.ts
│   │   └── skills.module.ts
│   │
│   └── utils/                  # Shared utilities
│       ├── common/             # Common utilities
│       │   ├── classes/
│       │   │   └── reusable.ts  # Reusable service methods
│       │   ├── decorators/
│       │   │   └── auth.decorator.ts
│       │   ├── guards/
│       │   │   └── origin-check.guard.ts
│       │   ├── types/
│       │   ├── interfaces/
│       │   ├── enum/
│       │   └── validations/
│       │
│       ├── config/             # Configuration module
│       │   ├── config.module.ts
│       │   └── config.service.ts
│       │
│       ├── logger/             # Logging configuration
│       │   ├── winston-logger.config.ts
│       │   └── request-logger.middleware.ts
│       │
│       ├── prisma/             # Prisma service
│       │   ├── prisma.module.ts
│       │   └── prisma.service.ts
│       │
│       ├── supabase/           # Supabase service
│       │   ├── supabase.module.ts
│       │   └── supabase.service.ts
│       │
│       ├── system/             # System endpoints
│       │   └── system.controller.ts
│       │
│       └── types/
│           └── express.d.ts    # TypeScript type extensions
│
├── test/                       # Test files
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── nest-cli.json               # NestJS CLI configuration
├── .eslintrc.js                # ESLint configuration
├── .prettierrc                 # Prettier configuration
└── README.md                   # This file
```

### Key Files Explained

- **`src/main.ts`**: Application bootstrap with Swagger, CORS, validation pipes, and cookie parser
- **`src/app.module.ts`**: Root module importing all feature modules
- **`src/class/class.gateway.ts`**: Central WebSocket hub (1130 lines) handling all real-time events
- **`src/gamification/PerkEngine.ts`**: Orchestrates perk execution and effects
- **`prisma/schema.prisma`**: Database models and relationships
- **`prisma/manual/supabase_triggers.sql`**: Syncs Supabase Auth with database

---

## Database Schema

### Core Entities

#### Users & Roles

**`users`** - Application users (teachers and students)

- `id` (UUID): Matches Supabase auth.users id
- `email` (String): User email
- `name` (String?): Display name
- `role_id` (UUID): Foreign key to roles
- `is_active` (Boolean): Account status
- **Relations**: roles, Renamedclass (as instructor), enrolled_students

**`roles`** - User roles (Teacher, Student)

- `id` (UUID)
- `name` (String): Role name

#### Classes

**`Renamedclass`** (mapped to `class` table)

- `id` (UUID)
- `meeting_id` (String): Zoom meeting ID
- `name` (String): Class name
- `meeting_link` (String): Zoom meeting URL
- `passcode` (String?): Meeting passcode
- `duration` (Int?): Meeting duration
- `instructor_id` (UUID): Teacher reference
- `allocated_points` (Int): Starting skill points per student
- `is_active` (Boolean): Class session status
- **Relations**: users (instructor), enrolled_students

#### Student Enrollment

**`enrolled_students`** - Student class enrollments

- `id` (UUID)
- `student_id` (UUID): Reference to users
- `class_id` (UUID): Reference to class
- `available_points` (Int): Skill points available
- `xp` (Int): Experience points
- `level` (Int): Student level
- `archtype_id` (UUID?): Assigned CEO/Archetype
- `market_share` (Int): Current market share
- `is_cancelled` (Boolean): Enrollment status
- `skill_unlocked` (Boolean): Can allocate skills
- `shifting_points` (Int): Points being shifted
- `is_shifting` (Boolean): In shifting cooldown
- **Relations**: users, Renamedclass, archtypes, student_attributes, student_perks, perk_usage

#### Gamification

**`archtypes`** - CEO/Character types

- `id` (UUID)
- `title` (String): Archetype name
- `sub_title` (String): Subtitle
- `description` (String?): Description
- `difficulty` (Int): Difficulty level
- `playstyle` (String): Playstyle description
- `risk`, `influence`, `growth` (Int): Stats
- **Relations**: enrolled_students, perks

**`perks`** - Perk definitions

- `id` (UUID)
- `key` (String): Unique perk identifier
- `title` (String): Display name
- `description` (String?): Description
- `is_coded` (Boolean): Has custom implementation
- `is_repeatable` (Boolean): Can be used multiple times
- `auto_approve` (Boolean): No teacher approval needed
- `perk_type` (UUID): Reference to perk_types
- `archtype_id` (UUID): Belongs to archetype
- **Relations**: archtypes, perk_types, student_perks

**`student_perks`** - Student perk ownership

- `id` (UUID)
- `enrollment_id` (UUID): Reference to enrolled_students
- `perk_id` (UUID): Reference to perks
- `is_unlocked` (Boolean): Perk available
- `is_used` (Boolean): Perk consumed
- `is_approved` (Boolean): Teacher approved
- `perk_status` (Enum): request, pending, approved, denied
- `last_used_at` (DateTime?): Last usage time
- `next_available_at` (DateTime?): Cooldown end
- **Relations**: enrolled_students, perks, perk_usage

**`perk_usage`** - Perk usage history

- `id` (UUID)
- `student_perk_id` (UUID)
- `enrollment_id` (UUID)
- `used_at` (DateTime)
- `result_data` (JSON): Perk effect results
- **Relations**: student_perks, enrolled_students

**`perk_types`** - Perk categories

- `id` (UUID)
- `type` (String): Category name

#### Skills

**`attributes`** - Skill definitions

- `id` (UUID)
- `name` (String): Skill name
- `value` (Int): Base value
- **Relations**: student_attributes

**`student_attributes`** - Student skill allocations

- `id` (UUID)
- `enrollment_id` (UUID)
- `attribute_id` (UUID)
- `value` (Int): Allocated points
- **Relations**: enrolled_students, attributes

### Enums

**`perk_status`**

- `request`: Initial state
- `pending`: Waiting for teacher
- `approved`: Teacher approved, ready to activate
- `denied`: Teacher rejected

### Key Relationships

1. **User → Enrollment → Class**: Many-to-many relationship between users and classes via enrolled_students
2. **Enrollment → Archetype**: Each enrollment has one assigned CEO/character
3. **Archetype → Perks**: Each archetype has multiple unique perks
4. **Enrollment → Student Perks**: Student unlocks perks based on their archetype
5. **Student Perks → Perk Usage**: Tracks all perk activations with results
6. **Enrollment → Student Attributes**: Student skill point allocations

---

## API Documentation

### Base URL

```
http://localhost:4000
```

### Swagger Documentation

```
http://localhost:4000/api
```

### Authentication

All authenticated endpoints require a cookie named `access_token` containing the Supabase session token.

#### Student registration and payment

Public self-registration starts at `/choose-class` in the frontend. Students select a cohort and pay at `/checkout` using `POST /stripe/payment-intent` with `checkoutId` (a UUID v4), `cohortId`, `email`, and optional `name`. After Stripe confirms payment, the webhook provisions the account, sends any pending password setup email, and saves enrollment. Checkout does not accept a password.

The browser retains its anonymous checkout key for each email/cohort pair. `checkout_orders` holds the original price, identity, and PaymentIntent ID. Database uniqueness and row locks keep concurrent requests on one order; a Stripe idempotency key protects creation if the response is lost. An accepted payment returns its status and ID with `clientSecret: null`, so the frontend resumes enrollment confirmation without submitting another payment. A new attempt is allowed only after the previous intent is canceled. Another browser cannot receive an unpaid intent's client secret or start a second payment for the same email/cohort; it must continue in the original browser or contact support.

Public checkout requires an active, public, unarchived cohort with a positive capacity. Before returning a client secret, checkout reserves one seat under a cohort database lock. Availability counts actual enrollments plus outstanding reservations; teacher enrollment uses the same lock, and capacity cannot be reduced below occupied seats. Successful fulfillment converts the reservation into enrollment atomically. A paid reservation is honored if the cohort is subsequently hidden or archived.

Supabase token generation and password setup email acknowledgement must finish before the enrollment transaction writes to `public.users`. The `auth.users` update trigger also writes that user row: holding its lock while awaiting Supabase would block token generation and leave checkout pending even though the account was created. The cohort lock continues to protect capacity during these operations.

Unpaid reservations expire after 30 minutes. A minute-based sweep and checkout requests release them only after Stripe confirms cancellation. A failed cancellation keeps the seat reserved; processing and successful payments retain their seat until fulfillment completes, including password setup email retries. This depends on the backend scheduler running. Existing payments without reservations must pass current eligibility and capacity checks: if enrollment cannot be fulfilled, the webhook records a durable refund decision before requesting an idempotent refund. Retries reconcile existing Stripe refunds. Polling returns `pending` while the refund request is unresolved and `refunded` after Stripe accepts it; the frontend shows “Refund requested” and sends no password setup email for that rejected enrollment. This status acknowledges the refund request, not bank settlement; refunds that fail or require action need operator attention.

Apply `20261008000000_add_checkout_orders` and `20261008010000_reserve_checkout_seats` using `npx prisma migrate deploy` and run `npx prisma generate` before deploying the matching backend and frontend. Older frontend clients do not supply the required checkout key. Payments already started before these changes have no saved reservation: finish or cancel those during rollout before restarting their checkout. Hosted legacy Checkout Sessions are fulfilled only when their payment status is paid.

Run backend regressions with `npm test -- --runInBand`, and frontend checkout tests with `npm run test:checkout`. PostgreSQL concurrency tests opt in using `CHECKOUT_TEST_DATABASE_URL` pointing to a dedicated database named `checkout_issue4_test` on `127.0.0.1`. Those tests drop and recreate the entire public and test auth schemas, apply both checkout migrations, and install the repository's Supabase triggers; use a disposable isolated test database. They mock Stripe, Supabase HTTP, and email calls, while the trigger regression exercises real auth table updates through a separate database connection.

The public `/auth/signup`, `/stripe/register`, and `/stripe/create-checkout-session` endpoints have been retired. Teacher-managed student creation remains available. Webhook fulfillment and status polling are retained for payments started before the older checkout paths were retired.

#### Testing Stripe checkout locally

Start the local backend and the Stripe CLI listener before confirming a payment. Forward events to the backend's actual `PORT` (the example below uses `3000`):

```bash
stripe listen --events payment_intent.succeeded,checkout.session.completed --forward-to http://localhost:3000/stripe/webhook
```

Set the backend's `STRIPE_WEBHOOK_SECRET` to the secret printed by this listener and restart the backend after changing it. The listener and backend must use the same Stripe account and sandbox. See the [Stripe CLI listener documentation](https://docs.stripe.com/cli/listen).

A registered staging webhook receives events separately from the local listener. Local fixes do not update the staging deployment. Dashboard resends target the registered endpoint, so resending to a staging endpoint does not recover a checkout through your local backend.

The listener forwards incoming events; starting it after a payment does not replay that earlier payment. Checkout deliberately resumes an already-successful PaymentIntent instead of charging again, and the UI's “Check again” button only polls the completion record. If an earlier payment succeeded before local forwarding was running, replay its original successful event through the intended backend to finish fulfillment. Do not create another charge to recover it. A `304` poll response means the completion payload is unchanged; it does not establish that the webhook completed.

#### POST `/auth/signin`

Login with existing credentials.

**Request Body:**

```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK` + Sets `access_token` cookie

#### POST `/auth/signout`

Logout and invalidate current session.

**Requires:** Authentication cookie

**Response:** `200 OK`

#### DELETE `/auth/account`

Delete user account and all associated data.

**Requires:** Authentication

**Response:** `200 OK`

### Class Management

#### POST `/class/create`

Create a new class with Zoom meeting.

**Requires:** Teacher authentication

**Request Body:**

```json
{
  "name": "Introduction to Economics",
  "duration": 60,
  "allocated_points": 10
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "class": {
      "id": "...",
      "name": "Introduction to Economics",
      "meeting_id": "123456789",
      "meeting_link": "https://zoom.us/j/123456789",
      "passcode": "abc123"
    }
  }
}
```

#### GET `/class/:classId`

Get class details and enrolled students.

**Requires:** Authentication

**Response:** `200 OK`

#### PATCH `/class/:classId/toggle-status`

Toggle class active/inactive status.

**Requires:** Teacher authentication

**Response:** `200 OK`

#### POST `/class/:classId/assign-ceo`

Assign a CEO/Archetype to a student.

**Requires:** Teacher authentication

**Request Body:**

```json
{
  "studentId": "...",
  "archtypeId": "..."
}
```

**Response:** `200 OK`

#### PATCH `/class/:classId/student/:studentId/xp`

Update student XP.

**Requires:** Teacher authentication

**Request Body:**

```json
{
  "xpChange": 100,
  "operation": "add"
}
```

#### GET `/class/:classId/export`

Export class data to CSV.

**Requires:** Teacher authentication

**Response:** CSV file download

### Student Operations

#### GET `/student/classes`

Get all classes student is enrolled in.

**Requires:** Student authentication

**Response:** `200 OK`

#### POST `/student/:enrollmentId/skill`

Upsert student skill allocation.

**Requires:** Student authentication

**Request Body:**

```json
{
  "skillId": "...",
  "points": 5
}
```

#### POST `/student/:enrollmentId/shift-points`

Shift skill points (with cooldown).

**Requires:** Student authentication

**Request Body:**

```json
{
  "decrements": [{ "skillId": "...", "amount": 2 }],
  "increments": [{ "skillId": "...", "amount": 2 }]
}
```

#### POST `/student/:enrollmentId/reset-skills`

Reset all skill allocations.

**Requires:** Student authentication

**Response:** `200 OK`

### Teacher Operations

#### GET `/teacher/students`

Get all students across teacher's classes.

**Requires:** Teacher authentication

#### POST `/teacher/class/:classId/skill`

Add a new skill to the system.

**Requires:** Teacher authentication

#### PATCH `/teacher/class/:classId/skill/:skillId`

Edit existing skill.

**Requires:** Teacher authentication

#### DELETE `/teacher/class/:classId/skill/:skillId`

Delete a skill.

**Requires:** Teacher authentication

---

## WebSocket Events

### Connection

**Namespace:** `/` (default)

**CORS:** Enabled for all origins with credentials

### Client → Server Events

#### `join-room`

Join class room(s) for real-time updates.

**Payload:**

```json
{
  "classId": ["class-uuid-1", "class-uuid-2"],
  "studentId": "student-uuid",
  // OR
  "teacherId": "teacher-uuid"
}
```

**Response Event:** `joined-room`

```json
{
  "success": true,
  "message": "Class Rooms joined successfully",
  "data": {
    "class_ids": ["..."],
    "type": "student" // or "teacher"
  }
}
```

**Additional Events:**

- `class-status`: Current status of each joined class

#### `perk-approve-request`

Student requests to use a perk.

**Payload:**

```json
{
  "classId": "...",
  "studentId": "...",
  "perk": {
    "id": "student-perk-uuid"
  }
}
```

**Auto-Approve Perks:**

- Immediately activated
- Teacher notified (informational)
- Student receives `perk-activated`

**Regular Perks:**

- Teacher receives `perk-approve-request`
- Student receives `perk-request-confirmation`
- Perk status set to `pending`

#### `perk-approve-response`

Teacher approves/denies perk request.

**Payload:**

```json
{
  "classId": "...",
  "studentId": "...",
  "perkId": "student-perk-uuid",
  "isApproved": true,
  "additionalData": {} // Optional perk-specific data
}
```

**If Approved:**

1. Check for Revered Icon commander
2. If commander exists: 7-second cancellation window
3. Auto-activate perk after approval
4. Student receives `perk-activated`
5. Teacher receives `perk-used`

**If Denied:**

- Student receives `perk-denied`
- Perk status set to `denied`

#### `perk-complete-with-target`

Complete perk that requires target selection (e.g., Sabotage).

**Payload:**

```json
{
  "classId": "...",
  "studentId": "...",
  "perkId": "...",
  "targetStudentId": "...",
  "redistribution": {
    "decrements": [{ "skillId": "...", "amount": 2 }],
    "increments": [{ "skillId": "...", "amount": 2 }]
  }
}
```

**Response:** `perk-activated` with final effects

#### `trailblazer-scenario-selected`

Student selects scenario after Trailblazer activation.

**Payload:**

```json
{
  "classId": "...",
  "studentId": "...",
  "perkId": "...",
  "selectedScenario": {
    "title": "Market Disruption",
    "description": "...",
    "effects": {}
  }
}
```

**Broadcasts:** `class-scenario-set` to all students in class

#### `revered-icon-cancel`

Commander cancels rival's perk using Revered Icon.

**Payload:**

```json
{
  "classId": "...",
  "commanderId": "...",
  "pendingPerkKey": "classId:studentId:perkId"
}
```

**Response:** `revered-icon-cancel-result`

**Broadcasts:**

- `perk-cancelled-by-commander` to rival
- `perk-cancelled-announcement` to class

#### `manage-perk`

Teacher manually manages student perk (unlock/lock/reset).

**Payload:**

```json
{
  "teacherId": "...",
  "classId": "...",
  "studentId": "...",
  "perkId": "...",
  "action": "unlock" // "unlock", "lock", "reset"
}
```

#### `update-skills-status`

Teacher toggles skill unlock/lock for student or entire class.

**Payload:**

```json
{
  "classId": "...",
  "studentId": "..." // Optional: if omitted, affects whole class
}
```

**Broadcasts:** `skills-status-updated` to class

### Server → Client Events

#### `class-status`

Class has started or ended.

**Payload:**

```json
{
  "success": true,
  "message": "Teacher has joined Class: Economics 101",
  "data": {
    "class_id": "...",
    "name": "Economics 101",
    "status": true // true = active, false = inactive
  }
}
```

#### `assigned-ceo`

CEO/Archetype has been assigned to student.

**Payload:**

```json
{
  "success": true,
  "message": "CEO Visionary has been assigned to you",
  "data": {
    "result": {
      "archetype": {
        "id": "...",
        "title": "Visionary",
        "difficulty": 3,
        "perks": [...]
      }
    }
  }
}
```

#### `perk-activated`

Perk has been successfully activated.

**Payload:**

```json
{
  "success": true,
  "message": "Perk 'Moment of Glory' has been approved and activated",
  "data": {
    "perkId": "...",
    "perkTitle": "Moment of Glory",
    "perk_status": "used", // or "approved" if pending completion
    "effects": {
      "xpBoost": 200,
      "duration": 300000
      // ... perk-specific effects
    }
  }
}
```

**Perk-Specific Effects:**

**Moment of Glory:**

```json
{
  "effects": {
    "xpBoost": 200,
    "duration": 300000,
    "activatedAt": 1234567890
  }
}
```

**Trailblazer:**

```json
{
  "effects": {
    "requiresSelection": true,
    "scenarioCards": [
      { "title": "...", "description": "...", "effects": {} },
      { "title": "...", "description": "...", "effects": {} }
    ]
  }
}
```

**Sabotage (Phase 1 - Target Selection):**

```json
{
  "effects": {
    "requiresSelection": true,
    "pendingCompletion": true,
    "availableTargets": [
      { "id": "...", "name": "Student A" },
      { "id": "...", "name": "Student B" }
    ]
  }
}
```

**Sabotage (Phase 2 - Redistribution):**

```json
{
  "effects": {
    "requiresRedistribution": true,
    "targetStudent": { "id": "...", "name": "..." },
    "stolenPoints": 5
  }
}
```

#### `perk-denied`

Teacher denied perk request.

**Payload:**

```json
{
  "success": false,
  "message": "Perk 'Sabotage' has been declined by your teacher",
  "data": {
    "is_approved": false,
    "perk_status": "denied",
    "perkTitle": "Sabotage"
  }
}
```

#### `perk-request-confirmation`

Perk request sent to teacher (acknowledgment).

**Payload:**

```json
{
  "success": true,
  "message": "Perk request sent to teacher",
  "data": {
    "perkId": "...",
    "perkTitle": "...",
    "status": "pending"
  }
}
```

#### `perk-pending-commander-review`

Perk is in Revered Icon cancellation window.

**Payload:**

```json
{
  "success": true,
  "message": "Your Sabotage is approved but a Commander may cancel it. Waiting...",
  "data": {
    "perkId": "...",
    "perkTitle": "Sabotage",
    "cancelWindowMs": 7000
  }
}
```

#### `rival-perk-pending`

Commander notified of rival's perk (Revered Icon).

**Payload:**

```json
{
  "success": true,
  "message": "John Doe is activating Sabotage! You have 7 seconds to cancel with Revered Icon.",
  "data": {
    "pendingKey": "classId:studentId:perkId",
    "rival": { "id": "...", "name": "John Doe" },
    "perk": { "id": "...", "title": "Sabotage" },
    "cancelWindowMs": 7000,
    "expiresAt": 1234567890
  }
}
```

#### `perk-cancelled-by-commander`

Your perk was cancelled by a commander.

**Payload:**

```json
{
  "success": false,
  "message": "Your Sabotage was cancelled by Jane Commander using Revered Icon!",
  "data": {
    "perkId": "...",
    "perkTitle": "Sabotage",
    "cancelledBy": "Jane Commander"
  }
}
```

#### `perk-cancelled-announcement`

Broadcast to class about perk cancellation.

**Payload:**

```json
{
  "success": true,
  "message": "Jane Commander used Revered Icon to cancel John Doe's Sabotage!",
  "data": {
    "commander": "Jane Commander",
    "rival": "John Doe",
    "perk": "Sabotage"
  }
}
```

#### `revered-icon-expired`

Commander's cancellation window expired.

**Payload:**

```json
{
  "success": true,
  "message": "Time expired! John Doe's Sabotage has been activated.",
  "data": {
    "pendingKey": "classId:studentId:perkId"
  }
}
```

#### `perk-used`

Perk has been fully consumed (informational for teacher).

**Payload:**

```json
{
  "success": true,
  "message": "Perk Sabotage has been used by John Doe."
}
```

#### `perk-activation-error`

Error occurred during perk activation.

**Payload:**

```json
{
  "success": false,
  "message": "Perk was approved but activation failed: Insufficient skill points",
  "data": {
    "perkId": "...",
    "perkTitle": "..."
  }
}
```

#### `skills-status-updated`

Skill unlock/lock status changed.

**Payload:**

```json
{
  "success": true,
  "message": "Skills status updated for John Doe.",
  "data": {
    "studentId": "...",
    "name": "John Doe",
    "skill_unlocked": true
  }
}
```

**Or for class-wide:**

```json
{
  "success": true,
  "message": "All students skill status toggled to unlocked.",
  "data": {
    "skill_unlocked": true
  }
}
```

#### `ws-error`

General WebSocket error.

**Payload:**

```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

---

## Gamification System

### Perk System Architecture

The gamification engine is built on a flexible perk system with 13+ unique perks:

### Perk Categories

#### 1. XP & Growth Perks

**Moment of Glory**

- **Type**: Instant XP boost
- **Effect**: Grants temporary XP boost for limited time
- **Auto-Approve**: Yes
- **Repeatable**: Yes
- **Implementation**: `MomentOfGlory.ts`

**Compounding Gains**

- **Type**: Progressive skill point accumulation
- **Effect**: Earn increasing skill points over multiple rounds
- **Auto-Approve**: No
- **Repeatable**: Yes
- **Implementation**: `CompoundingGains.ts`

#### 2. Influence & Competition Perks

**Trendsetter**

- **Type**: Rival influence
- **Effect**: Force rival students to follow your strategy
- **Auto-Approve**: No
- **Repeatable**: Yes
- **Implementation**: `Trensetter.ts`

**Revered Icon**

- **Type**: Defensive counter
- **Effect**: Cancel any rival's perk within 7-second window
- **Auto-Approve**: No
- **Repeatable**: Limited
- **Special**: Creates pending activation system
- **Implementation**: `ReveredIcon.ts`

#### 3. Market Share Perks

**Corporate Empire**

- **Type**: Market share boost
- **Effect**: Increase your market share
- **Auto-Approve**: No
- **Repeatable**: Yes
- **Implementation**: `CorporateEmpire.ts`

**Corporate Espionage**

- **Type**: Market share theft
- **Effect**: Steal market share from rivals
- **Auto-Approve**: No
- **Repeatable**: Yes
- **Implementation**: `CorporateEspionage.ts`

#### 4. Skill Manipulation Perks

**Sabotage**

- **Type**: Multi-phase skill manipulation
- **Effect**: Steal skill points from rival, redistribute them
- **Auto-Approve**: No
- **Repeatable**: Limited
- **Phases**:
  1. Target selection
  2. Point theft
  3. Redistribution to your skills
- **Implementation**: `Sabotage.ts`

**Rallying Cry**

- **Type**: Skill point boost
- **Effect**: Grant temporary skill point increase
- **Auto-Approve**: No
- **Repeatable**: Yes
- **Implementation**: `RallyingCry.ts`

#### 5. Strategic Perks

**Trailblazer**

- **Type**: Scenario selection
- **Effect**: Draw 2 scenario cards, choose one for the class
- **Auto-Approve**: No
- **Repeatable**: No
- **Special**: Requires student selection, no teacher approval for final choice
- **Implementation**: `Trailblazer.ts`

**Double Down**

- **Type**: Risk/reward
- **Effect**: Double gains or losses on next action
- **Auto-Approve**: No
- **Repeatable**: Yes
- **Implementation**: `DoubleDown.ts`

#### 6. Reset Perks

**Wipeout**

- **Type**: Offensive reset
- **Effect**: Reset rival student's progress
- **Auto-Approve**: No
- **Repeatable**: Limited
- **Implementation**: `Wipeout.ts`

**Strategic Rebirth**

- **Type**: Self-reset
- **Effect**: Reset your own progress for fresh start
- **Auto-Approve**: No
- **Repeatable**: Limited
- **Implementation**: `StrategicRebirth.ts`

### Perk Workflow States

```
request → pending → approved → used
              ↓
            denied
```

**State Descriptions:**

- **request**: Initial state when student wants to use perk
- **pending**: Waiting for teacher approval
- **approved**: Teacher approved, perk is activated (may require completion)
- **denied**: Teacher rejected the perk
- **used**: Perk fully consumed and logged

### Special Perk Mechanics

#### Auto-Approve Perks

Perks with `auto_approve = true` bypass teacher approval:

1. Student requests perk
2. System immediately activates
3. Teacher receives notification (informational only)

#### Multi-Phase Perks (Sabotage Example)

**Phase 1: Request & Approval**

```
Student → perk-approve-request
Teacher → perk-approve-response (approved)
```

**Phase 2: Target Selection**

```
Student receives: perk-activated with requiresSelection
Student → perk-complete-with-target (targetStudentId)
```

**Phase 3: Redistribution**

```
Student receives: perk-activated with requiresRedistribution
Student → perk-complete-with-target (redistribution data)
Perk marked as "used"
```

#### Revered Icon Cancellation Mechanism

**Setup:**

1. Rival activates perk (after teacher approval)
2. System checks for Commander with available Revered Icon
3. If found, create 7-second cancellation window

**Cancellation Window:**

```typescript
const CANCEL_WINDOW_MS = 7000; // 7 seconds
```

**Flow:**

1. Commander receives `rival-perk-pending` event
2. Commander has 7 seconds to emit `revered-icon-cancel`
3. If cancelled:
   - Rival receives `perk-cancelled-by-commander`
   - Perk does not execute
   - Revered Icon is consumed
4. If timer expires:
   - Rival's perk executes normally
   - Commander receives `revered-icon-expired`

### Skill System

#### Skill Allocation

- Students start with `allocated_points` (default: 10)
- Points can be distributed across multiple skills (attributes)
- Each skill has a name and value

#### Skill Shifting

- **Feature**: Reallocate skill points without penalty
- **Cooldown**: Once per session (tracked via `is_shifting` flag)
- **Mechanism**:
  - Decrement points from certain skills
  - Increment points to other skills
  - Store `shifting_points` during cooldown

#### Skill Locking

- Teachers can lock/unlock skill allocation per student
- Class-wide skill lock/unlock
- Prevents/allows skill point changes

#### Skill Reset

- Students can reset all skill allocations
- Returns all points to available pool
- Requires teacher permission if skills are locked

---

## Development

### Code Quality

#### Linting

```bash
bun run lint
```

#### Formatting

```bash
bun run format
```

#### Pre-commit Hooks

Husky and lint-staged automatically run linting and formatting on git commit.

### Architecture Validation

Generate dependency graph:

```bash
bun run arch
```

This uses `dependency-cruiser` to validate architecture rules.

### Development Workflow

1. **Feature Branch**: Create branch from `main`

```bash
git checkout -b feature/your-feature-name
```

2. **Development**: Make changes, test locally

3. **Database Changes**:

```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Generate Prisma client
npx prisma generate
```

4. **Commit**: Husky hooks run automatically

```bash
git add .
git commit -m "feat: add new feature"
```

5. **Push & PR**:

```bash
git push origin feature/your-feature-name
```

### Adding a New Perk

1. **Create Perk Class** in `src/gamification/systems/`

```typescript
// src/gamification/systems/YourPerk.ts
import { PrismaService } from '@utils/prisma/prisma.service';
import { BasicPerkEffectHelper } from '../core/BasicPerkEffectHelper';

export class YourPerk {
  static async execute(
    prisma: PrismaService,
    enrollmentId: string,
    classId: string,
    additionalData?: any,
  ): Promise<any> {
    // Your perk logic here

    return {
      success: true,
      message: 'Your perk activated!',
      effects: {
        // Effects data
      },
    };
  }
}
```

2. **Register in PerkEngine** (`src/gamification/PerkEngine.ts`)

```typescript
import { YourPerk } from './systems/YourPerk';

// Add to switch statement
case 'your-perk-key':
  return await YourPerk.execute(prisma, enrollmentId, classId, additionalData);
```

3. **Add to Database**

```sql
-- Insert perk type if needed
INSERT INTO perk_types (type) VALUES ('your-category');

-- Insert perk definition
INSERT INTO perks (
  key, title, description,
  is_coded, is_repeatable, auto_approve,
  perk_type, archtype_id
) VALUES (
  'your-perk-key',
  'Your Perk Name',
  'Description of what it does',
  true,
  true,
  false,
  (SELECT id FROM perk_types WHERE type = 'your-category'),
  (SELECT id FROM archtypes WHERE title = 'YourArchetype')
);
```

4. **Create DTOs** if perk needs special data

```typescript
// src/class/dto/perk-dto/your-perk.dto.ts
export class YourPerkDto {
  studentId: string;
  classId: string;
  // ... perk-specific fields
}
```

5. **Test**

- Unit tests for perk logic
- Integration tests for WebSocket flow
- E2E tests for complete workflow

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Debugging

**Enable Debug Logs:**

```env
LOG_LEVEL=debug
```

**WebSocket Debugging:**

- Use browser console for client-side events
- Check server logs for gateway events
- Enable Socket.io debug mode:

```typescript
// src/main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['log', 'error', 'warn', 'debug', 'verbose'],
});
```

**Database Debugging:**

```bash
# Open Prisma Studio
npx prisma studio
```

---

## Testing

### Unit Tests

```bash
# Run all unit tests
bun run test

# Run with coverage
bun run test:cov

# Watch mode
bun run test:watch
```

### E2E Tests

```bash
bun run test:e2e
```

### Test Structure

```
src/
  module/
    module.service.spec.ts    # Unit tests
    module.controller.spec.ts # Controller tests

test/
  app.e2e-spec.ts              # E2E tests
```

### Writing Tests

**Service Test Example:**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ClassService } from './class.service';
import { PrismaService } from '@utils/prisma/prisma.service';

describe('ClassService', () => {
  let service: ClassService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassService, PrismaService],
    }).compile();

    service = module.get<ClassService>(ClassService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a class', async () => {
    // Test implementation
  });
});
```

---

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `DATABASE_URL` with SSL
- [ ] Rotate `SUPABASE_SERVICE_KEY`
- [ ] Configure proper `FRONTEND_URL` for CORS
- [ ] Enable HTTPS (configure certificates in `main.ts`)
- [ ] Set appropriate `LOG_LEVEL` (info or warn)
- [ ] Configure firewall rules for PostgreSQL
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy for database
- [ ] Review and update CORS origins in `main.ts`

### Build

```bash
# Install dependencies
bun install --production

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
bun run build

# Start production server
bun run start:prod
```

### Environment-Specific Configuration

**Production:**

```env
NODE_ENV=production
PORT=4000
LOG_LEVEL=warn
```

**Staging:**

```env
NODE_ENV=staging
PORT=4000
LOG_LEVEL=info
```

**Development:**

```env
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug
```

### Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Build
RUN bun run build

# Production stage
FROM oven/bun:1-slim
WORKDIR /app

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

EXPOSE 4000
CMD ["bun", "run", "start:prod"]
```

Build and run:

```bash
docker build -t commerce-clash-backend .
docker run -p 4000:4000 --env-file .env commerce-clash-backend
```

### Cloud Deployment Options

**Railway:**

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

**Heroku:**

```bash
heroku create commerce-clash-api
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

**AWS/GCP/Azure:**

- Use managed PostgreSQL (RDS/Cloud SQL/Azure Database)
- Deploy to EC2/Compute Engine/VM
- Configure load balancer and auto-scaling

### Database Hosting

**Supabase (Recommended):**

- Managed PostgreSQL with auth built-in
- Free tier available
- Automatic backups

**Other Options:**

- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- DigitalOcean Managed Databases

---

## Troubleshooting

### Common Issues

#### Issue: Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**

1. Check `DATABASE_URL` format
2. Verify database is running
3. Check firewall/security group rules
4. Test connection:

```bash
npx prisma db pull
```

#### Issue: Supabase Auth Not Working

**Error:** `Invalid Supabase credentials`

**Solution:**

1. Verify `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
2. Check Supabase project status
3. Regenerate keys if compromised

#### Issue: Zoom Meeting Creation Fails

**Error:** `Zoom API authentication failed`

**Solution:**

1. Verify Zoom OAuth credentials
2. Check Server-to-Server OAuth app is activated
3. Ensure account has meeting creation permissions
4. Test OAuth token generation:

```bash
curl -X POST https://zoom.us/oauth/token \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -d "grant_type=account_credentials&account_id=ACCOUNT_ID"
```

#### Issue: WebSocket Connection Refused

**Error:** `WebSocket connection to 'ws://localhost:4000' failed`

**Solution:**

1. Check CORS configuration in `main.ts`
2. Verify frontend URL in allowed origins
3. Check if server is running
4. Test WebSocket connection:

```javascript
const socket = io('http://localhost:4000', {
  withCredentials: true,
});
```

#### Issue: Perk Not Activating

**Symptoms:** Perk request sent but no activation

**Debug Steps:**

1. Check perk status in database:

```sql
SELECT * FROM student_perks WHERE id = 'perk-id';
```

2. Verify perk is unlocked:

```sql
SELECT is_unlocked FROM student_perks WHERE id = 'perk-id';
```

3. Check server logs for errors
4. Verify perk key matches in `PerkEngine.ts`
5. Ensure teacher is connected (for non-auto-approve perks)

#### Issue: Prisma Client Out of Sync

**Error:** `Prisma Client did not initialize yet`

**Solution:**

```bash
npx prisma generate
```

#### Issue: Migration Conflicts

**Error:** `Migration conflicts detected`

**Solution:**

```bash
# Reset database (dev only)
npx prisma migrate reset

# Or resolve conflicts manually
npx prisma migrate resolve --applied MIGRATION_NAME
```

### Performance Optimization

**Database:**

- Add indexes for frequently queried columns
- Use `select` to fetch only needed fields
- Enable connection pooling in `DATABASE_URL`

**WebSocket:**

- Limit room size for large classes
- Debounce frequent events
- Use Redis for session storage (optional)

**API:**

- Implement caching for read-heavy endpoints
- Use pagination for large data sets
- Compress responses with gzip

### Logging

**View Logs:**

```bash
# Development
bun run start:dev

# Production (if using PM2)
pm2 logs commerce-clash
```

**Log Levels:**

- `error`: Critical errors
- `warn`: Warnings
- `info`: General info
- `debug`: Detailed debug info
- `verbose`: Very detailed

### Support & Resources

- **NestJS Documentation**: https://docs.nestjs.com/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **Supabase Documentation**: https://supabase.com/docs
- **Socket.io Documentation**: https://socket.io/docs/
- **Zoom API Documentation**: https://marketplace.zoom.us/docs/api-reference/

---

## License

This project is licensed under the UNLICENSED License.

---

## Project Handover Notes

### Critical Information for New Developers

1. **Supabase Triggers**: The `supabase_triggers.sql` file is essential for syncing Supabase Auth with the database. Must be executed after migrations.

2. **Perk System**: Complex state machine with multiple phases. Review `ClassGateway.ts` (1130 lines) carefully.

3. **WebSocket State**: Student/teacher socket mappings stored in-memory. Will be lost on server restart. Consider Redis for production.

4. **Revered Icon**: Uses `setTimeout` for 7-second cancellation window. Ensure server time is accurate.

5. **CORS Configuration**: Hardcoded in `main.ts`. Update for new frontend domains.

6. **Database Schema**: `class` table renamed to `Renamedclass` due to SQL reserved word. Keep this in mind when querying.

7. **Auto-Approve Perks**: Check `auto_approve` flag before implementing new perk approval flows.

8. **Skill Shifting**: Uses boolean flags for cooldown. Consider timestamp-based cooldowns for better control.

### Known Limitations

- WebSocket connections reset on server restart (no persistence)
- Perk cancellation timer is server-based (not distributed)
- CSV export is synchronous (may timeout on large classes)
- No built-in rate limiting on WebSocket events
- Session storage uses cookies (consider Redis for scaling)

### Future Enhancements

- [ ] Add Redis for WebSocket session storage
- [ ] Implement distributed perk timers
- [ ] Add rate limiting middleware
- [ ] Create admin dashboard
- [ ] Add analytics and reporting
- [ ] Implement class templates
- [ ] Add email notifications
- [ ] Create mobile app API endpoints
- [ ] Add real-time analytics dashboard
- [ ] Implement skill progression trees

---

**Last Updated**: 2024-12-24
**Version**: 1.0.0
**Maintainer**: Texagon.io
