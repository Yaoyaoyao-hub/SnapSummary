/**
 * URL Utility Functions
 */

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
export function extractVideoId(url) {
  if (!url) return null;
  
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];
  
  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];
  
  return null;
}

/**
 * Check if URL is a YouTube video
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
  if (!url) return false;
  return url.includes('youtube.com/watch') || 
         url.includes('youtu.be/') || 
         url.includes('youtube.com/embed/');
}

/**
 * Check if URL is a valid HTTP(S) URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isValidHttpUrl(url) {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Get hostname from URL
 * @param {string} url - URL
 * @returns {string} Hostname or empty string
 */
export function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Build YouTube video URL from video ID
 * @param {string} videoId - YouTube video ID
 * @returns {string} Full YouTube URL
 */
export function buildYouTubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}


