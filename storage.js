// Storage helper functions - Data management utilities
console.log("Later is Never: Storage helpers loaded");

const STORAGE_KEY = "savedVideos";

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

// Save a new video
async function saveVideo(videoData) {
  try {
    const videos = await getSavedVideos();

    // Check if video already exists (by videoId)
    const existingIndex = videos.findIndex(
      (v) => v.videoId === videoData.videoId
    );

    if (existingIndex !== -1) {
      // Update existing video's save time
      videos[existingIndex].savedAt = Date.now();
      console.log("Video already saved, updated timestamp");
    } else {
      // Add new video with timestamp
      const videoToSave = {
        ...videoData,
        savedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      };
      videos.unshift(videoToSave); // Add to beginning of array
      console.log("New video saved");
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
