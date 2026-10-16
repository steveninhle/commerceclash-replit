# Commerce Clash - Quick Start Guide

A one-page reference for getting up and running quickly.

---

## Setup (5 minutes)

```bash
# 1. Clone and navigate
git clone <repository-url>
cd zach-frontend

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env and set VITE_BASE_URL=http://localhost:3000

# 4. Start development server
npm run dev
# Open http://localhost:5173
```

---

## Essential Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code quality |
| `npm run host` | Dev server with network access |

---

## Environment Variables

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_BASE_URL` | Yes | `http://localhost:3000` |

---

## Project Structure (Key Folders)

```
src/
├── api/              # API client, endpoints, axios config
├── components/       # Reusable components
│   └── ui/          # shadcn/ui base components
├── pages/           # Route/page components
├── context/         # React Context providers
├── hooks/           # Custom React hooks
├── routes/          # Routing configuration
├── utils/           # Helper functions
└── assets/          # Images, SVGs, animations
```

---

## Tech Stack Quick Reference

- **Framework**: React 18.3.1 + TypeScript 5.8.3
- **Build**: Vite 7.0.4 (SWC compiler)
- **Styling**: Tailwind CSS 4.1.13 + shadcn/ui
- **Routing**: React Router v7
- **API**: Axios + Socket.io
- **Video**: Zoom Meeting SDK 4.0.0
- **Charts**: Recharts
- **Notifications**: Sonner

---

## Common Tasks

### Add a New Component

```typescript
// src/components/MyComponent.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  className?: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ className }) => {
  return <div className={cn("base-classes", className)}>Content</div>;
};
```

### Add a New API Endpoint

```typescript
// 1. Add to src/api/endpoints.ts
export const END_POINTS = {
  NEW_ENDPOINT: "/path/{param}",
};

// 2. Add to src/api/apiClient.ts
export const apiClient = {
  newFunction: async (param: string) => {
    return axiosInstance.get(END_POINTS.NEW_ENDPOINT.replace('{param}', param));
  },
};

// 3. Use in component
import { apiClient } from '@/api';

const data = await apiClient.newFunction('value');
```

### Add a New Route

```typescript
// src/routes/index.tsx
<Route path="/new-page" element={<NewPage />} />
```

### Use WebSocket

```typescript
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BASE_URL);

socket.on('eventName', (data) => {
  // Handle event
});

// Clean up on unmount
return () => socket.disconnect();
```

---

## Styling Patterns

```typescript
// Use Tailwind classes
<div className="flex items-center gap-4 p-6" />

// Conditional classes with cn()
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "bg-blue-500",
  variant === 'large' && "text-xl"
)} />

// Use shadcn/ui components
import { Button } from '@/components/ui/button';

<Button variant="outline" size="lg">Click me</Button>
```

---

## User Roles & Routes

### Teacher Routes (Protected)
- `/teacher-dashboard` - Main dashboard
- `/student-details/:id` - Individual student view

### Student Routes (Protected)
- `/student-enrolled-courses` - Course list
- `/home` - Student home
- `/market-share` - Market share view

### Shared Routes (Protected)
- `/meeting` - Zoom meeting room

### Public Routes
- `/auth/signin` - Login
- `/auth/signup` - Registration

---

## Key Features

### Gamification System
- **6 Heroes**: Baron, Tycoon, Diplomat, Visionary, Explorer, General
- **5 Skill Categories**: Innovation, Quality, Team, Logistics, Marketing
- **Perks**: Core and Ultra tier abilities
- **Market Share**: Competitive metric between students

### Real-time Features (WebSocket)
- Skill point updates
- CEO assignments
- Market share changes
- Course enrollments

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Dev server won't start | `rm -rf node_modules && npm install` |
| API errors | Check `VITE_BASE_URL` in `.env` |
| 401 errors | Clear cookies and localStorage |
| Build fails | Run `npm run lint` and fix errors |
| WebSocket not working | Verify backend WebSocket server is running |

---

## Deployment

### Docker
```bash
docker build --build-arg VITE_BASE_URL=https://api.example.com -t commerce-clash .
docker run -d -p 80:80 commerce-clash
```

### Static Hosting
```bash
VITE_BASE_URL=https://api.example.com npm run build
# Deploy the dist/ folder to Netlify, Vercel, etc.
```

---

## Documentation

- **Full Documentation**: [README.md](./README.md)
- **Contributing Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
- **License**: [LICENSE.md](./LICENSE.md)

---

## Getting Help

- 📖 **Full README**: Comprehensive documentation
- 🐛 **Bug Reports**: GitHub Issues
- 💡 **Feature Requests**: GitHub Issues
- 💬 **Questions**: GitHub Discussions
- 🌐 **Website**: [texagon.io](https://texagon.io)

---

## Important Notes

✅ **Do:**
- Always use TypeScript
- Use Tailwind CSS for styling
- Follow existing code patterns
- Run linter before committing
- Test in multiple browsers

❌ **Don't:**
- Commit `.env` files
- Use `any` type in TypeScript
- Create inline styles
- Skip error handling
- Commit without linting

---

**Built by Texagon.io** | **License**: MIT | **Version**: 4.0.0

Ready to code? Run `npm run dev` and start building!
