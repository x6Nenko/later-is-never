## Project Overview

"Later is Never" is a Chrome extension that saves YouTube videos with automatic expiration. Videos are auto-deleted after a customizable period (default: 1 week). The extension is complete through Phase 4, with core functionality, automatic cleanup, and settings all implemented.

## Development Commands

### Loading the Extension
1. Navigate to `chrome://extensions/` in Chrome
2. Enable "Developer mode" toggle (top-right)
3. Click "Load unpacked" and select this project folder
4. Extension icon appears in toolbar

### Testing
- Navigate to any YouTube video page (`youtube.com/watch?v=...`)
- Click the extension icon to open popup
- Use "Save to Watch Later" button to save current video
- Saved videos appear in the list below with expiration countdown
- Videos are automatically deleted when expired (checked on popup open)

### Reloading After Changes
- Go to `chrome://extensions/`
- Click the refresh icon on the "Later is Never" extension card
- Or use the keyboard shortcut: Ctrl+R (Cmd+R on Mac) while on the extensions page

## Architecture

### Core Data Flow

1. **Video Saving Flow**:
   - User opens popup on YouTube video page → [popup.js](popup.js) detects YouTube URL
   - [popup.js:40-44](popup.js#L40-L44) uses `chrome.scripting.executeScript` to inject `extractVideoData()` into page context
   - Injected function extracts video metadata (ID, title, channel, thumbnail) from YouTube DOM
   - [storage.js:32-65](storage.js#L32-L65) `saveVideo()` adds video to `chrome.storage.local` with `savedAt` and `expiresAt` timestamps
   - Expiration time calculated using user's setting from [storage.js:20-30](storage.js#L20-L30) `getExpirationPeriod()`

2. **Video Display Flow**:
   - [popup.js:152-172](popup.js#L152-L172) `displaySavedVideos()` called on popup open
   - First calls [storage.js:81-99](storage.js#L81-L99) `deleteExpiredVideos()` to clean up
   - Retrieves all videos from storage via [storage.js:10-18](storage.js#L10-L18) `getSavedVideos()`
   - Creates DOM elements with progress bars showing time until expiration
   - Progress bar color changes based on urgency: green (>50% time left), yellow (>25%), red (<25%)

3. **Settings Flow**:
   - Settings stored in `chrome.storage.local` under key `userSettings` with structure: `{ expirationPeriod: <milliseconds> }`
   - Default expiration is 60000ms (1 minute) for testing (see [storage.js:6](storage.js#L6))
   - Production default should be 604800000ms (1 week) - uncomment [storage.js:7](storage.js#L7) when ready
   - Settings view accessible via gear icon in popup header

### File Responsibilities

- **[manifest.json](manifest.json)**: Chrome extension configuration (Manifest V3)
  - Permissions: `storage`, `alarms`, `notifications`, `scripting`, `activeTab`
  - Host permissions: `*://*.youtube.com/*`
  - Popup UI: [popup.html](popup.html)
  - Background service worker: [background.js](background.js)
  - Content script: [content.js](content.js) (currently unused, kept for future features)

- **[popup.js](popup.js)**: Main UI logic
  - Detects YouTube video pages and shows "Save Current Video" button
  - Executes `extractVideoData()` in page context to scrape video metadata
  - Displays saved videos list with expiration countdowns and progress bars
  - Handles video deletion and settings view navigation
  - Key functions: `extractVideoData()`, `displaySavedVideos()`, `createVideoElement()`, `getExpirationProgress()`

- **[storage.js](storage.js)**: Data persistence layer
  - All Chrome storage operations go through this module
  - Storage keys: `savedVideos` (array of video objects), `userSettings` (expiration config)
  - Video object structure: `{ videoId, title, channelName, thumbnail, url, savedAt, expiresAt }`
  - Key functions: `getSavedVideos()`, `saveVideo()`, `deleteVideo()`, `deleteExpiredVideos()`, `getExpirationPeriod()`
  - **Important**: [storage.js:6](storage.js#L6) has 1-minute expiration for testing; change to 1 week for production

- **[popup.html](popup.html)**: Two-view UI structure
  - Main view: Video save section + saved videos list
  - Settings view: Expiration period selection (1 minute to 1 month)
  - Includes embedded settings view that toggles visibility

- **[styles.css](styles.css)**: Popup styling
  - Progress bars with color-coded urgency states
  - Video thumbnails and clickable titles
  - Settings view with radio button selection

- **[background.js](background.js)**: Service worker (currently minimal)
  - Required by manifest but doesn't implement any active logic
  - Cleanup happens synchronously when popup opens (not on schedule)
  - Could be extended for scheduled alarms or notifications in future

- **[content.js](content.js)**: Content script (currently unused)
  - Originally planned for injecting UI into YouTube pages
  - Kept as placeholder for potential future features
  - Current approach uses popup with `chrome.scripting.executeScript` instead

### Key Technical Decisions

1. **Script Loading Pattern**: [popup.js:4-12](popup.js#L4-L12) loads [storage.js](storage.js) dynamically because popup context doesn't support ES6 modules in Manifest V3. Uses `onload` callback to ensure storage functions are available before initialization.

2. **Expiration Check Timing**: Expired videos are deleted when popup opens ([popup.js:156](popup.js#L156)), not on a background schedule. This simplifies implementation and avoids background worker complexity. Chrome's service workers are ephemeral and would require alarms for scheduled cleanup.

3. **YouTube Data Extraction**: Uses `chrome.scripting.executeScript` with function injection ([popup.js:40-44](popup.js#L40-L44)) rather than content scripts. This allows on-demand data extraction only when user clicks extension icon.

4. **Settings Implementation**: Expiration period stored in milliseconds to support flexible duration options. Settings are loaded fresh each time popup opens to ensure consistency.

5. **Progress Bar Calculation**: [popup.js:229-257](popup.js#L229-L257) calculates percentage of time elapsed (not remaining) to fill progress bar from 100% down to 0%. Three urgency states with color coding: `safe` (green), `warning` (yellow), `critical` (red).

## Common Development Scenarios

### Adding a New Expiration Period Option
1. Add new `<label class="radio-option">` to [popup.html:39-74](popup.html#L39-L74)
2. Set `value` attribute to milliseconds (e.g., `value="7776000000"` for 90 days)
3. No JavaScript changes needed

### Changing Default Expiration
1. Update `DEFAULT_EXPIRATION` constant in [storage.js:6-7](storage.js#L6-L7)
2. For production, use 604800000ms (1 week)
3. For testing, use 60000ms (1 minute) or 3600000ms (1 hour)

### Modifying Video Metadata Extraction
1. Edit the `extractVideoData()` function in [popup.js:113-150](popup.js#L113-L150)
2. This function runs in YouTube page context, so it has access to page DOM
3. Common YouTube selectors:
   - Title: `h1.ytd-watch-metadata yt-formatted-string`
   - Channel: `ytd-channel-name a`
   - Video ID: `new URLSearchParams(window.location.search).get("v")`

### Implementing Background Alarms
1. Set up alarm in [background.js](background.js) using `chrome.alarms.create()`
2. Add alarm listener: `chrome.alarms.onAlarm.addListener(callback)`
3. Call `deleteExpiredVideos()` from [storage.js](storage.js) in the alarm callback
4. Remember to import/load [storage.js](storage.js) in background worker context

### Adding Badge Counter
1. Use `chrome.action.setBadgeText()` to display count
2. Update badge when videos are saved/deleted/expired
3. Place logic in [popup.js](popup.js) after storage operations
4. Can also implement in [background.js](background.js) if using alarms
