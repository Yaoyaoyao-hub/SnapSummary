/**
 * API Key Manager
 * Supports default shared key with optional user-provided override
 */

import { CONFIG } from '../config/constants.js';

const STORAGE_KEY = 'user_youtube_api_key';

/**
 * Get the active YouTube API key
 * Priority: User's custom key > Default shared key
 * @returns {Promise<string>} API key to use
 */
export async function getYouTubeApiKey() {
  try {
    // Check if user has provided their own key
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const userKey = result[STORAGE_KEY];
    
    if (userKey && userKey.trim().length > 0) {
      // Using user-provided API key
      return userKey.trim();
    }
    
    // Fallback to default shared key
    // Using default shared API key
    return CONFIG.YOUTUBE_API_KEY;
  } catch (error) {
    // Error retrieving API key
    return CONFIG.YOUTUBE_API_KEY;
  }
}

/**
 * Set user's custom API key
 * @param {string} apiKey - User's YouTube API key
 * @returns {Promise<boolean>} Success status
 */
export async function setUserApiKey(apiKey) {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: apiKey });
    // User API key saved successfully
    return true;
  } catch (error) {
    // Error saving API key
    return false;
  }
}

/**
 * Clear user's custom API key (revert to default)
 * @returns {Promise<boolean>} Success status
 */
export async function clearUserApiKey() {
  try {
    await chrome.storage.sync.remove(STORAGE_KEY);
    // User API key cleared, using default
    return true;
  } catch (error) {
    // Error clearing API key
    return false;
  }
}

/**
 * Check if user has a custom API key set
 * @returns {Promise<boolean>}
 */
export async function hasCustomApiKey() {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    return !!(result[STORAGE_KEY] && result[STORAGE_KEY].trim().length > 0);
  } catch (error) {
    return false;
  }
}

/**
 * Validate API key format (basic check)
 * @param {string} apiKey - API key to validate
 * @returns {boolean}
 */
export function validateApiKeyFormat(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // YouTube API keys typically start with "AIza" and are 39 characters
  const trimmed = apiKey.trim();
  return trimmed.startsWith('AIza') && trimmed.length === 39;
}

