# Clerk Authentication Setup Guide

## Overview
This guide will help you complete the Clerk authentication integration for your Machine Failure Prediction application.

## What's Been Done

✅ **Installed Clerk package**: `@clerk/nextjs` has been installed  
✅ **Updated layout.tsx**: App is now wrapped with `ClerkProvider`  
✅ **Updated ConditionalLayout**: Now uses Clerk's `useAuth` hook for authentication state  
✅ **Updated AppSidebar**: Now uses Clerk's `useUser` and `useClerk` hooks  
✅ **Created Sign-In page**: `app/sign-in/[[...sign-in]]/page.tsx`  
✅ **Created Sign-Up page**: `app/sign-up/[[...sign-up]]/page.tsx`  
✅ **Updated middleware.ts**: Protected routes with Clerk middleware  
✅ **Configured environment variables**: `.env.local` has placeholder values

## What You Need to Do

### Step 1: Create a Clerk Account

1. Go to [https://dashboard.clerk.com/sign-up](https://dashboard.clerk.com/sign-up)
2. Sign up for a free Clerk account
3. Create a new application
4. Choose your authentication options (Email/Password, Google, GitHub, etc.)

### Step 2: Get Your API Keys

1. In your Clerk dashboard, go to **API Keys** in the sidebar
2. You'll see two keys:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

### Step 3: Update Environment Variables

1. Open `Frontend/.env.local`
2. Replace the placeholder values with your actual keys:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here

# Clerk URLs (these should already be correct)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Step 4: Configure Redirect URLs in Clerk Dashboard

1. In your Clerk dashboard, go to **Paths**
2. Set the following URLs:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/sign-up`
   - **Home URL**: `/`
   - **After sign-in URL**: `/`
   - **After sign-up URL**: `/`

### Step 5: Test the Authentication Flow

1. **Restart your frontend server** (if it's already running):
   ```powershell
   # Stop the current server (Ctrl+C)
   # Then restart it
   cd Frontend
   npm run dev
   ```

2. **Visit your app**: Navigate to [http://localhost:3001](http://localhost:3001)

3. **You should be redirected to sign-in page** if you're not authenticated

4. **Test sign-up**:
   - Click "Sign up" link
   - Create a new account
   - You should be redirected to the dashboard after successful sign-up

5. **Test sign-in**:
   - Sign out from the sidebar dropdown
   - You should be redirected to the sign-in page
   - Sign in with your credentials
   - You should be redirected back to the dashboard

6. **Test protected routes**:
   - Try accessing `/vitals`, `/users`, `/notifications` without signing in
   - You should be redirected to the sign-in page

## Files Modified

### Updated Files:
- `Frontend/.env.local` - Added Clerk environment variables
- `Frontend/app/layout.tsx` - Wrapped app with ClerkProvider
- `Frontend/components/ConditionalLayout.tsx` - Uses Clerk's useAuth hook
- `Frontend/components/app-sidebar.tsx` - Uses Clerk's useUser and useClerk hooks
- `Frontend/middleware.ts` - Added Clerk route protection

### New Files:
- `Frontend/app/sign-in/[[...sign-in]]/page.tsx` - Sign-in page
- `Frontend/app/sign-up/[[...sign-up]]/page.tsx` - Sign-up page

### Files to Remove (Optional - Old Auth System):
After confirming Clerk works, you can delete:
- `Frontend/contexts/AuthContext.tsx` - No longer needed
- `Frontend/app/auth/*` - Old auth pages (signin, signup, forgot-password)

## Customization Options

### Appearance Customization

You can customize Clerk's appearance to match your brand. Update the `appearance` prop in the SignIn/SignUp components:

```tsx
<SignIn 
  appearance={{
    elements: {
      rootBox: "mx-auto",
      card: "shadow-xl bg-white dark:bg-gray-800",
      headerTitle: "text-2xl font-bold",
      formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
    }
  }}
/>
```

### Add More Authentication Providers

In your Clerk dashboard:
1. Go to **User & Authentication** → **Social Connections**
2. Enable providers like:
   - Google
   - GitHub
   - Microsoft
   - Facebook
   - etc.

### User Profile Management

Add a user profile page by creating `app/user-profile/[[...user-profile]]/page.tsx`:

```tsx
import { UserProfile } from '@clerk/nextjs'

export default function UserProfilePage() {
  return (
    <div className="flex justify-center py-8">
      <UserProfile />
    </div>
  )
}
```

Then add a link in the sidebar dropdown menu.

## Troubleshooting

### "Clerk: Missing publishable key"
- Make sure you've added the actual keys to `.env.local`
- Restart your development server after updating `.env.local`

### "Redirect loop"
- Check that your redirect URLs in Clerk dashboard match your app's routes
- Make sure middleware.ts is correctly configured

### "Module not found: @clerk/nextjs"
- Run `npm install @clerk/nextjs` again
- Make sure you're in the Frontend directory

### User data not showing in sidebar
- The Clerk user object structure is different from the old AuthContext
- User data: `user.fullName`, `user.imageUrl`, `user.primaryEmailAddress.emailAddress`

## Next Steps

Once authentication is working:
1. ✅ Remove old auth files (`contexts/AuthContext.tsx`, `app/auth/*`)
2. ✅ Configure user roles and permissions in Clerk dashboard
3. ✅ Add organization support (if needed for multi-tenant)
4. ✅ Set up webhooks to sync user data with your backend
5. ✅ Configure email templates in Clerk dashboard
6. ✅ Set up production keys when deploying

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components](https://clerk.com/docs/components/overview)
- [Customization Options](https://clerk.com/docs/components/customization/overview)

## Support

If you encounter any issues:
1. Check the [Clerk Docs](https://clerk.com/docs)
2. Visit [Clerk Discord](https://clerk.com/discord)
3. Check browser console for error messages
4. Verify all environment variables are set correctly
