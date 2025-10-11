# Later is Never

A Chrome extension that saves YouTube videos with automatic expiration. Videos are auto-deleted after a customizable period (default: 1 week).

## Current Status: Phase 2 Complete ✅

Core functionality is implemented! You can now save YouTube videos and view them in the popup.

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

## Testing Phase 2

See [PHASE2-TESTING.md](PHASE2-TESTING.md) for detailed testing instructions.

Quick test:
1. Go to any YouTube video
2. Click the extension icon
3. Click "Save to Watch Later"
4. Video appears in your saved list!

Features working:
- ✅ Save videos from YouTube
- ✅ View all saved videos
- ✅ Delete videos manually
- ✅ Expiration countdown display
- ✅ Clickable video links
- ✅ Duplicate detection

## Project Structure

```
my-extension/
├── manifest.json          # Extension configuration ✅
├── content.js            # Content script (minimal, not needed for popup approach) ✅
├── popup.html            # Popup UI ✅
├── popup.js              # Popup logic - saves & displays videos ✅
├── background.js         # Service worker (placeholder for Phase 5) ✅
├── storage.js            # Storage helper functions ✅
├── styles.css            # Popup styling ✅
├── icons/                # Extension icons folder ✅
│   └── README.md         # Icon instructions ✅
├── README.md             # This file ✅
├── PHASE2-TESTING.md     # Phase 2 testing guide ✅
└── plan.md               # Development roadmap ✅
```

## Next Steps (Phase 3)

- Implement background worker for automatic cleanup
- Add periodic checks for expired videos
- Improve expiration time calculations
- Add badge to show count of saved videos

## Features

✅ **Working Now:**
- 💾 Save videos by clicking extension icon on YouTube
- 📋 View all saved videos in popup
- 🗑️ Manual delete with × button
- ⏳ Expiration countdown (7 days default)
- 🔗 Clickable video links
- 🚫 Duplicate detection

🚧 **Coming Soon:**
- 🤖 Automatic cleanup of expired videos
- 🔔 Notifications before videos expire
- ⚙️ Customizable expiration period
- 📊 Video count badge

## Development Phases

- [x] **Phase 1**: Basic Setup
- [x] **Phase 2**: Core Functionality (Save & Display Videos)
- [ ] **Phase 3**: Automatic Deletion Logic
- [ ] **Phase 4**: Settings & Polish
- [ ] **Phase 5**: Notifications
