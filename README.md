# AI Model Tracker — Shared Web Version (view for everyone, edit for you only)

This version stores data in **Firebase Firestore** (free) instead of localStorage,
so anyone with the link can view the table live. Only you can sign in and edit it —
everyone else sees a read-only view.

## Part 1 — Create your free Firebase project (~5 min)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project** → give it any name (e.g. `model-tracker`) → finish the wizard
   (you can turn off Google Analytics, it's not needed).
3. In the left sidebar: **Databases & Storage > Firestore** → **Create database**
   (if you don't see "Databases & Storage," look for a plain **Firestore Database**
   entry in the sidebar instead — Google renames this section periodically).
   - Choose any region close to you.
   - Choose **Start in test mode** (we'll set proper-enough rules below).
4. Click the gear icon (top left, next to "Project Overview") → **Project settings**.
5. Scroll to **Your apps** → click the **</>** (web) icon → give it a nickname →
   **Register app**.
6. On the "Add Firebase SDK" step, select **Use a `<script>` tag** (not "Use npm" —
   our code doesn't use a build step). Firebase will show you a code block with a
   `firebaseConfig` object. Copy the values into `firebase-config.js` in this folder
   (already set up, just paste your real values in place of the `PASTE_YOUR_...`
   placeholders).

## Part 2 — Enable sign-in for yourself (Firebase Authentication)

1. In Firebase Console, use the search box at the top (magnifying glass icon)
   and type "Authentication," then click it — or look for it in the left
   sidebar (Google renames/reorganizes sections periodically, so it may or
   may not be under a category heading).
2. Click **Get started**.
3. Under **Sign-in method**, click **Email/Password**, toggle it **Enable**, click **Save**.
4. Go to the **Users** tab → **Add user**.
   - Enter your own email and a password you'll remember.
   - Click **Add user**.
   This is the *only* account that will ever exist for this app — that's what
   makes it "just you." Don't create accounts for anyone else.

## Part 3 — Set Firestore security rules

In Firebase Console: **Firestore Database > Rules**, replace the contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tracker/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

This means: **anyone** can read/view the table (no login needed), but only
someone who is signed in can write/edit it. Since you're the only account
that exists, that's effectively just you.

## Part 4 — Push to GitHub and enable GitHub Pages

1. Create a new repository on GitHub (public or private both work with Pages,
   though private repos need a paid plan for Pages on some account tiers —
   public is simplest).
2. Upload all files in this folder to the repo root:
   - `index.html`
   - `app.js`
   - `style.css`
   - `firebase-config.js` (with YOUR real values filled in)
3. In the repo: **Settings > Pages**.
   - Under "Build and deployment", set **Source** to `Deploy from a branch`.
   - Branch: `main`, folder: `/ (root)` → **Save**.
4. GitHub will give you a URL like:
   `https://yourusername.github.io/your-repo-name/`
   It can take a minute or two to go live the first time.

That's it — share that URL with whoever you want viewing it. Anyone who opens
it sees the live table (read-only). To edit, sign in with the email/password
you created in Part 2, using the sign-in box in the top-right of the page —
only that account can add rows, edit text, change dropdowns, or upload photos.

## Notes on how it behaves

- **Live sync**: uses Firestore's real-time listener, so changes appear for
  everyone without needing to refresh.
- **Sign-in**: only you (the account from Part 2) can edit. Everyone else sees
  the table with dropdowns disabled, text non-editable, and no "+ Add Row"
  button — view only.
- **Debounced saves**: typing doesn't save on every keystroke — it waits ~600ms
  after you stop typing, to avoid excessive writes.
- **Photos**: images are automatically resized/compressed (max 400px, JPEG) before
  saving, to stay well under Firestore's 1MB-per-document limit. If you need
  higher-quality photos, the next step up is Firebase Storage instead of storing
  images directly in Firestore — ask if you want that added.
- **Free tier limits**: Firestore's free (Spark) tier includes 50K reads / 20K
  writes / 20K deletes per day and 1GB storage — more than enough for a small
  team tracker like this.
- **Sync status**: top-right of the header shows `saving…` / `saved ✓` /
  `synced ✓` / `offline / error ⚠️` so you can tell what's happening.

## If you'd rather not use Firebase

Other free options that work the same client-only way: **Supabase** (Postgres-based,
also has a generous free tier) or a self-hosted small backend if you want full
control. Firebase was chosen here for the simplest setup with zero backend code.
