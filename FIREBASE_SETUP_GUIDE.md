# Complete Firebase Setup Guide for Kadi Card Game

## Current Issue
You have a Firestore document but no corresponding user in Firebase Authentication. This means the document was created manually. Let's fix this and ensure proper automatic registration.

## Step 1: Clean Up Current Data

### 1.1 Delete the Manual Document
1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Firestore Database
2. Find the `users` collection
3. Delete the document you created manually (the one with test@gmail.com)
4. This ensures we start fresh with proper automatic registration

## Step 2: Firebase Authentication Setup

### 2.1 Enable Authentication
1. Go to Firebase Console → Authentication
2. Click **Get started** if not already enabled
3. Go to **Sign-in method** tab

### 2.2 Configure Email/Password Authentication
1. Click on **Email/Password** provider
2. **Enable** the first option (Email/Password)
3. **DISABLE** the second option (Email link - passwordless sign-in)
4. Click **Save**

### 2.3 Authentication Settings (Important!)
1. Go to **Settings** tab in Authentication
2. Under **User actions**:
   - **DISABLE** "Email enumeration protection" (this prevents the "user not found" errors during development)
3. Under **Authorized domains**:
   - Make sure `localhost` is listed for development
   - Add your production domain when you deploy

## Step 3: Firestore Database Setup

### 3.1 Verify Database Exists
1. Go to Firestore Database in Firebase Console
2. If not created, click **Create database** → **Start in test mode**
3. Choose your preferred location

### 3.2 Set Up Security Rules
1. Go to **Rules** tab in Firestore
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read other users' public info for friends feature
      allow read: if request.auth != null;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

## Step 4: Test the Complete Flow

### 4.1 Test User Registration
1. Run your app: `npm run dev`
2. Click **Sign In / Sign Up**
3. Switch to **Sign Up** mode
4. Create a new account with:
   - Username: "testplayer"
   - Email: "test@example.com"
   - Password: "password123"

### 4.2 Verify Both Systems
After successful registration, check:

**Firebase Authentication:**
1. Go to Authentication → Users
2. You should see the new user with the email you used
3. Note the User UID (this will be the document ID in Firestore)

**Firestore Database:**
1. Go to Firestore Database → Data
2. You should see a `users` collection
3. Inside, a document with the User UID as the document ID
4. The document should contain:
   ```
   username: "testplayer"
   email: "test@example.com"
   createdAt: [current timestamp]
   gamesPlayed: 0
   gamesWon: 0
   friends: [] (empty array)
   ```

## Step 5: Test Friends Feature

### 5.1 Create a Second User
1. Sign out from the first account
2. Create another test account
3. Verify it appears in both Authentication and Firestore

### 5.2 Test Friend Search
1. Sign in with the first account
2. Click **Find Friends**
3. You should see the second user in the search results
4. Try adding them as a friend

## Step 6: Troubleshooting Common Issues

### Issue: "User not found" during sign-in
**Solution:** Make sure "Email enumeration protection" is DISABLED in Authentication Settings

### Issue: "Permission denied" in Firestore
**Solution:** Check your security rules are set correctly (Step 3.2)

### Issue: User created in Auth but not in Firestore
**Solution:** Check browser console for errors. The AuthModal component should handle this automatically.

### Issue: Friends search shows no results
**Solution:** Make sure users have `username` field populated and security rules allow reading other users' data

## Step 7: Production Considerations

### 7.1 Security Rules for Production
For production, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can only read/write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow reading limited public user info for friends
      allow read: if request.auth != null && 
        resource.data.keys().hasAll(['username', 'gamesPlayed', 'gamesWon']);
    }
  }
}
```

### 7.2 Enable Email Enumeration Protection
In production, re-enable "Email enumeration protection" for better security.

## Expected Document Structure

When a user registers, this is what should be automatically created:

```javascript
// Document ID: Firebase Auth User UID (e.g., "abc123def456")
{
  username: "string",      // User's chosen username
  email: "string",         // User's email (lowercase, trimmed)
  createdAt: "timestamp",  // Account creation date
  gamesPlayed: 0,          // Total games played (number)
  gamesWon: 0,             // Total games won (number)
  friends: []              // Array of friend UIDs (empty initially)
}
```

## Key Points:
- ✅ **Document ID = Firebase Auth UID** (automatic linking)
- ✅ **No manual document creation needed**
- ✅ **Registration creates both Auth user AND Firestore document**
- ✅ **Friends array starts empty, not with empty string**
- ✅ **Username validation (3-20 characters)**
- ✅ **Email validation and normalization**

The app will now automatically handle user registration and create the proper database structure!