# Contributing to Commerce Clash

Thank you for your interest in contributing to Commerce Clash! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Component Guidelines](#component-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Need Help?](#need-help)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/zach-frontend.git
   cd zach-frontend
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Texagon-Dev/zach-frontend.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL
   ```
6. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Workflow

### Keeping Your Fork Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Merge upstream changes into your main branch
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

### Creating a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/feature-name      # For new features
git checkout -b fix/bug-description       # For bug fixes
git checkout -b docs/documentation-update # For documentation
git checkout -b refactor/component-name   # For refactoring
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building and Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Coding Standards

### TypeScript

- **Always use TypeScript**: No `.js` or `.jsx` files
- **Type everything**: Avoid `any` types unless absolutely necessary
- **Use interfaces for props**: Define clear prop interfaces for components
- **Export types**: Make types reusable across files

Example:
```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  // Implementation
};

// Bad
export const Button = ({ label, onClick, variant }: any) => {
  // Implementation
};
```

### React Best Practices

1. **Functional Components**: Use functional components with hooks
2. **Component Organization**:
   ```typescript
   // 1. Imports
   import React from 'react';

   // 2. Types
   interface Props { }

   // 3. Component
   export const Component: React.FC<Props> = () => {
     // 4. Hooks
     const [state, setState] = useState();

     // 5. Handlers
     const handleClick = () => { };

     // 6. Effects
     useEffect(() => { }, []);

     // 7. Render
     return <div>...</div>;
   };
   ```
3. **Custom Hooks**: Extract reusable logic into custom hooks
4. **Memoization**: Use `useMemo` and `useCallback` for expensive operations
5. **Component Size**: Keep components under 200 lines; split if larger

### Styling with Tailwind CSS

- **Use Tailwind classes**: Prefer Tailwind over custom CSS
- **Use the `cn()` utility**: For conditional classes
  ```typescript
  import { cn } from '@/lib/utils';

  <div className={cn(
    "base-classes",
    isActive && "active-classes",
    variant === 'primary' && "primary-classes"
  )} />
  ```
- **Extract to components**: If classes are repeated, create a component
- **Use shadcn/ui**: Leverage existing UI components before creating new ones

### File Naming

- **Components**: PascalCase (e.g., `StudentCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useWidth.ts`)
- **Types**: PascalCase for interfaces/types, camelCase for files (e.g., `types.ts`)
- **Constants**: UPPER_SNAKE_CASE in code, camelCase for files

### Folder Structure

```
src/
├── components/       # Reusable components
│   ├── ui/          # Base UI components (shadcn)
│   └── *.tsx        # Feature components
├── pages/           # Page components (routes)
├── hooks/           # Custom hooks
├── context/         # Context providers
├── api/             # API layer
├── utils/           # Utility functions
├── lib/             # Third-party library configs
└── assets/          # Static assets
```

---

## Component Guidelines

### Creating New Components

1. **Location**:
   - UI primitives → `src/components/ui/`
   - Feature components → `src/components/`
   - Page components → `src/pages/`

2. **Template**:
   ```typescript
   import React from 'react';
   import { cn } from '@/lib/utils';

   interface ComponentNameProps {
     className?: string;
     // other props
   }

   export const ComponentName: React.FC<ComponentNameProps> = ({
     className,
     // other props
   }) => {
     return (
       <div className={cn("base-classes", className)}>
         {/* Content */}
       </div>
     );
   };
   ```

3. **Export**: Add to `index.ts` in the same directory

### State Management

- **Local state**: Use `useState` for component-specific state
- **Shared state**: Use Context API for app-wide state
- **Server state**: Use direct API calls (consider React Query for caching)

### API Integration

1. **Add endpoint** to `src/api/endpoints.ts`:
   ```typescript
   export const END_POINTS = {
     // ...
     NEW_ENDPOINT: "/path/{param}",
   };
   ```

2. **Create API function** in `src/api/apiClient.ts`:
   ```typescript
   export const apiClient = {
     // ...
     newFunction: async (param: string) => {
       return axiosInstance.get(
         END_POINTS.NEW_ENDPOINT.replace('{param}', param)
       );
     },
   };
   ```

3. **Use transformers** if needed in `src/transformers/`

---

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Examples

```
feat(student): add skill point allocation feature

Implemented pentagon skill tree visualization with real-time
updates via WebSocket. Students can now allocate points across
5 business categories.

Closes #123
```

```
fix(auth): resolve 401 redirect loop issue

Fixed infinite redirect when session expires by clearing
localStorage before navigation.

Fixes #456
```

---

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run linter** and fix all issues:
   ```bash
   npm run lint
   ```

3. **Test your changes** thoroughly:
   - Manual testing in browser
   - Check responsive design
   - Test edge cases
   - Verify no console errors

4. **Build successfully**:
   ```bash
   npm run build
   ```

### Submitting the PR

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill out PR template** with:
   - Clear description of changes
   - Related issue numbers
   - Screenshots/GIFs for UI changes
   - Testing steps
   - Breaking changes (if any)

### PR Title Format

```
<type>: <description>
```

Examples:
- `feat: Add market share visualization`
- `fix: Resolve WebSocket connection drops`
- `docs: Update API integration guide`

### Review Process

- PRs require at least one approval
- Address all review comments
- Keep PRs focused and reasonably sized
- Update PR description if scope changes

---

## Testing Guidelines

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors or warnings
- [ ] Responsive on mobile, tablet, desktop
- [ ] Works in Chrome, Firefox, Safari
- [ ] Loading states display correctly
- [ ] Error states handled gracefully
- [ ] API calls include proper error handling
- [ ] TypeScript compiles without errors
- [ ] Linter passes without warnings

### Future: Automated Testing

When implementing tests:
- Use React Testing Library for component tests
- Use MSW for API mocking
- Aim for >80% coverage on critical paths
- Test user interactions, not implementation details

---

## Need Help?

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create a GitHub Issue with bug template
- **Features**: Create a GitHub Issue with feature request template
- **Security**: Email security@texagon.io (do not open public issue)

---

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes
- Project README (for significant contributions)

---

Thank you for contributing to Commerce Clash and helping make education more engaging!

**Built with passion by Texagon.io**
