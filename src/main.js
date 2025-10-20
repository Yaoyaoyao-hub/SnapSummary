/**
 * YTShare - Main Application Entry Point
 * Modular architecture with clean separation of concerns
 */

// Config & Constants
import { CONFIG, STATUS_MESSAGES, ERROR_MESSAGES } from './config/constants.js';

// Utils
import { extractVideoId, isYouTubeUrl, buildYouTubeUrl } from './utils/url.js';
import { saveString, loadString } from './utils/storage.js';
import { show, hide, hideAll, enableButton, disableButton, setText, setValue, setHTML } from './utils/dom.js';
import { isEmpty } from './utils/validation.js';
import { saveSummaryCard, getSavedCards, deleteSavedCard, clearAllSavedCards } from './utils/chrome-storage.js';

// API
import { 
  fetchVideoFromUrl, 
  getThumbnailUrl, 
  getVideoTitle, 
  getVideoDescription, 
  getChannelName 
} from './api/youtube.js';
import { getModelDefaults, resetSession as resetAISession } from './api/ai.js';

// Services
import { autoDetectContent, extractContentFromUrl } from './services/content-extractor.js';
import { generateSummary, prepareContent, formatSummaryForDisplay } from './services/summary.js';
import { exportCardAsPng, copySummaryText, copyUrl, getSocialShareHandler } from './services/export.js';
import { translate, getLanguageName } from './services/translation.js';

// UI
import { 
  initStatusElements, 
  showStatus, 
  hideStatus, 
  showLoading, 
  hideLoading, 
  showError, 
  hideError,
  hideAll as hideAllStatus
} from './ui/status.js';
import {
  initDisplayElements,
  displayContentSelection,
  displayCard,
  hideContentSelection,
  hideCard,
  updateCardSummary,
  getCardElement,
  getSummaryElement
} from './ui/display.js';

// ==================== STATE ====================

const state = {
  currentVideoData: null,
  currentContentType: null, // 'youtube' or 'webpage'
  originalSummary: null,
  originalTitle: null,
  isTranslated: false
};

// ==================== DOM ELEMENTS ====================

const elements = {
  // Inputs
  youtubeUrlInput: document.getElementById('youtube-url'),
  customPromptInput: document.getElementById('custom-prompt'),
  summaryType: document.getElementById('summary-type'),
  summaryLength: document.getElementById('summary-length'),
  targetLanguage: document.getElementById('target-language'),
  
  // Buttons
  buttonAutoDetect: document.getElementById('button-auto-detect'),
  buttonFetch: document.getElementById('button-fetch'),
  buttonReset: document.getElementById('button-reset'),
  buttonProceed: document.getElementById('button-proceed'),
  buttonCancelSelection: document.getElementById('button-cancel-selection'),
  buttonSaveCard: document.getElementById('button-save-card'),
  buttonDownload: document.getElementById('button-download'),
  buttonTranslate: document.getElementById('button-translate'),
  buttonShareCard: document.getElementById('button-share-card'),
  buttonRestoreOriginal: document.getElementById('button-restore-original'),
  buttonClearHistory: document.getElementById('button-clear-history'),
  
  // Social share
  shareTwitter: document.getElementById('share-twitter'),
  shareLinkedin: document.getElementById('share-linkedin'),
  shareReddit: document.getElementById('share-reddit'),
  shareEmail: document.getElementById('share-email'),
  
  // Status & Display
  statusElement: document.getElementById('status'),
  loadingElement: document.getElementById('loading'),
  errorElement: document.getElementById('error'),
  
  // Content Selection
  contentSelection: document.getElementById('content-selection'),
  previewThumbnail: document.getElementById('preview-thumbnail'),
  previewTitle: document.getElementById('preview-title'),
  previewChannel: document.getElementById('preview-channel'),
  descriptionText: document.getElementById('description-text'),
  contentLabel: document.getElementById('content-label'),
  contentStats: document.getElementById('content-stats'),
  contentCharCount: document.getElementById('content-char-count'),
  contentWordCount: document.getElementById('content-word-count'),
  
  // Card
  cardContainer: document.getElementById('card-container'),
  cardThumbnail: document.getElementById('card-thumbnail'),
  cardTitle: document.getElementById('card-title'),
  cardSummary: document.getElementById('card-summary'),
  cardVideoLink: document.getElementById('card-video-link'),
  cardTimestamp: document.getElementById('card-timestamp'),
  
  // Translation
  translationOptions: document.getElementById('translation-options'),
  translationInfo: document.getElementById('translation-info'),
  translationLanguage: document.getElementById('translation-language'),
  buttonConfirmTranslate: document.getElementById('button-confirm-translate'),
  buttonCancelTranslate: document.getElementById('button-cancel-translate'),
  
  // Social Share
  socialShareOptions: document.getElementById('social-share-options'),
  
  // Tabs
  tabNew: document.getElementById('tab-new'),
  tabHistory: document.getElementById('tab-history'),
  newSummaryContent: document.getElementById('new-summary-content'),
  historyContent: document.getElementById('history-content'),
  historyList: document.getElementById('history-list'),
  
  // AI Settings
  sliderTemperature: document.getElementById('temperature'),
  sliderTopK: document.getElementById('top-k'),
  labelTemperature: document.getElementById('label-temperature'),
  labelTopK: document.getElementById('label-top-k')
};

// ==================== INITIALIZATION ====================

/**
 * Initialize application
 */
async function init() {
  // Initialize UI modules
  initStatusElements({
    status: elements.statusElement,
    loading: elements.loadingElement,
    error: elements.errorElement
  });
  
  initDisplayElements({
    cardContainer: elements.cardContainer,
    cardThumbnail: elements.cardThumbnail,
    cardTitle: elements.cardTitle,
    cardSummary: elements.cardSummary,
    cardVideoLink: elements.cardVideoLink,
    cardLinkIcon: document.getElementById('card-link-icon'),
    cardLinkText: document.getElementById('card-link-text'),
    cardTimestamp: elements.cardTimestamp,
    contentSelection: elements.contentSelection,
    previewThumbnail: elements.previewThumbnail,
    previewTitle: elements.previewTitle,
    previewChannel: elements.previewChannel,
    descriptionText: elements.descriptionText,
    contentLabel: elements.contentLabel,
    contentStats: elements.contentStats,
    contentCharCount: elements.contentCharCount,
    contentWordCount: elements.contentWordCount,
    translationOptions: elements.translationOptions,
    translationInfo: elements.translationInfo,
    translationLanguage: elements.translationLanguage
  });
  
  // Load saved data
  loadSavedData();
  
  // Initialize AI settings
  await initAISettings();
  
  // Setup event listeners
  setupEventListeners();
}

/**
 * Load saved data from localStorage
 */
function loadSavedData() {
  const savedPrompt = loadString(CONFIG.STORAGE_KEYS.CUSTOM_PROMPT);
  if (savedPrompt) {
    setValue(elements.customPromptInput, savedPrompt);
  }
  
  validateInputs();
}

/**
 * Initialize AI settings
 */
async function initAISettings() {
  try {
    const defaults = await getModelDefaults();
    
    elements.sliderTemperature.value = defaults.defaultTemperature || CONFIG.DEFAULT_TEMPERATURE;
    setText(elements.labelTemperature, elements.sliderTemperature.value);
    
    const topKValue = defaults.defaultTopK > 3 ? 3 : defaults.defaultTopK;
    elements.sliderTopK.value = topKValue || CONFIG.DEFAULT_TOP_K;
    setText(elements.labelTopK, elements.sliderTopK.value);
    
    if (defaults.maxTopK) {
      elements.sliderTopK.max = defaults.maxTopK;
    }
  } catch (error) {
    console.error('Error initializing AI settings:', error);
    showError(ERROR_MESSAGES.PROMPT_API_UNAVAILABLE);
  }
}

// ==================== EVENT HANDLERS ====================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Input validation
  elements.youtubeUrlInput.addEventListener('input', validateInputs);
  
  // Save custom prompt
  elements.customPromptInput.addEventListener('input', () => {
    saveString(CONFIG.STORAGE_KEYS.CUSTOM_PROMPT, elements.customPromptInput.value);
  });
  
  // AI settings
  elements.sliderTemperature.addEventListener('input', (e) => {
    setText(elements.labelTemperature, e.target.value);
    resetState();
  });
  
  elements.sliderTopK.addEventListener('input', (e) => {
    setText(elements.labelTopK, e.target.value);
    resetState();
  });
  
  // Description textarea paste handler
  elements.descriptionText.addEventListener('paste', handlePaste);
  
  // Main action buttons
  elements.buttonAutoDetect.addEventListener('click', handleAutoDetect);
  elements.buttonFetch.addEventListener('click', handleFetch);
  elements.buttonProceed.addEventListener('click', handleGenerateSummary);
  elements.buttonCancelSelection.addEventListener('click', handleCancelSelection);
  elements.buttonReset.addEventListener('click', handleReset);
  
  // Tabs
  elements.tabNew?.addEventListener('click', () => switchTab('new'));
  elements.tabHistory?.addEventListener('click', () => switchTab('history'));
  
  // Card actions
  elements.buttonSaveCard?.addEventListener('click', handleSaveCard);
  elements.buttonDownload.addEventListener('click', handleDownload);
  elements.buttonClearHistory?.addEventListener('click', handleClearHistory);
  
  // Translation
  elements.buttonTranslate.addEventListener('click', handleTranslate);
  elements.buttonConfirmTranslate?.addEventListener('click', handleConfirmTranslate);
  elements.buttonCancelTranslate?.addEventListener('click', handleCancelTranslate);
  elements.buttonRestoreOriginal.addEventListener('click', handleRestoreOriginal);
  
  // Share
  elements.buttonShareCard?.addEventListener('click', handleShareCard);
  
  // Social share
  elements.shareTwitter.addEventListener('click', () => handleSocialShare('twitter'));
  elements.shareLinkedin.addEventListener('click', () => handleSocialShare('linkedin'));
  elements.shareReddit.addEventListener('click', () => handleSocialShare('reddit'));
  elements.shareEmail.addEventListener('click', () => handleSocialShare('email'));
}

/**
 * Validate inputs and enable/disable buttons
 */
function validateInputs() {
  if (!elements.youtubeUrlInput || !elements.buttonFetch) {
    return;
  }
  
  const urlValue = elements.youtubeUrlInput.value;
  const hasUrl = !isEmpty(urlValue);
  
  if (hasUrl) {
    enableButton(elements.buttonFetch);
  } else {
    disableButton(elements.buttonFetch);
  }
}

/**
 * Handle paste event (plain text only)
 */
function handlePaste(e) {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
}

/**
 * Handle auto-detect button
 */
async function handleAutoDetect() {
  hideAllStatus();
  showLoading();
  showStatus(STATUS_MESSAGES.DETECTING_PAGE);
  
  try {
    const result = await autoDetectContent();
    
    if (result.type === 'youtube') {
      // YouTube video
      state.currentContentType = CONFIG.CONTENT_TYPES.YOUTUBE;
      setValue(elements.youtubeUrlInput, result.url);
      validateInputs(); // Re-enable fetch button
      showStatus(STATUS_MESSAGES.FETCHING_VIDEO);
      
      const videoData = await fetchVideoFromUrl(result.url);
      state.currentVideoData = videoData;
      
      hideLoading();
      displayContentSelection(videoData, 'youtube');
      enableButton(elements.buttonReset);
      
    } else if (result.type === 'webpage') {
      // Webpage
      state.currentContentType = CONFIG.CONTENT_TYPES.WEBPAGE;
      state.currentVideoData = result.data;
      setValue(elements.youtubeUrlInput, result.url);
      validateInputs(); // Re-enable fetch button
      
      hideLoading();
      displayContentSelection(result.data, 'webpage');
      enableButton(elements.buttonReset);
    }
    
  } catch (error) {
    hideLoading();
    showError(error.message || 'An error occurred. Please try again.');
    console.error('Auto-detect error:', error);
  }
}

/**
 * Handle fetch button
 */
async function handleFetch() {
  hideAllStatus();
  showLoading();
  
  const url = elements.youtubeUrlInput.value.trim();
  
  try {
    if (isYouTubeUrl(url)) {
      state.currentContentType = CONFIG.CONTENT_TYPES.YOUTUBE;
      showStatus(STATUS_MESSAGES.FETCHING_VIDEO);
      
      const videoData = await fetchVideoFromUrl(url);
      state.currentVideoData = videoData;
      
      hideLoading();
      displayContentSelection(videoData, 'youtube');
      enableButton(elements.buttonReset);
      
    } else {
      state.currentContentType = CONFIG.CONTENT_TYPES.WEBPAGE;
      showStatus(STATUS_MESSAGES.EXTRACTING_CONTENT);
      
      const webpageData = await extractContentFromUrl(url);
      state.currentVideoData = webpageData;
      
      hideLoading();
      displayContentSelection(webpageData, 'webpage');
      enableButton(elements.buttonReset);
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
    hideLoading();
    showError(error.message || 'An error occurred. Please try again.');
  }
}

/**
 * Handle generate summary button
 */
async function handleGenerateSummary() {
  if (!state.currentVideoData) return;
  
  hideContentSelection();
  showLoading();
  
  const customPrompt = elements.customPromptInput.value.trim();
  
  try {
    // Prepare content (always include description and captions)
    // Following Terra's approach: structured content with title, subtitle, and body
    const { title, subtitle, content } = prepareContent(
      state.currentVideoData,
      state.currentContentType,
      true,  // Always include description
      true   // Always include captions
    );
    
    if (isEmpty(content)) {
      throw new Error(ERROR_MESSAGES.NO_CONTENT_TO_SUMMARIZE);
    }
    
    // Generate summary
    showStatus(STATUS_MESSAGES.GENERATING_SUMMARY);
    
    const summaryType = elements.summaryType?.value || 'tldr';
    const summaryLength = elements.summaryLength?.value || 'long';
    
    const summary = await generateSummary({
      title,
      subtitle,  // Pass subtitle for Terra's structured format
      content,
      customPrompt,
      contentType: state.currentContentType === 'youtube' ? 'YouTube video' : 'article',
      temperature: parseFloat(elements.sliderTemperature.value),
      topK: parseInt(elements.sliderTopK.value),
      summaryType,
      summaryLength
    });
    
    // Store original for translation
    state.originalSummary = summary.html;
    
    // Display card
    hideLoading();
    displayCard(state.currentVideoData, summary, state.currentContentType);
    showStatus(STATUS_MESSAGES.SUCCESS, 3000);
    
  } catch (error) {
    hideLoading();
    showError(error.message || 'An error occurred. Please try again.');
    console.error('Summary generation error:', error);
  }
}

/**
 * Handle cancel selection button
 */
function handleCancelSelection() {
  hideContentSelection();
  state.currentVideoData = null;
}

/**
 * Handle reset button
 */
function handleReset() {
  resetState();
  hideAllStatus();
  hideContentSelection();
  hideCard();
  setValue(elements.youtubeUrlInput, '');
  setValue(elements.descriptionText, '');
  disableButton(elements.buttonReset);
  validateInputs();
}

/**
 * Handle download card button
 */
async function handleDownload() {
  console.log('💾 Download button clicked');
  showLoading();
  showStatus(STATUS_MESSAGES.GENERATING_IMAGE);
  
  try {
    const cardEl = getCardElement();
    console.log('Card element:', cardEl);
    
    if (!cardEl) {
      throw new Error('Card element not found. Please generate a summary first.');
    }
    
    await exportCardAsPng(cardEl);
    
    hideLoading();
    showStatus(STATUS_MESSAGES.CARD_DOWNLOADED, 2000);
  } catch (error) {
    hideLoading();
    showError(error.message || 'Failed to download card.');
    console.error('Download error:', error);
  }
}

/**
 * Handle social share
 */
function handleSocialShare(platform) {
  const title = getVideoTitle(state.currentVideoData) || 'Check this out!';
  const summary = getSummaryElement()?.innerText || '';
  const url = elements.youtubeUrlInput.value.trim();
  
  const handler = getSocialShareHandler(platform, { title, summary, url });
  handler();
}

/**
 * Handle translate button - shows language selection
 */
function handleTranslate() {
  if (!state.currentVideoData) return;
  
  // Show translation options, hide share options
  if (elements.translationOptions) {
    show(elements.translationOptions);
  }
  if (elements.socialShareOptions) {
    hide(elements.socialShareOptions);
  }
}

/**
 * Handle cancel translate button
 */
function handleCancelTranslate() {
  if (elements.translationOptions) {
    hide(elements.translationOptions);
  }
}

/**
 * Handle share card button - shows social share options
 */
function handleShareCard() {
  if (!state.currentVideoData) return;
  
  // Show share options, hide translation options
  if (elements.socialShareOptions) {
    show(elements.socialShareOptions);
  }
  if (elements.translationOptions) {
    hide(elements.translationOptions);
  }
}

/**
 * Handle confirm translate button - performs translation
 */
async function handleConfirmTranslate() {
  if (!state.currentVideoData) return;
  
  const targetLang = elements.targetLanguage.value;
  
  if (targetLang === 'en' && !state.isTranslated) {
    showStatus(STATUS_MESSAGES.ALREADY_IN_ENGLISH, 2000);
    return;
  }
  
  try {
    // Hide translation options, show loading
    hide(elements.translationOptions);
    disableButton(elements.buttonConfirmTranslate);
    showStatus(STATUS_MESSAGES.TRANSLATING);
    
    // Store original if first translation
    if (!state.originalSummary) {
      state.originalSummary = getSummaryElement()?.innerHTML || '';
      state.originalTitle = elements.cardTitle?.textContent || '';
    }
    
    // Get title and summary
    const titleText = elements.cardTitle?.textContent || '';
    const summaryElement = getSummaryElement();
    
    // Clone the summary to preserve structure
    const summaryClone = summaryElement.cloneNode(true);
    
    // Translate title
    const translatedTitle = await translate(
      titleText,
      targetLang,
      (percent) => showStatus(STATUS_MESSAGES.DOWNLOADING_MODEL(percent))
    );
    
    // Translate all text nodes in the summary while preserving HTML structure
    const textNodes = [];
    const walker = document.createTreeWalker(
      summaryClone,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent.trim();
          return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // Translate all text nodes
    for (const textNode of textNodes) {
      const originalText = textNode.textContent;
      if (originalText.trim()) {
        const translatedText = await translate(originalText, targetLang);
        textNode.textContent = translatedText;
      }
    }
    
    // Update card with translated content (preserves all HTML structure)
    if (elements.cardTitle) {
      setText(elements.cardTitle, translatedTitle);
    }
    
    updateCardSummary(summaryClone.innerHTML);
    
    // Show translation info
    const langName = getLanguageName(targetLang);
    if (elements.translationLanguage) {
      setText(elements.translationLanguage, langName);
    }
    show(elements.translationInfo);
    
    state.isTranslated = true;
    
    showStatus(`✅ Translated to ${langName}`, 2000);
    
  } catch (error) {
    showError(error.message || 'Translation failed.');
    console.error('Translation error:', error);
  } finally {
    enableButton(elements.buttonConfirmTranslate);
  }
}

/**
 * Handle restore original button
 */
function handleRestoreOriginal() {
  if (state.originalSummary) {
    updateCardSummary(state.originalSummary);
  }
  
  if (state.originalTitle && elements.cardTitle) {
    setText(elements.cardTitle, state.originalTitle);
  }
  
  hide(elements.translationInfo);
  state.isTranslated = false;
  
  showStatus(STATUS_MESSAGES.ORIGINAL_RESTORED, 1500);
}

/**
 * Reset state
 */
function resetState() {
  state.currentVideoData = null;
  state.currentContentType = null;
  state.originalSummary = null;
  state.originalTitle = null;
  state.isTranslated = false;
  resetAISession();
}

/**
 * Switch between tabs
 */
function switchTab(tab) {
  console.log('🔄 Switching to tab:', tab);
  if (tab === 'new') {
    elements.tabNew?.classList.add('active');
    elements.tabHistory?.classList.remove('active');
    show(elements.newSummaryContent);
    hide(elements.historyContent);
    console.log('✅ New Summary visible, History hidden');
    console.log('New Summary hidden attr:', elements.newSummaryContent?.hasAttribute('hidden'));
    console.log('History hidden attr:', elements.historyContent?.hasAttribute('hidden'));
    // Scroll to top
    if (elements.newSummaryContent) {
      elements.newSummaryContent.scrollTop = 0;
    }
  } else if (tab === 'history') {
    elements.tabNew?.classList.remove('active');
    elements.tabHistory?.classList.add('active');
    hide(elements.newSummaryContent);
    show(elements.historyContent);
    console.log('✅ History visible, New Summary hidden');
    console.log('New Summary hidden attr:', elements.newSummaryContent?.hasAttribute('hidden'));
    console.log('History hidden attr:', elements.historyContent?.hasAttribute('hidden'));
    console.log('History offsetTop:', elements.historyContent?.offsetTop);
    console.log('New Summary display:', window.getComputedStyle(elements.newSummaryContent).display);
    console.log('History display:', window.getComputedStyle(elements.historyContent).display);
    
    console.log('📚 Loading history cards...');
    loadHistoryCards();
    
    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    if (elements.historyContent) {
      elements.historyContent.scrollTop = 0;
    }
    
    console.log('📜 After scroll - window.scrollY:', window.scrollY);
    console.log('📜 After scroll - History offsetTop:', elements.historyContent?.offsetTop);
  }
}

/**
 * Handle save card button
 */
async function handleSaveCard() {
  try {
    const cardData = {
      title: elements.cardTitle?.textContent || '',
      summary: getSummaryElement()?.innerHTML || '',
      url: elements.youtubeUrlInput?.value || '',
      contentType: state.currentContentType,
      thumbnail: elements.cardThumbnail?.src || '',
      personalNotes: document.getElementById('card-personal-notes')?.textContent || ''
    };
    
    console.log('💾 Saving card data:', cardData);
    await saveSummaryCard(cardData);
    console.log('✅ Card saved successfully!');
    showStatus('✅ Card saved to history!', 2000);
  } catch (error) {
    showError('Failed to save card');
    console.error('❌ Save error:', error);
  }
}

/**
 * Load and display history cards
 */
async function loadHistoryCards() {
  try {
    const cards = await getSavedCards();
    console.log('📚 Loading history cards:', cards.length, 'cards found', cards);
    
    if (!elements.historyList) {
      console.error('❌ historyList element not found!');
      return;
    }
    
    if (cards.length === 0) {
      console.log('📭 No cards to display, showing empty state');
      elements.historyList.innerHTML = `
        <div class="empty-state">
          <span class="icon">📭</span>
          <p>No saved cards yet</p>
          <small>Generate and save summaries to see them here</small>
        </div>
      `;
      return;
    }
    
    console.log('✅ Displaying', cards.length, 'cards');
    
    const cardsHtml = cards.map(card => `
      <div class="history-card" data-card-id="${card.id}">
        <img src="${card.thumbnail || '../images/icon128.png'}" alt="Thumbnail" class="history-thumbnail">
        <div class="history-info">
          <h4>${card.title}</h4>
          <small>${new Date(card.timestamp).toLocaleDateString()}</small>
          <div class="history-actions">
            <button class="btn-view-card" data-card-id="${card.id}">View</button>
            <button class="btn-delete-card" data-card-id="${card.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
    
    console.log('📝 Generated HTML length:', cardsHtml.length, 'characters');
    console.log('📝 First card HTML:', cardsHtml.substring(0, 200));
    console.log('📍 History list element:', elements.historyList);
    console.log('📍 History list visible?', elements.historyList.offsetParent !== null);
    console.log('📍 History list display:', window.getComputedStyle(elements.historyList).display);
    console.log('🔍 History list innerHTML before:', elements.historyList.innerHTML.substring(0, 100));
    setHTML(elements.historyList, cardsHtml);
    console.log('✅ History list innerHTML after:', elements.historyList.innerHTML.substring(0, 200));
    console.log('✅ History list childElementCount:', elements.historyList.childElementCount);
    
    // Attach event listeners
    document.querySelectorAll('.btn-view-card').forEach(btn => {
      btn.addEventListener('click', (e) => handleViewCard(e.target.dataset.cardId));
    });
    
    document.querySelectorAll('.btn-delete-card').forEach(btn => {
      btn.addEventListener('click', (e) => handleDeleteCard(e.target.dataset.cardId));
    });
    
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

/**
 * View a saved card
 */
async function handleViewCard(cardId) {
  try {
    const cards = await getSavedCards();
    const card = cards.find(c => c.id === cardId);
    
    if (!card) return;
    
    // Populate card display
    if (elements.cardTitle) setText(elements.cardTitle, card.title);
    if (elements.cardThumbnail) elements.cardThumbnail.src = card.thumbnail;
    if (elements.cardVideoLink) elements.cardVideoLink.href = card.url;
    updateCardSummary(card.summary);
    
    if (card.personalNotes) {
      const notesEl = document.getElementById('card-personal-notes');
      if (notesEl) notesEl.textContent = card.personalNotes;
    }
    
    // Switch to new tab and show card
    switchTab('new');
    show(elements.cardContainer);
    
  } catch (error) {
    showError('Failed to load card');
    console.error('View card error:', error);
  }
}

/**
 * Delete a saved card
 */
async function handleDeleteCard(cardId) {
  try {
    await deleteSavedCard(cardId);
    loadHistoryCards(); // Refresh list
    showStatus('🗑️ Card deleted', 1500);
  } catch (error) {
    showError('Failed to delete card');
    console.error('Delete error:', error);
  }
}

/**
 * Clear all history
 */
async function handleClearHistory() {
  if (!confirm('Are you sure you want to delete all saved cards?')) {
    return;
  }
  
  try {
    await clearAllSavedCards();
    loadHistoryCards(); // Refresh list
    showStatus('🗑️ All cards deleted', 2000);
  } catch (error) {
    showError('Failed to clear history');
    console.error('Clear history error:', error);
  }
}

// ==================== START APPLICATION ====================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


