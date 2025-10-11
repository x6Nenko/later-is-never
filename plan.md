🎯 Extension Plan: "Later is Never"
Core Features

Custom "Save" button next to YouTube's save button on every video
Separate watch later list stored locally
Auto-deletion after customizable period (default: 1 week)
Popup interface to view saved videos
Optional notifications before video expires (customizable timing)
Visual countdown for each saved video

Technical Structure
Files you'll need:
my-extension/
├── manifest.json (Extension configuration)
├── content.js (Injects button into YouTube pages)
├── popup.html (UI for viewing saved videos)
├── popup.js (Logic for popup interface)
├── background.js (Service worker for notifications & cleanup)
├── storage.js (Helper functions for data management)
├── styles.css (Styling for popup)
└── icons/ (Extension icons 16x16, 48x48, 128x128)

Development Roadmap
Phase 1: Basic Setup ⭐ Start here

Create manifest.json with necessary permissions
Set up basic project structure
Test that extension loads in Chrome

Phase 2: Core Functionality 🚧 IN PROGRESS

Detect when user opens popup on a YouTube video page
Extract video data (URL, title, thumbnail, timestamp) from current page
Store videos in chrome.storage.local
Show "Save Current Video" button in popup when on YouTube
Display saved videos list in popup

Phase 3: Deletion Logic

Implement expiration checking
Auto-delete expired videos
Add manual delete option

Phase 4: Settings & Polish

Create settings page for:

Default expiration period
Notification toggle
Notification timing

Add visual countdown
Style everything nicely

Phase 5: Notifications

Set up service worker with alarms
Check for videos nearing expiration
Send individual notifications

Key Chrome APIs We'll Use

chrome.storage - Save video data
chrome.alarms - Periodic checks for expiration
chrome.notifications - Alert user before deletion
Content Scripts - Inject button into YouTube
