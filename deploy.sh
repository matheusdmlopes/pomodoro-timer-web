#!/bin/bash

# Simple deployment script for GitHub Pages

echo "Preparing to deploy to GitHub Pages..."

# Make sure we're in the main branch
git checkout main || { echo "Failed to checkout main branch"; exit 1; }

# Pull the latest changes
git pull || { echo "Failed to pull latest changes"; exit 1; }

# Optionally create or switch to gh-pages branch
# Uncomment the following lines if you want to use a separate branch for deployment
# git checkout gh-pages 2>/dev/null || git checkout -b gh-pages
# git merge main

# Add all changes
git add . || { echo "Failed to add files"; exit 1; }

# Commit changes
git commit -m "Deploy to GitHub Pages: $(date)" || { echo "Nothing to commit"; }

# Push to GitHub
git push origin main || { echo "Failed to push to GitHub"; exit 1; }

# If using gh-pages branch, uncomment the following line
# git push origin gh-pages

echo "Deployment complete!"
echo "Your site should be available at: https://matheusdmlopes.github.io/pomodoro-timer-web/"
echo "Note: It may take a few minutes for the changes to propagate." 