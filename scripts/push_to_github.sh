#!/bin/bash
# Script to push project to GitHub
# Usage: ./scripts/push_to_github.sh <YOUR_GITHUB_REPO_URL>
# Example: ./scripts/push_to_github.sh https://github.com/username/schoolnexus.git

set -e

REPO_URL=$1

if [ -z "$REPO_URL" ]; then
  echo "=========================================================="
  echo "❌ กรุณาระบุ GitHub Repository URL ตัวอย่างเช่น:"
  echo "   ./scripts/push_to_github.sh https://github.com/YOUR_USERNAME/YOUR_REPO.git"
  echo " หรือ:"
  echo "   ./scripts/push_to_github.sh git@github.com:YOUR_USERNAME/YOUR_REPO.git"
  echo "=========================================================="
  exit 1
fi

echo "🚀 กำลังเตรียมการ Push โปรเจกต์ขึ้น GitHub..."

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
  git init -b main
fi

# Configure identity if not set
if [ -z "$(git config user.name)" ]; then
  git config user.name "SchoolNexus Developer"
fi
if [ -z "$(git config user.email)" ]; then
  git config user.email "developer@schoolnexus.local"
fi

# Stage files
git add -A

# Commit
if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "ℹ️ ไม่มีการเปลี่ยนแปลงใหม่ที่จะ commit"
else
  git commit -m "feat: SchoolNexus modern smart campus full update"
fi

# Set remote origin
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# Push to GitHub
echo "📤 กำลัง Push โค้ดไปยัง $REPO_URL (branch: main)..."
git push -u origin main --force

echo "✅ สำเร็จ! โปรเจกต์ถูก push ขึ้น GitHub เรียบร้อยแล้ว"
