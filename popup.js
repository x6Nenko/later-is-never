// Popup logic - Displays saved videos and handles saving
console.log("Later is Never: Popup script loaded");

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

    if (results && results[0] && results[0].result) {
      const videoData = results[0].result;

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
          <button id="save-btn" class="${alreadySaved ? "saved" : ""}">
            ${alreadySaved ? "✓ Already Saved" : "Save to Watch Later"}
          </button>
        </div>
      `;

      // Add click handler
      const saveBtn = document.getElementById("save-btn");
      if (!alreadySaved) {
        saveBtn.addEventListener("click", async () => {
          saveBtn.disabled = true;
          saveBtn.textContent = "Saving...";

          const success = await saveVideo(videoData);

          if (success) {
            saveBtn.textContent = "✓ Saved!";
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
      }
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
  const videos = await getSavedVideos();

  if (videos.length === 0) {
    container.innerHTML = '<p class="empty-state">No saved videos yet.</p>';
    return;
  }

  container.innerHTML = "<h2>Saved Videos</h2>";

  videos.forEach((video) => {
    const videoElement = createVideoElement(video);
    container.appendChild(videoElement);
  });
}

function createVideoElement(video) {
  const div = document.createElement("div");
  div.className = "video-item";

  const timeRemaining = getTimeRemaining(video.expiresAt);

  div.innerHTML = `
    <img src="${video.thumbnail}" alt="Thumbnail" class="video-thumbnail">
    <div class="video-content">
      <a href="${video.url}" target="_blank" class="video-title">${video.title}</a>
      <p class="video-channel">${video.channelName}</p>
      <p class="video-expires">Expires ${timeRemaining}</p>
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
