// Storage helper functions - Data management utilities
console.log("Later is Never: Storage helpers loaded");

const STORAGE_KEY = "savedVideos";
const SETTINGS_KEY = "userSettings";
const DEFAULT_EXPIRATION = 60000; // 1 minute for testing (60000ms)
// const DEFAULT_EXPIRATION = 604800000; // 1 week for production

// Get all saved videos
async function getSavedVideos() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    console.error("Error getting saved videos:", error);
    return [];
  }
}

// Get expiration period from settings
async function getExpirationPeriod() {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    const settings = result[SETTINGS_KEY] || { expirationPeriod: DEFAULT_EXPIRATION };
    return settings.expirationPeriod;
  } catch (error) {
    console.error("Error getting expiration period:", error);
    return DEFAULT_EXPIRATION;
  }
}

// Save a new video
async function saveVideo(videoData) {
  try {
    const videos = await getSavedVideos();
    const expirationPeriod = await getExpirationPeriod();

    // Check if video already exists (by videoId)
    const existingIndex = videos.findIndex(
      (v) => v.videoId === videoData.videoId
    );

    if (existingIndex !== -1) {
      // Update existing video's save time and expiration
      videos[existingIndex].savedAt = Date.now();
      videos[existingIndex].expiresAt = Date.now() + expirationPeriod;
      console.log("Video already saved, updated timestamp");
    } else {
      // Add new video with timestamp
      const videoToSave = {
        ...videoData,
        savedAt: Date.now(),
        expiresAt: Date.now() + expirationPeriod,
      };
      videos.unshift(videoToSave); // Add to beginning of array
      console.log("New video saved with expiration:", expirationPeriod, "ms");
    }

    await chrome.storage.local.set({ [STORAGE_KEY]: videos });
    return true;
  } catch (error) {
    console.error("Error saving video:", error);
    return false;
  }
}

// Delete a video by videoId
async function deleteVideo(videoId) {
  try {
    const videos = await getSavedVideos();
    const filteredVideos = videos.filter((v) => v.videoId !== videoId);
    await chrome.storage.local.set({ [STORAGE_KEY]: filteredVideos });
    console.log("Video deleted:", videoId);
    return true;
  } catch (error) {
    console.error("Error deleting video:", error);
    return false;
  }
}

// Delete expired videos
async function deleteExpiredVideos() {
  try {
    const videos = await getSavedVideos();
    const now = Date.now();
    const validVideos = videos.filter((v) => v.expiresAt > now);
    const expiredCount = videos.length - validVideos.length;

    if (expiredCount > 0) {
      await chrome.storage.local.set({ [STORAGE_KEY]: validVideos });
      console.log(`Deleted ${expiredCount} expired video(s)`);
    }

    return expiredCount;
  } catch (error) {
    console.error("Error deleting expired videos:", error);
    return 0;
  }
}

// Check if video is already saved
async function isVideoSaved(videoId) {
  try {
    const videos = await getSavedVideos();
    return videos.some((v) => v.videoId === videoId);
  } catch (error) {
    console.error("Error checking if video is saved:", error);
    return false;
  }
}
