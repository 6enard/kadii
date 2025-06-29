# Firestore Security Rules Fix

The issue is likely with the security rules logic. Here are the corrected rules that should resolve the "Missing or insufficient permissions" error:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Allow users to create their own document
      allow create: if request.auth != null && request.auth.uid == userId;
      // Allow users to read/write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Allow all authenticated users to read any user document (for friends feature)
      allow read: if request.auth != null;
    }
    
    // Friend requests collection
    match /friendRequests/{requestId} {
      // Allow authenticated users to create friend requests
      allow create: if request.auth != null;
      // Allow users to read friend requests where they are involved
      allow read: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
      // Allow users to update friend requests where they are the recipient
      allow update: if request.auth != null && 
        resource.data.toUserId == request.auth.uid;
      // Allow users to delete their own requests
      allow delete: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
    }
    
    // Challenges collection - SIMPLIFIED RULES
    match /challenges/{challengeId} {
      // Allow authenticated users to create challenges
      allow create: if request.auth != null;
      // Allow authenticated users to read challenges where they are involved
      allow read: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
      // Allow users to update challenges where they are the recipient
      allow update: if request.auth != null && 
        resource.data.toUserId == request.auth.uid;
      // Allow users to delete challenges where they are involved
      allow delete: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
    }
  }
}
```

## Key Changes Made:

1. **Simplified the users collection rules** - Added a general read rule for all authenticated users
2. **Fixed the challenges collection rules** - Made sure the field names match exactly what your code uses
3. **Added delete permissions** - This might be needed for cleanup operations

## Alternative Simpler Rules (for testing):

If you're still having issues, try these more permissive rules temporarily to test:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temporary permissive rules for testing
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Use the permissive rules ONLY for testing, then switch back to the secure rules above once everything works.**

## Steps to Apply:

1. Go to Firebase Console → Firestore Database → Rules
2. Replace your current rules with the corrected rules above
3. Click **Publish**
4. Test the challenges feature again

## If Still Having Issues:

1. Check the browser console for more detailed error messages
2. Verify you're signed in properly (check `user` object in console)
3. Try the permissive rules temporarily to isolate if it's a rules issue
4. Check if the documents are being created with the correct field structure

The main issue was likely that the rules weren't properly allowing read access to challenges for authenticated users.