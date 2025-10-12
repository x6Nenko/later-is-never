// Popup logic - Displays saved videos and handles saving
console.log("Later is Never: Popup script loaded");

// Sort order state (true = newest first, false = oldest first)
let sortNewestFirst = true;

// Import storage functions by loading the script
const script = document.createElement("script");
script.src = "storage.js";
document.head.appendChild(script);

// Wait for storage.js to load before initializing
script.onload = () => {
  initializePopup();
};

async function initializePopup() {
  console.log("Initializing popup...");

  // Load sort preference from settings
  const settings = await getSettings();
  sortNewestFirst = settings.sortNewestFirst;

  // Settings button handler
  document.getElementById("settings-btn").addEventListener("click", () => {
    showSettingsView();
  });

  // Check if we're on a YouTube video page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isYouTubeVideo =
    tab.url && tab.url.match(/youtube\.com\/watch\?v=([^&]+)/);

  if (isYouTubeVideo) {
    // Show "Save Current Video" section
    await showSaveButton(tab);
  }

  // Always show saved videos list
  await displaySavedVideos();
}

async function showSaveButton(tab) {
  const container = document.getElementById("save-section");

  // Get video data from the current tab
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractVideoData,
    });

    console.log("Script execution results:", results);

    if (results && results[0] && results[0].result) {
      const videoData = results[0].result;
      console.log("Extracted video data:", videoData);

      // Check if already saved
      const alreadySaved = await isVideoSaved(videoData.videoId);

      container.innerHTML = `
        <div class="current-video">
          <h2>Current Video</h2>
          <div class="video-info">
            <img src="${videoData.thumbnail}" alt="Thumbnail">
            <div class="video-details">
              <p class="video-title">${videoData.title}</p>
              <p class="video-channel">${videoData.channelName}</p>
            </div>
          </div>
          <button id="save-btn" class="${alreadySaved ? "renew" : ""}">
            ${alreadySaved ? "↻ Renew Expiration" : "Save to Watch Later"}
          </button>
        </div>
      `;

      // Add click handler (works for both new saves and renewals)
      const saveBtn = document.getElementById("save-btn");
      saveBtn.addEventListener("click", async () => {
        const isRenew = alreadySaved;
        saveBtn.disabled = true;
        saveBtn.textContent = isRenew ? "Renewing..." : "Saving...";

        const success = await saveVideo(videoData);

        if (success) {
          saveBtn.textContent = isRenew ? "✓ Renewed!" : "✓ Saved!";
          saveBtn.classList.add("saved");

          // Refresh the video list
          setTimeout(async () => {
            await displaySavedVideos();
          }, 500);
        } else {
          saveBtn.textContent = "Error - Try Again";
          saveBtn.disabled = false;
        }
      });
    } else {
      console.warn("Failed to extract video data - result was null or invalid");
      container.innerHTML = `
        <div class="error">
          <p>Could not extract video data. Make sure the video page is fully loaded.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error showing save button:", error);
    container.innerHTML = `
      <div class="error">
        <p>Could not access video data. Please refresh the YouTube page.</p>
      </div>
    `;
  }
}

// This function runs in the context of the YouTube page
function extractVideoData() {
  try {
    // Extract video ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");

    // Get video title
    const titleElement = document.querySelector(
      "h1.ytd-watch-metadata yt-formatted-string"
    );
    const title = titleElement
      ? titleElement.textContent.trim()
      : "Unknown Title";

    // Get channel name
    const channelElement = document.querySelector("ytd-channel-name a");
    const channelName = channelElement
      ? channelElement.textContent.trim()
      : "Unknown Channel";

    // Get thumbnail (use high quality)
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    // Get video URL
    const url = window.location.href;

    return {
      videoId,
      title,
      channelName,
      thumbnail,
      url,
    };
  } catch (error) {
    console.error("Error extracting video data:", error);
    return null;
  }
}

async function displaySavedVideos() {
  const container = document.getElementById("video-list");

  // Clean up expired videos first
  await deleteExpiredVideos();

  // Get all saved videos
  let videos = await getSavedVideos();

  if (videos.length === 0) {
    container.innerHTML = '<p class="empty-state">No saved videos yet.</p>';
    return;
  }

  // Apply sort order
  if (!sortNewestFirst) {
    videos = videos.reverse();
  }

  // Create header with sort toggle
  container.innerHTML = `
    <div class="video-list-header">
      <h2>Saved Videos</h2>
      <button id="sort-toggle-btn" class="sort-toggle-btn" title="${sortNewestFirst ? 'Sort oldest first' : 'Sort newest first'}">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${sortNewestFirst
            ? '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M17 10V4h-2"/><path d="M15 10h4"/><rect x="15" y="14" width="4" height="6" ry="2"/>'
            : '<path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><rect x="15" y="4" width="4" height="6" ry="2"/><path d="M17 20v-6h-2"/><path d="M15 20h4"/>'
          }
        </svg>
      </button>
    </div>
  `;

  // Add sort toggle handler
  const sortToggleBtn = document.getElementById("sort-toggle-btn");
  sortToggleBtn.addEventListener("click", async () => {
    sortNewestFirst = !sortNewestFirst;

    // Save the sort preference to settings
    const settings = await getSettings();
    settings.sortNewestFirst = sortNewestFirst;
    await saveSettings(settings);

    displaySavedVideos();
  });

  // Append video elements
  videos.forEach((video) => {
    const videoElement = createVideoElement(video);
    container.appendChild(videoElement);
  });
}

function createVideoElement(video) {
  const div = document.createElement("div");
  div.className = "video-item";

  const timeRemaining = getTimeRemaining(video.expiresAt);
  const progressInfo = getExpirationProgress(video.savedAt, video.expiresAt);

  div.innerHTML = `
    <img src="${video.thumbnail}" alt="Thumbnail" class="video-thumbnail">
    <div class="video-content">
      <a href="${video.url}" target="_blank" class="video-title">${video.title}</a>
      <p class="video-channel">${video.channelName}</p>
      <div class="expiration-info">
        <p class="video-expires ${progressInfo.urgencyClass}">Expires ${timeRemaining}</p>
        <div class="progress-bar">
          <div class="progress-fill ${progressInfo.urgencyClass}" style="width: ${progressInfo.percentage}%"></div>
        </div>
      </div>
    </div>
    <button class="delete-btn" data-video-id="${video.videoId}" title="Delete">×</button>
  `;

  // Add delete button handler
  const deleteBtn = div.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const videoId = e.target.getAttribute("data-video-id");
    await deleteVideo(videoId);
    await displaySavedVideos();
  });

  return div;
}

function getTimeRemaining(expiresAt) {
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining < 0) return "expired";

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor(
    (remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );

  if (days > 0) {
    return `in ${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? "s" : ""}`;
  } else {
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `in ${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
}

function getExpirationProgress(savedAt, expiresAt) {
  const now = Date.now();
  const totalDuration = expiresAt - savedAt;
  const elapsed = now - savedAt;
  const remaining = expiresAt - now;

  // Calculate percentage of time remaining (100% = just saved, 0% = expired)
  let percentage = ((totalDuration - elapsed) / totalDuration) * 100;
  percentage = Math.max(0, Math.min(100, percentage)); // Clamp between 0-100

  // Determine urgency class based on remaining percentage
  let urgencyClass = "safe"; // Green - more than 50% time left
  if (percentage < 25) {
    urgencyClass = "critical"; // Red - less than 25% time left
  } else if (percentage < 50) {
    urgencyClass = "warning"; // Yellow - less than 50% time left
  }

  // If expired, override
  if (remaining < 0) {
    urgencyClass = "expired";
    percentage = 0;
  }

  return {
    percentage: percentage.toFixed(1),
    urgencyClass: urgencyClass,
  };
}

// Settings view functions
// Note: SETTINGS_KEY and DEFAULT_EXPIRATION are defined in storage.js

function showSettingsView() {
  document.getElementById("main-view").style.display = "none";
  document.getElementById("settings-view").style.display = "block";
  loadSettings();
  setupSettingsListeners();
}

function showMainView() {
  document.getElementById("settings-view").style.display = "none";
  document.getElementById("main-view").style.display = "block";
  displaySavedVideos(); // Refresh the list
}

async function loadSettings() {
  try {
    const settings = await getSettings();

    const expirationValue = settings.expirationPeriod;
    const radioButtons = document.querySelectorAll('input[name="expiration"]');

    radioButtons.forEach((radio) => {
      if (radio.value === expirationValue.toString()) {
        radio.checked = true;
        radio.closest(".radio-option").classList.add("selected");
      } else {
        radio.checked = false;
        radio.closest(".radio-option").classList.remove("selected");
      }
    });
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

function setupSettingsListeners() {
  // Back button
  const backBtn = document.getElementById("back-btn");
  if (backBtn && !backBtn.hasAttribute("data-listener")) {
    backBtn.setAttribute("data-listener", "true");
    backBtn.addEventListener("click", showMainView);
  }

  // Radio button selection
  const radioOptions = document.querySelectorAll(".radio-option");
  radioOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const radio = option.querySelector('input[type="radio"]');
      radio.checked = true;

      radioOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
    });
  });

  // Save button
  const saveBtn = document.getElementById("save-settings-btn");
  if (saveBtn && !saveBtn.hasAttribute("data-listener")) {
    saveBtn.setAttribute("data-listener", "true");
    saveBtn.addEventListener("click", saveSettingsView);
  }
}

async function saveSettingsView() {
  try {
    const selectedRadio = document.querySelector('input[name="expiration"]:checked');
    const expirationPeriod = parseInt(selectedRadio.value);

    // Get existing settings and update only the expiration period
    const settings = await getSettings();
    settings.expirationPeriod = expirationPeriod;

    await saveSettings(settings);

    // Show success message
    const saveStatus = document.getElementById("save-status");
    saveStatus.classList.add("show");

    setTimeout(() => {
      saveStatus.classList.remove("show");
    }, 1000);
  } catch (error) {
    console.error("Error saving settings:", error);
    alert("Failed to save settings. Please try again.");
  }
}
