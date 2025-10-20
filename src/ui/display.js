/**
 * UI Display Functions - Card and Content Display
 */

import { show, hide, setText, setHTML, setValue } from '../utils/dom.js';
import { countCharacters, countWords, formatNumber, getCurrentTimestamp } from '../utils/validation.js';
import { getHostname } from '../utils/url.js';

// DOM elements (will be initialized)
let cardContainer,
    cardThumbnail,
    cardTitle,
    cardSummary,
    cardVideoLink,
    cardLinkIcon,
    cardLinkText,
    cardTimestamp,
    contentSelection,
    previewThumbnail,
    previewTitle,
    previewChannel,
    descriptionText,
    contentLabel,
    contentStats,
    contentCharCount,
    contentWordCount,
    translationOptions,
    translationInfo,
    translationLanguage;

/**
 * Initialize display UI elements
 * @param {object} elements - Display elements
 */
export function initDisplayElements(elements) {
  cardContainer = elements.cardContainer;
  cardThumbnail = elements.cardThumbnail;
  cardTitle = elements.cardTitle;
  cardSummary = elements.cardSummary;
  cardVideoLink = elements.cardVideoLink;
  cardLinkIcon = elements.cardLinkIcon;
  cardLinkText = elements.cardLinkText;
  cardTimestamp = elements.cardTimestamp;
  contentSelection = elements.contentSelection;
  previewThumbnail = elements.previewThumbnail;
  previewTitle = elements.previewTitle;
  previewChannel = elements.previewChannel;
  descriptionText = elements.descriptionText;
  contentLabel = elements.contentLabel;
  contentStats = elements.contentStats;
  contentCharCount = elements.contentCharCount;
  contentWordCount = elements.contentWordCount;
  translationOptions = elements.translationOptions;
  translationInfo = elements.translationInfo;
  translationLanguage = elements.translationLanguage;
}

/**
 * Display content selection interface
 * @param {object} data - Video or webpage data
 * @param {string} type - Content type ('youtube' or 'webpage')
 */
export function displayContentSelection(data, type) {
  let contentText = '';
  let thumbnailUrl = '';
  let titleText = '';
  let channelText = '';
  let labelText = '';
  
  if (type === 'youtube') {
    const snippet = data?.snippet || {};
    const thumbnails = snippet.thumbnails || {};
    
    thumbnailUrl = thumbnails.medium?.url || thumbnails.default?.url || '';
    titleText = snippet.title || 'YouTube Video';
    channelText = snippet.channelTitle || '';
    contentText = snippet.description || 'No description available';
    labelText = 'Video Description:';
    
  } else if (type === 'webpage') {
    thumbnailUrl = data.image || '../images/icon128.png';
    titleText = data.title || 'Web Page';
    channelText = data.author || getHostname(data.url);
    contentText = data.content || data.description || 'No content extracted';
    labelText = 'Page Content:';
  }
  
  // Update preview
  if (previewThumbnail) previewThumbnail.src = thumbnailUrl;
  if (previewTitle) setText(previewTitle, titleText);
  if (previewChannel) setText(previewChannel, channelText);
  if (descriptionText) setValue(descriptionText, contentText);
  if (contentLabel) setText(contentLabel, labelText);
  
  // Update stats
  updateContentStats(contentText);
  
  // Show selection interface
  if (contentSelection) show(contentSelection);
}

/**
 * Update content statistics display
 * @param {string} content - Content text
 */
export function updateContentStats(content) {
  const charCount = countCharacters(content);
  const wordCount = countWords(content);
  
  if (contentCharCount) setText(contentCharCount, formatNumber(charCount));
  if (contentWordCount) setText(contentWordCount, formatNumber(wordCount));
  
  if (contentStats) {
    if (charCount > 0) {
      show(contentStats);
    } else {
      hide(contentStats);
    }
  }
}

/**
 * Display summary card
 * @param {object} data - Video or webpage data
 * @param {object} summary - Summary data { html, markdown }
 * @param {string} contentType - Content type ('youtube' or 'webpage')
 */
export function displayCard(data, summary, contentType) {
  let thumbnailUrl, title, linkUrl;
  
  if (contentType === 'youtube') {
    const snippet = data?.snippet || {};
    const id = data?.id || '';
    const thumbnails = snippet.thumbnails || {};
    
    thumbnailUrl = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';
    title = snippet.title || 'YouTube Video';
    linkUrl = `https://www.youtube.com/watch?v=${id}`;
    
  } else {
    thumbnailUrl = data?.image || '../images/icon128.png';
    title = data?.title || 'Web Page';
    linkUrl = data?.url || '#';
  }
  
  // Update card elements
  if (cardThumbnail) cardThumbnail.src = thumbnailUrl;
  if (cardTitle) setText(cardTitle, title);
  if (cardSummary) setHTML(cardSummary, summary.html);
  if (cardVideoLink) {
    cardVideoLink.href = linkUrl;
    cardVideoLink.target = '_blank';
  }
  
  // Link text is always "Read Original Content" regardless of type
  if (cardLinkText) {
    setText(cardLinkText, 'Read Original Content');
  }
  
  // Set timestamp
  if (cardTimestamp) {
    setText(cardTimestamp, getCurrentTimestamp());
  }
  
  // Show card
  if (cardContainer) show(cardContainer);
}

/**
 * Hide content selection interface
 */
export function hideContentSelection() {
  if (contentSelection) hide(contentSelection);
}

/**
 * Hide card
 */
export function hideCard() {
  if (cardContainer) hide(cardContainer);
}


/**
 * Update card summary content (for translation)
 * @param {string} htmlContent - HTML content
 */
export function updateCardSummary(htmlContent) {
  if (cardSummary) setHTML(cardSummary, htmlContent);
}

/**
 * Get card element for export
 * @returns {HTMLElement} Card element
 */
export function getCardElement() {
  // Try both .summary-card and .share-card (HTML uses .share-card)
  return cardContainer?.querySelector('.summary-card') || 
         cardContainer?.querySelector('.share-card') || 
         cardContainer?.querySelector('#share-card') ||
         null;
}

/**
 * Get card summary element
 * @returns {HTMLElement} Summary element
 */
export function getSummaryElement() {
  return cardSummary || null;
}


