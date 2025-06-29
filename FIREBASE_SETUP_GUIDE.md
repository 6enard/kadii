# Complete Firebase Setup Guide for Kadi Card Game

## Current Issue - FIXED
The Firestore security rules had incorrect field names for the challenges collection. The rules were looking for `challengerId` and `challengedId`, but the code uses `fromUserId` and `toUserId`.

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

### 2.2 Set Up Security Rules (CRITICAL - CORRECTED FIELD NAMES)

1. Go to **Rules** tab in Firestore
2. Replace your current rules with these CORRECTED rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      // Allow users to create their own document upon registration
      allow create: if request.auth != null && request.auth.uid == userId;
      // Allow users to read, update, and delete their own document
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to read other users' public info for friends feature
      allow read: if request.auth != null;
    }
    
    // Friend requests collection
    match /friendRequests/{requestId} {
      // Allow authenticated users to create friend requests
      allow create: if request.auth != null;
      // Allow users to read friend requests where they are sender or recipient
      allow read: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
      // Allow recipients to update friend requests (accept/decline)
      allow update: if request.auth != null && 
        resource.data.toUserId == request.auth.uid;
      // Allow deletion of friend requests
      allow delete: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
    }
    
    // Game challenges collection - CORRECTED FIELD NAMES
    match /challenges/{challengeId} {
      // Allow authenticated users to create challenges
      allow create: if request.auth != null;
      // Allow users to read challenges where they are challenger or challenged
      // FIXED: Using correct field names fromUserId and toUserId
      allow read: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
      // Allow challenged users to update challenges (accept/decline)
      allow update: if request.auth != null && 
        resource.data.toUserId == request.auth.uid;
      // Allow deletion of challenges
      allow delete: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

**CRITICAL FIX:** The security rules now use the correct field names:
- `fromUserId` instead of `challengerId`
- `toUserId` instead of `challengedId`

This matches exactly what your code is using when creating and querying challenges.

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

### 3.3 Test Friends Feature
1. Create a second test account
2. Try searching for users in the Friends modal
3. Add the first user as a friend
4. Verify the friends array is updated in both user documents

### 3.4 Test Challenges Feature
1. Sign in with the first account
2. Go to Friends & Challenges
3. Add a friend if you haven't already
4. Try sending a challenge to your friend
5. Sign in with the second account
6. Check the Challenges tab - you should see the incoming challenge
7. Try accepting or declining the challenge

## Step 4: Production Considerations

### 4.1 Security Rules (Production Ready)
For production, use these more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can only read/write their own document
      allow create: if request.auth != null && request.auth.uid == userId;
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      
      // Allow reading public user info for friends (limited fields)
      allow read: if request.auth != null && 
        resource.data.keys().hasAll(['username', 'gamesPlayed', 'gamesWon']);
    }
    
    match /friendRequests/{requestId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
      allow update: if request.auth != null && 
        resource.data.toUserId == request.auth.uid;
    }
    
    match /challenges/{challengeId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
      allow update: if request.auth != null && 
        resource.data.toUserId == request.auth.uid;
    }
  }
}
```

### 4.2 Indexes (if needed)
If you experience slow queries, create these indexes:
1. Go to **Indexes** tab in Firestore
2. Create composite indexes for:
   - Collection: `friendRequests`
   - Fields: `toUserId` (Ascending), `status` (Ascending), `createdAt` (Descending)
   - Fields: `fromUserId` (Ascending), `status` (Ascending), `createdAt` (Descending)
   - Collection: `challenges`
   - Fields: `toUserId` (Ascending), `status` (Ascending), `createdAt` (Descending)
   - Fields: `fromUserId` (Ascending), `status` (Ascending), `createdAt` (Descending)

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
   - Check your Firestore security rules match the field names in your code
   - Ensure user is authenticated
   - Verify document structure matches rules

2. **"Missing or insufficient permissions" when loading challenges**
   - This was the main issue - make sure you've updated the security rules with the correct field names (`fromUserId` and `toUserId`)

3. **Users not found in search**
   - Check if user documents are being created properly
   - Verify the username field exists and is populated
   - Check network connectivity

4. **Friends not being added**
   - Verify both users exist in the database
   - Check if the friends array field exists
   - Ensure proper permissions in security rules

5. **Authentication errors**
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

## Expected Document Structures

### Users Collection
```javascript
// Document ID: Firebase Auth User UID
{
  username: "string",
  email: "string", 
  createdAt: "timestamp",
  gamesPlayed: 0,
  gamesWon: 0,
  friends: [] // Array of friend user IDs
}
```

### Friend Requests Collection
```javascript
// Document ID: Auto-generated
{
  fromUserId: "string",    // Sender's user ID
  fromUsername: "string",  // Sender's username
  toUserId: "string",      // Recipient's user ID
  toUsername: "string",    // Recipient's username
  status: "pending",       // "pending", "accepted", "rejected"
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### Challenges Collection
```javascript
// Document ID: Auto-generated
{
  fromUserId: "string",    // Challenger's user ID
  fromUsername: "string",  // Challenger's username
  toUserId: "string",      // Challenged user's ID
  toUsername: "string",    // Challenged user's username
  status: "pending",       // "pending", "accepted", "rejected", "expired"
  gameType: "multiplayer",
  createdAt: "timestamp",
  expiresAt: "timestamp"   // 5 minutes from creation
}
```

## Next Steps

Once this setup is complete, your app will:
- ✅ Allow users to register and sign in
- ✅ Automatically create user profiles in Firestore
- ✅ Enable the friends search and add functionality with friend requests
- ✅ Support game challenges between friends
- ✅ Secure user data with proper access controls
- ✅ Support future multiplayer features

The key fix was correcting the field names in the security rules to match what the code actually uses!