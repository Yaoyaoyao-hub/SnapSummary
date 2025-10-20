# 🔐 API Key Cleanup Instructions

## ⚠️ YOUR API KEY WAS EXPOSED - ACTION REQUIRED

Your YouTube API key was committed to GitHub and is now public. Follow these steps:

## Step 1: Regenerate Your API Key (DO THIS FIRST!)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your current API key (the one starting with `AIzaSyATMc...`)
3. Click **Delete** or **Regenerate**
4. Copy your NEW key
5. Update `src/config/api-keys.js` with the new key:
   ```javascript
   export const API_KEYS = {
     YOUTUBE_API_KEY: 'YOUR_NEW_KEY_HERE'
   };
   ```

## Step 2: Clean Git History (Removes old key from all commits)

Run these commands in order:

```bash
# Make sure you're in the project directory
cd /Users/yaogong/SnapSummary

# Create a backup branch (safety first!)
git branch backup-before-cleanup

# Remove the API key from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/config/constants.js" \
  --prune-empty --tag-name-filter cat -- --all

# Alternative (easier): Just amend the last commit
# If you ONLY committed once, this is simpler:
# git reset --soft HEAD~1
# Then stage and commit the cleaned files

# Clean up refs
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Stage the new files
git add .gitignore
git add config.example.js
git add src/config/api-keys.js  # This file is now gitignored
git add src/utils/api-key-manager.js
git add src/api/youtube.js
git add src/config/constants.js
git add README.md

# Commit the cleaned version
git commit -m "Secure API key management - move keys to gitignored file"

# Force push to remote (WARNING: This rewrites history!)
git push origin main --force
```

## Step 3: Verify

```bash
# Check that the old key is gone
git log --all --full-history --source --all -- "src/config/constants.js"

# Make sure the new file is gitignored
git status  # src/config/api-keys.js should NOT appear
```

## Important Notes

- ✅ Your **new key** will be in `src/config/api-keys.js` (gitignored)
- ✅ Your **old key** will be removed from all git history
- ✅ The built extension (`dist/`) will still contain the key for users
- ⚠️ Force push **rewrites history** - only do this if you're the sole contributor

## After Cleanup

1. **Build the extension**: `npm run build`
2. **Test it**: Load in Chrome to make sure it works
3. **Distribute**: Share the `dist/` folder or publish to Chrome Web Store

Your GitHub repo will be clean, but users can still use the extension!

