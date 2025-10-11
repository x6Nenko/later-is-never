# Timed Watch Later for YouTube

A Chrome extension that saves YouTube videos with automatic expiration. Videos are auto-deleted after a customizable period (default: 1 week).

## Current Status: Phase 1 Complete ✅

Basic project structure has been set up and is ready for testing.

## How to Load the Extension in Chrome

1. **Create Icon Files** (Required for testing):
   - Navigate to the `icons/` folder
   - Add three PNG files: `icon16.png`, `icon48.png`, and `icon128.png`
   - You can use any placeholder images with the correct dimensions for now
   - See `icons/README.md` for more details

2. **Open Chrome Extensions Page**:
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or click the three-dot menu → More tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**:
   - Click "Load unpacked" button
   - Navigate to this project folder: `h:\coding\webmastering\in progress\chrome\yt-watch-a-bit-later`
   - Click "Select Folder"

5. **Verify Installation**:
   - The extension should appear in your extensions list
   - You should see the extension icon in your toolbar
   - Check the console for any errors

## Testing Phase 1

After loading the extension:
- ✅ Extension should load without critical errors
- ✅ Clicking the extension icon should show the basic popup
- ✅ Opening YouTube should load the content script (check console)
- ⚠️ Note: Icons warnings are expected if placeholder icons aren't added yet

## Project Structure

```
my-extension/
├── manifest.json          # Extension configuration ✅
├── content.js            # Injects button into YouTube pages (placeholder) ✅
├── popup.html            # UI for viewing saved videos (basic) ✅
├── popup.js              # Logic for popup interface (placeholder) ✅
├── background.js         # Service worker for notifications & cleanup (placeholder) ✅
├── storage.js            # Helper functions for data management (placeholder) ✅
├── styles.css            # Styling for popup (basic) ✅
├── icons/                # Extension icons folder ✅
│   └── README.md         # Icon instructions ✅
├── README.md             # This file ✅
└── plan.md               # Development roadmap ✅
```

## Next Steps (Phase 2)

- Inject custom "Save" button next to YouTube's save button
- Capture video data (URL, title, thumbnail, timestamp)
- Store videos in chrome.storage.local
- Create functional popup to display saved videos

## Features (Planned)

- ⏰ Custom "Save" button on every YouTube video
- 📋 Separate watch later list stored locally
- 🗑️ Auto-deletion after customizable period (default: 1 week)
- 🔔 Optional notifications before video expires
- ⏳ Visual countdown for each saved video
- ⚙️ Customizable settings

## Development Phases

- [x] **Phase 1**: Basic Setup
- [ ] **Phase 2**: Core Functionality
- [ ] **Phase 3**: Deletion Logic
- [ ] **Phase 4**: Settings & Polish
- [ ] **Phase 5**: Notifications
