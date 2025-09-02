# User System Documentation

## Overview
This system automatically saves user data to the `users` table when accounts are created and manages daily login streaks.

## Database Schema
The `users` table has the following structure:
- `id` (string): Unique user ID from Supabase Auth
- `name` (string): User's display name
- `email` (string): User's email address
- `streak_count` (number): Current consecutive daily login streak
- `created_at` (timestamp): When the account was created
- `updated_at` (timestamp): Last time the user logged in

## How It Works

### 1. Account Creation
When a user signs up:
- Supabase Auth creates the authentication account
- The `createUserProfile` function automatically creates a record in the `users` table
- Initial `streak_count` is set to 0
- `created_at` and `updated_at` are set to the current timestamp

### 2. Daily Login Streak Management
Every time a user logs in:
- The `updateStreakCount` function is called automatically
- It calculates the difference between the current login and the last login
- If it's the next consecutive day: streak increases by 1
- If it's more than 1 day later: streak resets to 1
- If it's the same day: streak remains unchanged
- `updated_at` is updated to the current timestamp

### 3. Fetching User Data
You can access user profile data in any component using the `useAuth` hook:
```tsx
import { useAuth } from '../contexts/AuthContext';

const { userProfile, loading } = useAuth();

if (userProfile) {
  console.log('Current streak:', userProfile.streak_count);
  console.log('User name:', userProfile.name);
}
```

## Available Functions

### Database Operations (`dbOperations`)
- `createUserProfile(userData)`: Creates a new user profile
- `getUser(userId)`: Fetches user profile by ID
- `updateUser(userId, updates)`: Updates user profile
- `updateStreakCount(userId)`: Updates streak count on login
- `resetStreakCount(userId)`: Resets streak to 0 (for testing)

### Auth Context Functions
- `signUp(email, password, name)`: Creates account and profile
- `signIn(email, password)`: Logs in and updates streak
- `signOut()`: Logs out user
- `refreshUserProfile()`: Manually refreshes profile data

## Example Usage

### Displaying User Profile
```tsx
import { UserProfile } from './components/UserProfile';

// In your component
<UserProfile />
```

### Accessing User Data
```tsx
const { userProfile } = useAuth();

if (userProfile) {
  return (
    <div>
      <h1>Welcome, {userProfile.name}!</h1>
      <p>Your current streak: {userProfile.streak_count} days</p>
      <p>Member since: {new Date(userProfile.created_at).toLocaleDateString()}</p>
    </div>
  );
}
```

## Testing Streak System

To test the streak functionality:
1. Create a new account
2. Log in on consecutive days to see the streak increase
3. Skip a day to see the streak reset
4. Use `resetStreakCount()` function to manually reset for testing

## Notes
- Streak calculation is based on 24-hour periods
- Multiple logins on the same day don't affect the streak
- The system automatically handles timezone differences
- All database operations include proper error handling
