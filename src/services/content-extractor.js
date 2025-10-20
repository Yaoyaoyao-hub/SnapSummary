/**
 * Web Content Extraction Service
 */

import { getHostname } from '../utils/url.js';

/**
 * Extract content from current webpage
 * @param {number} tabId - Chrome tab ID
 * @returns {Promise<object>} Extracted content data
 */
export async function extractWebContent(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-extractor.js']
    });
    
    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    
    throw new Error('No content extracted');
    
  } catch (error) {
    console.error('Content extraction error:', error);
    throw new Error('Failed to extract webpage content. Please navigate to the page and use the auto-detect button.');
  }
}

/**
 * Extract content from URL (if it's the current tab)
 * @param {string} url - URL to extract content from
 * @returns {Promise<object>} Extracted content data
 */
export async function extractContentFromUrl(url) {
  try {
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    // Check if URL matches current tab
    if (tab && tab.url === url) {
      return await extractWebContent(tab.id);
    }
    
    // If not current tab, return placeholder
    return {
      type: 'webpage',
      url: url,
      title: 'Web Page',
      content: '',
      image: '',
      description: 'Please navigate to the page and use auto-detect to extract content.',
      author: '',
      wordCount: 0
    };
    
  } catch (error) {
    console.error('URL content extraction error:', error);
    throw error;
  }
}

/**
 * Auto-detect and extract content from current tab
 * @returns {Promise<object>} Detection result with type and data
 */
export async function autoDetectContent() {
  try {
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (!tab || !tab.url) {
      throw new Error('No active tab found');
    }
    
    const url = tab.url;
    
    // Check if YouTube
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      return {
        type: 'youtube',
        url: url,
        tabId: tab.id
      };
    }
    
    // Check if regular webpage (must be http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const content = await extractWebContent(tab.id);
      return {
        type: 'webpage',
        url: url,
        data: content,
        tabId: tab.id
      };
    }
    
    // Unsupported URL schemes
    let errorMessage = 'Cannot extract content from this page. ';
    
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      errorMessage += 'Chrome internal pages are not supported. Please open a YouTube video or article webpage.';
    } else if (url.startsWith('file://')) {
      errorMessage += 'Local files are not supported. Please open a webpage (http/https).';
    } else if (url.startsWith('about:')) {
      errorMessage += 'About pages are not supported. Please open a YouTube video or article webpage.';
    } else {
      errorMessage += `Unsupported URL type: ${url.split(':')[0]}://. Please use YouTube videos or regular webpages (http/https).`;
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('Auto-detect error:', error);
    throw error;
  }
}


