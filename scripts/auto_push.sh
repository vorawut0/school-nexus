#!/bin/bash
# Auto Sync & Deploy to GitHub repository (main branch + gh-pages live app)
set -e

REMOTE_URL=$(git config --get remote.origin.url)
if [ -z "$REMOTE_URL" ]; then
  echo "❌ Error: remote.origin.url not configured in git"
  exit 1
fi

# Detect token if available (environment variable or local token file)
PUSH_URL="$REMOTE_URL"
if [ -n "$GITHUB_TOKEN" ]; then
  PUSH_URL="https://${GITHUB_TOKEN}@github.com/vorawut0/school-nexus.git"
elif [ -n "$GH_TOKEN" ]; then
  PUSH_URL="https://${GH_TOKEN}@github.com/vorawut0/school-nexus.git"
elif [ -f .github_token ]; then
  TOKEN=$(cat .github_token | tr -d '[:space:]')
  if [ -n "$TOKEN" ]; then
    PUSH_URL="https://${TOKEN}@github.com/vorawut0/school-nexus.git"
  fi
fi

echo "🚀 Syncing changes to GitHub repository (vorawut0/school-nexus)..."

git config user.name "vorawut0"
git config user.email "vorawutphetrai17@gmail.com"

# 1. Stage and Push source code to main branch
git add -A
if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "ℹ️ No local changes to commit. Pushing existing commits..."
else
  COMMIT_MSG=${1:-"update: auto sync changes from Google AI Studio Build [$(date '+%Y-%m-%d %H:%M:%S')]"}
  git commit -m "$COMMIT_MSG"
fi

echo "Pushing to 'main' branch..."
if git push "$PUSH_URL" main; then
  echo "✅ Source code pushed to 'main' branch."
else
  echo "⚠️ Git Push failed due to missing GitHub credentials (Personal Access Token)."
  echo "👉 To enable automatic push, set your token with: git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/vorawut0/school-nexus.git"
  exit 128
fi

# 2. Build production web app for GitHub Pages
echo "📦 Building production web app for GitHub Pages..."
npm run build

# 3. Deploy built 'dist' folder to 'gh-pages' branch
echo "🌐 Deploying to 'gh-pages' branch for GitHub Pages hosting..."
cd dist
cp index.html 404.html
rm -rf .git
git init -b gh-pages
git config user.name "vorawut0"
git config user.email "vorawutphetrai17@gmail.com"
git add -A
git commit -m "deploy: build and deploy SchoolNexus to GitHub Pages [$(date '+%Y-%m-%d %H:%M:%S')]"
git push -u "$PUSH_URL" gh-pages --force
cd ..

echo "🎉 All Done! Web App is live at: https://vorawut0.github.io/school-nexus/"


