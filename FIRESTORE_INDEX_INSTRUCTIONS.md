# Firestore Index Instructions

## Required Index for Diet Plans

You need to create a composite index in Firebase Firestore to enable querying diet plans by both `userId` and sorting by `createdAt`.

### Error Message

If you see the following error:
```
Error loading user plans: FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/food-recommendation-sytem/firestore/indexes?create_composite=...
```

### Creating the Index Manually

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project: "food-recommendation-sytem"
3. In the left navigation menu, click on "Firestore Database"
4. Click on the "Indexes" tab at the top
5. Click on the "+ Add Index" button
6. Configure the index as follows:
   - Collection ID: `diet_plans`
   - Fields to index:
     - Field path: `userId`, Order: Ascending
     - Field path: `createdAt`, Order: Descending
   - Query scope: Collection

7. Click "Create Index"

The index will take a few minutes to build. Once it's complete, your app's queries will work without errors.

### Temporary Workaround

A temporary workaround has been implemented in the app that:
- Removes the `orderBy` from the Firestore query
- Performs client-side sorting instead

This approach will work, but it's less efficient than using Firestore's native sorting capabilities. Once the index is created, you should revert this change.

### Reverting the Workaround

After creating the index, restore the original code in `src/hooks/useDietPlan.tsx`:

```typescript
const q = query(
  collection(db, 'diet_plans'),
  where('userId', '==', user.uid),
  orderBy('createdAt', 'desc')
);
```

And remove the client-side sorting:

```typescript
// Remove this client-side sort
plans.sort((a, b) => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});
``` 