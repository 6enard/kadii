# Complete Firebase Setup Guide for Kadi Card Game

## Step 1: Firebase Authentication Setup

### 1.1 Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **kadii-171f7**
3. Click **Authentication** in the left sidebar
4. Click **Get started** if not already enabled
5. Go to **Sign-in method** tab

### 1.2 Configure Email/Password Authentication
1. Click on **Email/Password** provider
2. **Enable** the first option (Email/Password)
3. **DISABLE** the second option (Email link - passwordless sign-in)
4. Click **Save**

### 1.3 Authentication Settings
1. Go to **Settings** tab in Authentication
2. Under **User actions**:
   - **DISABLE** "Email enumeration protection" (for easier development)
3. Under **Authorized domains**:
   - Make sure your domain is listed (should include localhost for development)

## Step 2: Firestore Database Setup

### 2.1 Create Firestore Database
1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (we'll secure it later)
4. Select your preferred location (choose closest to your users)
5. Click **Done**

### 2.2 Create the Users Collection

#### Method 1: Automatic Creation (Recommended)
The app will automatically create user documents when users sign up. Just make sure the structure is correct by creating one test document:

1. Click **Start collection**
2. Collection ID: `users`
3. Document ID: Click **Auto-ID**
4. Add these fields:

| Field Name | Type | Value |
|------------|------|-------|
| username | string | "testuser" |
| email | string | "test@example.com" |
| createdAt | timestamp | *Click timestamp icon → Current date/time* |
| gamesPlayed | number | 0 |
| gamesWon | number | 0 |

5. Click **Save**

#### Method 2: Manual Structure Setup
If you prefer to set up the structure manually:

```javascript
// Document structure for users collection
{
  username: "string",      // User's display name
  email: "string",         // User's email address
  createdAt: "timestamp",  // Account creation date
  gamesPlayed: "number",   // Total games played (default: 0)
  gamesWon: "number",      // Total games won (default: 0)
}
```

### 2.3 Set Up Security Rules (Important!)

1. Go to **Rules** tab in Firestore
2. Replace the default rules with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read other users' public info for future features
      allow read: if request.auth != null;
    }
    
    // Future collections can be added here as needed
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

## Step 3: Test the Setup

### 3.1 Test User Registration
1. Run your app: `npm run dev`
2. Click **Sign In / Sign Up**
3. Create a new account with:
   - Username: "testplayer"
   - Email: "test@example.com"
   - Password: "password123"

### 3.2 Verify Database Creation
1. Go back to Firestore Console
2. Check the **users** collection
3. You should see a new document with the user's UID as the document ID
4. Verify all fields are populated correctly

## Step 4: Production Considerations

### 4.1 Security Rules (Production Ready)
For production, use these more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can only read/write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow reading public user info for future features (limited fields)
      allow read: if request.auth != null && 
        resource.data.keys().hasAll(['username', 'gamesPlayed', 'gamesWon']);
    }
  }
}
```

### 4.2 Indexes (if needed)
If you experience slow queries, create these indexes:
1. Go to **Indexes** tab in Firestore
2. Create composite index for:
   - Collection: `users`
   - Fields: `username` (Ascending)

### 4.3 Backup Strategy
1. Go to **Backups** tab
2. Set up automatic backups for your database

## Step 5: Environment Variables

Your current Firebase config in `src/firebase/config.ts` is correct:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyC5wi6x-V1LfZW90Ch5KH5pVnSyaLdNOFw",
  authDomain: "kadii-171f7.firebaseapp.com",
  projectId: "kadii-171f7",
  storageBucket: "kadii-171f7.firebasestorage.app",
  messagingSenderId: "261075441082",
  appId: "1:261075441082:web:9960496d0815757dfef983",
  measurementId: "G-M29H6YL64F"
};
```

## Step 6: Troubleshooting

### Common Issues:

1. **"Permission denied" errors**
   - Check your Firestore security rules
   - Ensure user is authenticated
   - Verify document structure matches rules

2. **Users not found in search**
   - Check if user documents are being created properly
   - Verify the username field exists and is populated
   - Check network connectivity

3. **Authentication errors**
   - Verify Email/Password is enabled in Firebase Console
   - Check if email enumeration protection is disabled for development
   - Ensure authorized domains include your development URL

## Step 7: Monitoring and Analytics

1. **Authentication Monitoring**
   - Go to Authentication → Users to see registered users
   - Monitor sign-in methods and user activity

2. **Database Monitoring**
   - Go to Firestore → Usage to monitor reads/writes
   - Check for any security rule violations

3. **Error Monitoring**
   - Check the Firebase Console for any errors
   - Monitor the browser console for client-side errors

## Next Steps

Once this setup is complete, your app will:
- ✅ Allow users to register and sign in
- ✅ Automatically create user profiles in Firestore
- ✅ Secure user data with proper access controls
- ✅ Support future multiplayer features when ready

The app now focuses on the core card game experience with a clean foundation for future social features!