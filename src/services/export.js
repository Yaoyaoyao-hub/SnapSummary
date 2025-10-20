/**
 * Export Service - Handle card downloads and sharing
 */

import { toPng } from 'html-to-image';
import { downloadFile, copyToClipboard } from '../utils/dom.js';
import { generateFilename } from '../utils/validation.js';
import { prepareCardForDownload } from '../utils/card.js';
import { prepareImagesForExport } from '../utils/image.js';

/**
 * Export card as PNG image
 * @param {HTMLElement} cardElement - Card element to export
 * @param {string} title - Card title (for filename)
 * @returns {Promise<boolean>} Success status
 */
export async function exportCardAsPng(cardElement, title = 'summary') {
  try {
    if (!cardElement) {
      throw new Error('Card element not found');
    }
    
    // Prepare card (hide empty sections)
    const cleanupCard = prepareCardForDownload(cardElement);
    
    // Convert images to data URLs to avoid CORS issues
    const cleanupImages = await prepareImagesForExport(cardElement);
    
    try {
      // Export card with data URL images
      const dataUrl = await attemptExport(cardElement);
      
      // Download
      const filename = generateFilename('snapsummary-card', 'png');
      downloadFile(dataUrl, filename);
      
      return true;
    } finally {
      // Restore everything
      cleanupCard();
      cleanupImages();
    }
  } catch (error) {
    console.error('PNG export failed:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Provide more specific error message
    if (error.message?.includes('CORS') || error.message?.includes('tainted')) {
      throw new Error('Image loading error. The thumbnail may not be accessible. Try again or use a different source.');
    }
    
    throw new Error('Failed to generate image. Please try again.');
  }
}

/**
 * Attempt to export card as PNG
 * @param {HTMLElement} cardElement - Card element
 * @returns {Promise<string>} Data URL
 */
async function attemptExport(cardElement) {
  return await toPng(cardElement, {
    quality: 1.0,
    pixelRatio: 2,
    cacheBust: true,
    skipAutoScale: true,
    backgroundColor: '#ffffff',
    filter: (node) => {
      // Skip hidden elements
      if (node.style && node.style.display === 'none') return false;
      if (node.hasAttribute && node.hasAttribute('hidden')) return false;
      return true;
    }
  });
}

/**
 * Copy summary text to clipboard
 * @param {HTMLElement} summaryElement - Summary element
 * @returns {Promise<boolean>} Success status
 */
export async function copySummaryText(summaryElement) {
  try {
    if (!summaryElement) {
      throw new Error('Summary element not found');
    }
    
    const text = summaryElement.innerText || summaryElement.textContent;
    return await copyToClipboard(text);
  } catch (error) {
    console.error('Copy text failed:', error);
    return false;
  }
}

/**
 * Copy URL to clipboard
 * @param {string} url - URL to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyUrl(url) {
  try {
    return await copyToClipboard(url);
  } catch (error) {
    console.error('Copy URL failed:', error);
    return false;
  }
}

/**
 * Share to Twitter
 * @param {string} title - Content title
 * @param {string} url - Content URL
 */
export function shareToTwitter(title, url) {
  const text = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
  window.open(shareUrl, '_blank', 'width=550,height=420');
}

/**
 * Share to LinkedIn
 * @param {string} url - Content URL
 */
export function shareToLinkedIn(url) {
  const encodedUrl = encodeURIComponent(url);
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  window.open(shareUrl, '_blank', 'width=550,height=420');
}

/**
 * Share to Reddit
 * @param {string} title - Content title
 * @param {string} url - Content URL
 */
export function shareToReddit(title, url) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
  window.open(shareUrl, '_blank', 'width=800,height=600');
}

/**
 * Share via Email
 * @param {string} title - Content title
 * @param {string} summary - Content summary
 * @param {string} url - Content URL
 */
export function shareViaEmail(title, summary, url) {
  const subject = encodeURIComponent(`Check out: ${title}`);
  const body = encodeURIComponent(`${summary}\n\nWatch/Read here: ${url}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Get social share handler
 * @param {string} platform - Platform name ('twitter', 'linkedin', 'reddit', 'email')
 * @param {object} data - Share data (title, summary, url)
 * @returns {Function} Share handler
 */
export function getSocialShareHandler(platform, data) {
  const handlers = {
    twitter: () => shareToTwitter(data.title, data.url),
    linkedin: () => shareToLinkedIn(data.url),
    reddit: () => shareToReddit(data.title, data.url),
    email: () => shareViaEmail(data.title, data.summary, data.url)
  };
  
  return handlers[platform] || (() => {
    console.warn(`Unknown platform: ${platform}`);
  });
}


