// Content script - Adds save button to YouTube videos
console.log("Later is Never: Content script loaded v2");

// Track processed videos to avoid duplicate buttons
const processedVideos = new WeakSet();

// Lucide clock-plus icon SVG
const CLOCK_PLUS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v6l3.644 1.822"/><path d="M16 19h6"/><path d="M19 16v6"/><path d="M21.92 13.267a10 10 0 1 0-8.653 8.653"/></svg>`;

// Checkmark icon for success
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

// X icon for error
const X_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

// Loading spinner icon
const LOADER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`;

// Initialize when DOM is ready
function init() {
  console.log("Later is Never: Initializing...");

  // Add buttons to existing videos
  addButtonsToVideos();

  // Watch for new videos being added (YouTube is a SPA)
  const observer = new MutationObserver(() => {
    addButtonsToVideos();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log("Later is Never: Observer started");
}

// Add save buttons to all video thumbnails
function addButtonsToVideos() {
  // Find all video renderers on the page
  const videoRenderers = document.querySelectorAll(
    'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer'
  );

  videoRenderers.forEach(renderer => {
    if (processedVideos.has(renderer)) {
      return;
    }

    // Extract video data
    const videoData = extractVideoData(renderer);
    if (!videoData) {
      return;
    }

    // Mark as processed
    processedVideos.add(renderer);

    // Add our button
    addSaveButton(renderer, videoData);
  });
}

// Extract video data from renderer element
function extractVideoData(renderer) {
  try {
    // Find the video link - prioritize the title link
    const titleLinkElement = renderer.querySelector('a.yt-lockup-metadata-view-model__title, a#video-title, h3 a');
    const anyLinkElement = renderer.querySelector('a[href*="/watch?v="]');
    const linkElement = titleLinkElement || anyLinkElement;

    if (!linkElement || !linkElement.href) {
      return null;
    }

    const url = new URL(linkElement.href);
    const videoId = url.searchParams.get('v');

    if (!videoId) {
      return null;
    }

    // Get title - try multiple methods
    let title = "Unknown Title";

    // Method 1: Text content from title link
    if (titleLinkElement) {
      const titleText = titleLinkElement.textContent?.trim();
      if (titleText && titleText.length > 0 && !titleText.match(/^\d+:\d+$/)) {
        title = titleText;
      }
    }

    // Method 2: aria-label attribute (contains full title)
    if (title === "Unknown Title" && titleLinkElement) {
      const ariaLabel = titleLinkElement.getAttribute('aria-label');
      if (ariaLabel) {
        // aria-label format: "Title 10 minutes 30 seconds"
        // Remove the duration part
        title = ariaLabel.replace(/\d+\s+(second|minute|hour|day|week|month|year)s?\s*\d*\s*(second|minute|hour|day|week|month|year)?s?.*$/i, '').trim();
      }
    }

    // Method 3: title attribute
    if (title === "Unknown Title") {
      const titleAttr = linkElement.getAttribute('title');
      if (titleAttr && titleAttr.length > 0) {
        title = titleAttr;
      }
    }

    // Get channel - try multiple selectors
    const channelElement = renderer.querySelector(
      'yt-content-metadata-view-model a, ' +
      'ytd-channel-name a, ' +
      '#channel-name a, ' +
      'a.yt-simple-endpoint.style-scope.yt-formatted-string'
    );
    const channelName = channelElement ? channelElement.textContent.trim() : "Unknown Channel";

    // Get thumbnail
    const thumbnailElement = renderer.querySelector('img');
    const thumbnail = thumbnailElement?.src || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoId,
      title: title.replace(/\s+/g, ' ').trim(),
      channelName,
      thumbnail,
      url: linkElement.href
    };
  } catch (error) {
    console.error("Later is Never: Error extracting video data:", error);
    return null;
  }
}

// Add save button to video renderer
async function addSaveButton(renderer, videoData) {
  // Check if already saved
  const isSaved = await checkIfVideoSaved(videoData.videoId);

  // Find where to insert the button (next to the menu button)
  const menuButton = renderer.querySelector('button[aria-label="Ещё"], button[aria-label="More actions"], button-view-model button');
  if (!menuButton) {
    console.log("Later is Never: Menu button not found");
    return;
  }

  const menuContainer = menuButton.closest('.yt-lockup-metadata-view-model__menu-button, #menu');
  if (!menuContainer) {
    console.log("Later is Never: Menu container not found");
    return;
  }

  // Create our save button
  const saveButton = document.createElement('button');
  saveButton.className = 'later-is-never-save-btn';
  saveButton.title = isSaved ? 'Renew Expiration' : 'Save to Watch Later';
  saveButton.innerHTML = CLOCK_PLUS_ICON;

  // Style the button to match YouTube's style
  saveButton.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    font-size: 20px;
    color: var(--yt-spec-text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    transition: background 0.2s;
  `;

  // Add hover effect
  saveButton.addEventListener('mouseenter', () => {
    saveButton.style.background = 'var(--yt-spec-badge-chip-background)';
  });
  saveButton.addEventListener('mouseleave', () => {
    saveButton.style.background = 'none';
  });

  // Add click handler
  saveButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Later is Never: Save button clicked for:", videoData.videoId);

    // Show loading state
    saveButton.innerHTML = LOADER_ICON;
    saveButton.querySelector('svg').style.animation = 'spin 1s linear infinite';
    saveButton.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveVideo",
        videoData: videoData,
        alreadyExisted: isSaved
      });

      if (response.success) {
        saveButton.innerHTML = CHECK_ICON;
        showNotification(isSaved ? 'Video expiration renewed!' : 'Video saved!');

        // Reset after 2 seconds
        setTimeout(() => {
          saveButton.innerHTML = CLOCK_PLUS_ICON;
          saveButton.disabled = false;
          saveButton.title = 'Renew Expiration';
        }, 2000);
      } else {
        saveButton.innerHTML = X_ICON;
        showNotification('Error saving video');
        setTimeout(() => {
          saveButton.innerHTML = CLOCK_PLUS_ICON;
          saveButton.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error("Later is Never: Error:", error);
      saveButton.innerHTML = X_ICON;
      showNotification('Error saving video');
      setTimeout(() => {
        saveButton.innerHTML = CLOCK_PLUS_ICON;
        saveButton.disabled = false;
      }, 2000);
    }
  });

  // Insert the button before the menu button
  menuContainer.insertBefore(saveButton, menuContainer.firstChild);

  console.log("Later is Never: Button added for video:", videoData.videoId);
}

// Check if video is already saved
async function checkIfVideoSaved(videoId) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "checkVideoSaved",
      videoId: videoId
    });
    return response.isSaved || false;
  } catch (error) {
    console.error("Later is Never: Error checking if video saved:", error);
    return false;
  }
}

// Show a temporary notification
function showNotification(message) {
  // Remove any existing notification
  const existing = document.querySelector('.later-is-never-notification');
  if (existing) {
    existing.remove();
  }

  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'later-is-never-notification';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: fadeInOut 2s ease-in-out;
  `;

  // Add animations
  if (!document.querySelector('#later-is-never-styles')) {
    const style = document.createElement('style');
    style.id = 'later-is-never-styles';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Remove after animation
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already ready
  init();
}
