# Project Instructions for Coding Agent

## 1. Auto Push to GitHub & Deploy to GitHub Pages (Mandatory on every edit/turn)
Whenever any code modifications, fixes, or additions are made in this repository:
1. Ensure `lint_applet` and `compile_applet` pass.
2. Automatically commit all changed files and push directly to GitHub repository (`origin main`) and build & deploy live app to `gh-pages` branch:
   ```bash
   ./scripts/auto_push.sh "<descriptive message of changes>"
   ```
3. Ensure Git credentials and remote repository origin remain valid and configured.

## 2. Commit Message Standards
- Use Conventional Commits format (e.g. `feat: ...`, `fix: ...`, `refactor: ...`).
