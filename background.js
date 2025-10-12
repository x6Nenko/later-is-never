// Background service worker
console.log("Later is Never: Background service worker loaded");

// Import storage functions
importScripts("storage.js");

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("Background received message:", request);

  if (request.action === "saveVideo") {
    // Save video using storage function
    saveVideo(request.videoData)
      .then((success) => {
        sendResponse({ success, alreadyExisted: request.alreadyExisted });
      })
      .catch((error) => {
        console.error("Error saving video:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === "checkVideoSaved") {
    // Check if video is already saved
    isVideoSaved(request.videoId)
      .then((isSaved) => {
        sendResponse({ isSaved });
      })
      .catch((error) => {
        console.error("Error checking video:", error);
        sendResponse({ isSaved: false });
      });
    return true; // Keep channel open for async response
  }
});
