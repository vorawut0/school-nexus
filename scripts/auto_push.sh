#!/bin/bash
# Auto Sync & Deploy to GitHub repository (main branch + gh-pages live app)
set -e

REMOTE_URL=$(git config --get remote.origin.url)

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

git push origin main
echo "✅ Source code pushed to 'main' branch."

# 2. Build production web app for GitHub Pages
echo "📦 Building production web app for GitHub Pages..."
npm run build

# 3. Deploy built 'dist' folder to 'gh-pages' branch
echo "🌐 Deploying to 'gh-pages' branch for GitHub Pages hosting..."
cd dist
rm -rf .git
git init -b gh-pages
git config user.name "vorawut0"
git config user.email "vorawutphetrai17@gmail.com"
git add -A
git commit -m "deploy: build and deploy SchoolNexus to GitHub Pages [$(date '+%Y-%m-%d %H:%M:%S')]"
git remote add origin "$REMOTE_URL"
git push -u origin gh-pages --force
cd ..

echo "🎉 All Done! Web App is live at: https://vorawut0.github.io/school-nexus/"


