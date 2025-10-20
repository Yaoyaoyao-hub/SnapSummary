/**
 * YouTube Data API Integration
 * Supports both shared default key and user-provided custom keys
 */

import { CONFIG } from '../config/constants.js';
import { extractVideoId } from '../utils/url.js';
import { getYouTubeApiKey } from '../utils/api-key-manager.js';

/**
 * Fetch video data from YouTube Data API
 * Uses either user's custom key or default shared key
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<object>} Video data
 */
export async function fetchVideoData(videoId) {
  // Get the appropriate API key (user's custom or default)
  const apiKey = await getYouTubeApiKey();
  
  const url = `${CONFIG.YOUTUBE_API_BASE}/videos?` +
    `part=snippet,contentDetails&` +
    `id=${videoId}&` +
    `key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    // Check if it's a quota error
    if (data.error.code === 403 && data.error.message.includes('quota')) {
      throw new Error(
        'Daily quota exceeded. You can provide your own YouTube API key in Settings to continue using the extension.'
      );
    }
    throw new Error(data.error.message || 'Failed to fetch video data');
  }
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }
  
  return data.items[0];
}

/**
 * Fetch video data from URL
 * @param {string} url - YouTube URL
 * @returns {Promise<object>} Video data
 */
export async function fetchVideoFromUrl(url) {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  
  return fetchVideoData(videoId);
}

/**
 * Extract captions/transcript from YouTube page
 * @param {number} tabId - Chrome tab ID
 * @returns {Promise<string|null>} Captions text or null
 */
export async function extractCaptions(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractCaptionsFromPage
    });
    
    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to extract captions:', error);
    return null;
  }
}

/**
 * Function injected into YouTube page to extract captions
 * This function runs in the context of the YouTube page
 */
function extractCaptionsFromPage() {
  try {
    // Access YouTube's player response data
    const ytInitialPlayerResponse = window.ytInitialPlayerResponse;
    
    if (!ytInitialPlayerResponse || !ytInitialPlayerResponse.captions) {
      return null;
    }
    
    const captionTracks = ytInitialPlayerResponse.captions
      .playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      return null;
    }
    
    // Prefer English captions, fallback to first available
    const englishTrack = captionTracks.find(track => 
      track.languageCode === 'en' || track.languageCode.startsWith('en')
    );
    
    const selectedTrack = englishTrack || captionTracks[0];
    
    if (!selectedTrack || !selectedTrack.baseUrl) {
      return null;
    }
    
    // Note: Due to CORS, we can't fetch the captions directly from content script
    // This would need to be handled by the service worker or return the URL
    return selectedTrack.baseUrl;
    
  } catch (error) {
    console.error('Caption extraction error:', error);
    return null;
  }
}

/**
 * Get thumbnail URL from video data
 * @param {object} videoData - Video data from API
 * @returns {string} Thumbnail URL
 */
export function getThumbnailUrl(videoData) {
  const thumbnails = videoData?.snippet?.thumbnails || {};
  return thumbnails.maxres?.url || 
         thumbnails.high?.url || 
         thumbnails.medium?.url || 
         thumbnails.default?.url || 
         '';
}

/**
 * Get video title from video data
 * @param {object} videoData - Video data from API
 * @returns {string} Video title
 */
export function getVideoTitle(videoData) {
  return videoData?.snippet?.title || 'YouTube Video';
}

/**
 * Get video description from video data
 * @param {object} videoData - Video data from API
 * @returns {string} Video description
 */
export function getVideoDescription(videoData) {
  return videoData?.snippet?.description || '';
}

/**
 * Get channel name from video data
 * @param {object} videoData - Video data from API
 * @returns {string} Channel name
 */
export function getChannelName(videoData) {
  return videoData?.snippet?.channelTitle || '';
}


