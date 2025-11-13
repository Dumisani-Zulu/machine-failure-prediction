# Authentication Setup

## Overview
The authentication system has been successfully integrated into the application with the following features:

## Features
- ✅ User sign-in and sign-up functionality
- ✅ Automatic redirect to signin page when not authenticated
- ✅ Conditional sidebar rendering (only for authenticated users)
- ✅ Sign-out functionality that redirects to signin page
- ✅ Loading states and error handling
- ✅ User data persistence in localStorage
- ✅ Route protection for all main pages

## File Structure
```
Frontend/
├── contexts/
│   └── AuthContext.tsx          # Main authentication context
├── components/
│   └── ConditionalLayout.tsx    # Layout wrapper for auth state
├── hooks/
│   └── useAuthProtection.ts     # Auth protection hook
├── middleware.ts                # Next.js middleware for route handling
└── app/
    ├── layout.tsx               # Root layout with AuthProvider
    └── auth/
        ├── layout.tsx           # Auth pages layout
        ├── signin/
        │   └── page.tsx         # Sign-in page
        ├── signup/
        │   └── page.tsx         # Sign-up page
        └── forgot-password/
            └── page.tsx         # Password reset page
```

## How it Works

### 1. AuthContext (`contexts/AuthContext.tsx`)
- Manages authentication state across the app
- Provides `signIn`, `signOut`, and `updateUser` functions
- Automatically redirects based on auth state
- Persists user data in localStorage

### 2. ConditionalLayout (`components/ConditionalLayout.tsx`)
- Wraps the app content and decides whether to show the sidebar
- Shows loading spinner during auth state check
- Renders without sidebar for auth pages or unauthenticated users

### 3. Route Protection
- All main pages (Users, Machines, Projects, Settings) use `useAuthProtection` hook
- Automatically redirects to signin if not authenticated
- Shows loading state while checking authentication

### 4. Sign-out Functionality
- Sign-out button in the sidebar dropdown menu
- Clears user data and redirects to signin page
- Updates sidebar to show current user information

## Usage

### For Demo/Testing
- Visit any protected route (like `/users` or `/machines`)
- You'll be redirected to `/auth/signin`
- Sign in with any valid email (must contain @) and password (min 6 chars)
- You'll be redirected to the dashboard
- Click the user avatar in the sidebar to access sign-out option

### Default Credentials
The system accepts any email/password combination for demo purposes:
- Email: Must contain "@" symbol
- Password: Must be at least 6 characters long

Examples:
- Email: `admin@example.com`, Password: `password123`
- Email: `user@test.com`, Password: `123456`

## Integration Points

### Sidebar Updates
- Shows current user's name and email
- Avatar displays user initials
- Sign-out option in dropdown menu

### Page Protection
All main pages include:
```tsx
const { isAuthenticated, isLoading } = useAuthProtection();

if (isLoading) {
  return <LoadingSpinner />;
}

if (!isAuthenticated) {
  return null; // Redirect handled by hook
}
```

### Authentication Flow
1. User visits protected route → Redirected to `/auth/signin`
2. User signs in → Redirected to originally requested route or dashboard
3. User data persisted in localStorage
4. Sidebar shows user info and sign-out option
5. Sign-out clears data and redirects to `/auth/signin`

## Next Steps
- Connect to real authentication API
- Add role-based permissions
- Implement password reset functionality
- Add remember me functionality
- Enhance error handling and validation
