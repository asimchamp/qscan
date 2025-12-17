#!/bin/bash

# Simple GitHub update script
# Usage: ./update_github.sh "Your commit message"
#    or: ./update_github.sh (will prompt for message)

set -e

# Check if commit message is provided, otherwise prompt for it
if [ -z "$1" ]; then
    echo "💬 Enter commit message:"
    read -r COMMIT_MESSAGE
    
    # Check if message was entered
    if [ -z "$COMMIT_MESSAGE" ]; then
        echo "Error: Commit message cannot be empty"
        exit 1
    fi
else
    COMMIT_MESSAGE="$1"
fi

# Ask if user wants to create a new branch
echo ""
echo "🌿 Create a new branch? (y/n):"
read -r CREATE_BRANCH

if [[ "$CREATE_BRANCH" =~ ^[Yy]$ ]]; then
    echo "� Enter new branch name:"
    read -r BRANCH_NAME
    
    if [ -z "$BRANCH_NAME" ]; then
        echo "Error: Branch name cannot be empty"
        exit 1
    fi
    
    echo "🌿 Creating and switching to branch: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"
fi

echo "�📦 Adding changes..."
git add .

echo "💬 Committing changes..."
git commit -m "$COMMIT_MESSAGE"

echo "🚀 Pushing to GitHub..."
git push -u origin HEAD

echo "✅ Successfully updated GitHub repository branch!"
