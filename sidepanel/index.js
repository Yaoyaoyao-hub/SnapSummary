/* global LanguageModel */

import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { toPng } from 'html-to-image';

// Configuration
const YOUTUBE_API_KEY = 'AIzaSyATMcJW9d_Wuvqj4kgigiwzwM1KZs5qlxU';

// DOM Elements
const youtubeUrlInput = document.getElementById('youtube-url');
const buttonAutoDetect = document.getElementById('button-auto-detect');
const customPromptInput = document.getElementById('custom-prompt');
const buttonFetch = document.getElementById('button-fetch');
const buttonReset = document.getElementById('button-reset');
const buttonDownload = document.getElementById('button-download');
const buttonCopy = document.getElementById('button-copy');
const buttonCopyLink = document.getElementById('button-copy-link');
const buttonShareCard = document.getElementById('button-share-card');
const buttonTranslate = document.getElementById('button-translate');
const buttonRestoreOriginal = document.getElementById('button-restore-original');
const buttonProceed = document.getElementById('button-proceed');
const buttonCancelSelection = document.getElementById('button-cancel-selection');
const translationInfo = document.getElementById('translation-info');
const translationLanguage = document.getElementById('translation-language');

// Social share buttons
const shareTwitter = document.getElementById('share-twitter');
const shareLinkedin = document.getElementById('share-linkedin');
const shareReddit = document.getElementById('share-reddit');
const shareEmail = document.getElementById('share-email');
const statusElement = document.getElementById('status');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const cardContainer = document.getElementById('card-container');
const contentSelection = document.getElementById('content-selection');
const sliderTemperature = document.getElementById('temperature');
const sliderTopK = document.getElementById('top-k');
const labelTemperature = document.getElementById('label-temperature');
const labelTopK = document.getElementById('label-top-k');

// Card elements
const cardThumbnail = document.getElementById('card-thumbnail');
const cardTitle = document.getElementById('card-title');
const cardSummary = document.getElementById('card-summary');
const cardVideoLink = document.getElementById('card-video-link');

// Content selection elements
const previewThumbnail = document.getElementById('preview-thumbnail');
const previewTitle = document.getElementById('preview-title');
const previewChannel = document.getElementById('preview-channel');
const descriptionText = document.getElementById('description-text');
const contentLabel = document.getElementById('content-label');
const includeDescription = document.getElementById('include-description');
const includeCaptions = document.getElementById('include-captions');
const contentTypeIndicator = document.getElementById('content-type-indicator');
const contentTypeIcon = document.getElementById('content-type-icon');
const contentTypeText = document.getElementById('content-type-text');
const contentStats = document.getElementById('content-stats');
const contentCharCount = document.getElementById('content-char-count');
const contentWordCount = document.getElementById('content-word-count');
const fetchButtonText = document.getElementById('fetch-button-text');
const personalNotes = document.getElementById('personal-notes');
const buttonRewriteNotes = document.getElementById('button-rewrite-notes');
const includeNotes = document.getElementById('include-notes');
const cardNotesSection = document.getElementById('card-notes-section');
const cardNotes = document.getElementById('card-notes');
const cardTimestamp = document.getElementById('card-timestamp');
const targetLanguage = document.getElementById('target-language');

// State
let session;
let currentVideoData = null;
let currentContentType = null; // 'youtube' or 'webpage'
let originalSummary = null;
let originalNotes = null;
let isTranslated = false;

// Storage keys
const STORAGE_KEY_PROMPT = 'ytshare_custom_prompt';

// Load saved data
loadSavedData();

// Initialize AI settings
async function initDefaults() {
  if (!('LanguageModel' in self)) {
    showError('Chrome Prompt API not available. Please ensure you are using Chrome 138+ with AI features enabled.');
    return;
  }
  
  try {
    const defaults = await LanguageModel.params();
    console.log('AI Model defaults:', defaults);
    
    sliderTemperature.value = defaults.defaultTemperature || 0.8;
    labelTemperature.textContent = sliderTemperature.value;
    
    const topKValue = defaults.defaultTopK > 3 ? 3 : defaults.defaultTopK;
    sliderTopK.value = topKValue || 3;
    labelTopK.textContent = sliderTopK.value;
    
    if (defaults.maxTopK) {
      sliderTopK.max = defaults.maxTopK;
    }
  } catch (error) {
    console.error('Error initializing AI defaults:', error);
  }
}

initDefaults();

// Event Listeners
youtubeUrlInput.addEventListener('input', validateInputs);

customPromptInput.addEventListener('input', () => {
  saveCustomPrompt();
});

sliderTemperature.addEventListener('input', (event) => {
  labelTemperature.textContent = event.target.value;
  reset();
});

sliderTopK.addEventListener('input', (event) => {
  labelTopK.textContent = event.target.value;
  reset();
});

buttonAutoDetect.addEventListener('click', autoDetectYouTubeVideo);
buttonFetch.addEventListener('click', handleFetchVideo);
buttonProceed.addEventListener('click', handleGenerateSummary);
buttonCancelSelection.addEventListener('click', handleCancelSelection);
buttonReset.addEventListener('click', handleReset);
buttonDownload.addEventListener('click', handleDownloadCard);
buttonCopy.addEventListener('click', handleCopySummary);
buttonCopyLink.addEventListener('click', handleCopyVideoLink);
buttonShareCard.addEventListener('click', handleShareCard);
buttonRewriteNotes.addEventListener('click', handleRewriteNotes);
buttonTranslate.addEventListener('click', handleTranslateCard);
buttonRestoreOriginal.addEventListener('click', handleRestoreOriginal);

// Enable rewrite button when notes are entered
personalNotes.addEventListener('input', () => {
  if (personalNotes.value.trim()) {
    buttonRewriteNotes.removeAttribute('disabled');
  } else {
    buttonRewriteNotes.setAttribute('disabled', '');
  }
});

// Social share handlers
shareTwitter.addEventListener('click', () => handleSocialShare('twitter'));
shareLinkedin.addEventListener('click', () => handleSocialShare('linkedin'));
shareReddit.addEventListener('click', () => handleSocialShare('reddit'));
shareEmail.addEventListener('click', () => handleSocialShare('email'));

// Functions
function loadSavedData() {
  const savedPrompt = localStorage.getItem(STORAGE_KEY_PROMPT);
  
  if (savedPrompt) {
    customPromptInput.value = savedPrompt;
  }
  
  validateInputs();
}

function saveCustomPrompt() {
  localStorage.setItem(STORAGE_KEY_PROMPT, customPromptInput.value);
}

function validateInputs() {
  const hasUrl = youtubeUrlInput.value.trim().length > 0;
  
  if (hasUrl) {
    buttonFetch.removeAttribute('disabled');
  } else {
    buttonFetch.setAttribute('disabled', '');
  }
}

async function autoDetectYouTubeVideo() {
  try {
    // Query for active tab
    const tabs = await chrome.tabs.query({ 
      active: true, 
      currentWindow: true 
    });
    
    if (tabs.length === 0) {
      showError('No active tab found');
      return;
    }
    
    const tab = tabs[0];
    const url = tab.url;
    
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      showError('Cannot extract content from Chrome internal pages');
      return;
    }
    
    // Set the URL
    youtubeUrlInput.value = url;
    
    // Detect content type
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      contentTypeIcon.textContent = '📺';
      contentTypeText.textContent = 'YouTube Video';
    } else {
      contentTypeIcon.textContent = '📄';
      contentTypeText.textContent = 'Web Page';
    }
    
    show(contentTypeIndicator);
    validateInputs();
    showStatus('✅ URL detected from current tab!');
    
    // Auto-hide status after 2 seconds
    setTimeout(() => {
      hide(statusElement);
    }, 2000);
    
  } catch (error) {
    console.error('Auto-detect error:', error);
    showError('Failed to detect content. Please paste the URL manually.');
  }
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

async function fetchVideoData(videoId, apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message || 'Failed to fetch video data');
  }
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }
  
  return data.items[0];
}

async function runPrompt(prompt, params) {
  try {
    if (!session) {
      session = await LanguageModel.create(params);
    }
    return await session.prompt(prompt);
  } catch (error) {
    console.error('Prompt failed:', error);
    reset();
    throw error;
  }
}

async function generateSummary(videoData, customPrompt) {
  const { snippet } = videoData;
  const description = snippet.description || 'No description available';
  const title = snippet.title;
  
  const defaultPrompt = `Please create a concise and engaging summary of this YouTube video. Focus on the key takeaways and main points.

Video Title: ${title}

Video Description:
${description.substring(0, 2000)}

Provide a well-structured summary with bullet points or short paragraphs highlighting the most important information.`;

  const contextualPrompt = customPrompt.trim() 
    ? `Video Title: ${title}\n\nVideo Description:\n${description.substring(0, 2000)}\n\nUser Request: ${customPrompt}`
    : defaultPrompt;
  
  const params = {
    initialPrompts: [
      { 
        role: 'system', 
        content: 'You are a helpful assistant that creates concise, engaging summaries of YouTube videos. Focus on key takeaways and important information. Format your response in markdown for better readability.' 
      }
    ],
    temperature: parseFloat(sliderTemperature.value),
    topK: parseInt(sliderTopK.value)
  };
  
  return await runPrompt(contextualPrompt, params);
}

function displayCard(data, summary) {
  let thumbnailUrl, title, linkUrl;
  
  if (currentContentType === 'youtube') {
    const snippet = data?.snippet || {};
    const id = data?.id || '';
    const thumbnails = snippet.thumbnails || {};
    
    thumbnailUrl = thumbnails.maxres?.url || 
                   thumbnails.high?.url || 
                   thumbnails.medium?.url || 
                   thumbnails.default?.url ||
                   '../images/icon128.png';
    title = snippet.title || 'YouTube Video';
    linkUrl = id ? `https://www.youtube.com/watch?v=${id}` : '#';
    cardVideoLink.innerHTML = '<span class="icon">▶️</span><span>Watch Video</span>';
  } else {
    // Webpage
    thumbnailUrl = data?.image || '../images/icon128.png';
    title = data?.title || 'Web Page';
    linkUrl = data?.url || '#';
    cardVideoLink.innerHTML = '<span class="icon">🔗</span><span>Visit Page</span>';
  }
  
  cardThumbnail.src = thumbnailUrl;
  cardTitle.textContent = title;
  cardVideoLink.href = linkUrl;
  
  // Set timestamp
  const now = new Date();
  const timeString = now.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  cardTimestamp.textContent = timeString;
  
  // Parse markdown summary
  const htmlSummary = DOMPurify.sanitize(marked.parse(summary));
  cardSummary.innerHTML = htmlSummary;
  
  // Store original for translation restore
  originalSummary = htmlSummary;
  
  // Handle personal notes
  if (includeNotes.checked && personalNotes.value.trim()) {
    const notesText = personalNotes.value.trim();
    cardNotes.textContent = notesText;
    originalNotes = notesText;
    show(cardNotesSection);
  } else {
    hide(cardNotesSection);
    originalNotes = null;
  }
  
  // Reset translation state
  isTranslated = false;
  hide(translationInfo);
  
  // Add edit listeners
  setupEditListeners();
  
  show(cardContainer);
  buttonReset.removeAttribute('disabled');
}

function setupEditListeners() {
  // Save edits on blur or when user clicks away
  cardTitle.addEventListener('blur', () => {
    showStatus('💾 Title updated');
    setTimeout(() => hide(statusElement), 1500);
  });
  
  cardSummary.addEventListener('blur', () => {
    showStatus('💾 Summary updated');
    setTimeout(() => hide(statusElement), 1500);
  });
  
  cardNotes.addEventListener('blur', () => {
    showStatus('💾 Notes updated');
    setTimeout(() => hide(statusElement), 1500);
  });
  
  // Prevent formatting on paste (paste as plain text)
  cardTitle.addEventListener('paste', handlePaste);
  cardSummary.addEventListener('paste', handlePaste);
  cardNotes.addEventListener('paste', handlePaste);
}

function handlePaste(e) {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
}

async function handleFetchVideo() {
  hideAll();
  showLoading();
  
  const url = youtubeUrlInput.value.trim();
  
  try {
    // Detect if it's YouTube or webpage
    const videoId = extractVideoId(url);
    
    if (videoId) {
      // YouTube video
      currentContentType = 'youtube';
      showStatus('📺 Fetching YouTube video...');
      const videoData = await fetchVideoData(videoId, YOUTUBE_API_KEY);
      currentVideoData = videoData;
      hideLoading();
      displayContentSelection(videoData, 'youtube');
    } else {
      // Regular webpage
      currentContentType = 'webpage';
      showStatus('📄 Extracting webpage content...');
      const webpageData = await extractWebpageContent(url);
      currentVideoData = webpageData;
      hideLoading();
      displayContentSelection(webpageData, 'webpage');
    }
    
  } catch (error) {
    hideLoading();
    showError(error.message || 'An error occurred. Please try again.');
    console.error('Error:', error);
  }
}

async function extractWebpageContent(url) {
  try {
    // Get the current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    // Check if the URL matches the current tab
    const isCurrentTab = tab && tab.url === url;
    
    if (isCurrentTab) {
      // Execute content extraction script in the page
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-extractor.js']
      });
      
      if (results && results[0] && results[0].result) {
        const extractedData = results[0].result;
        
        // Debug logging
        console.log('📄 Content Extraction Results:');
        console.log('  Title:', extractedData.title);
        console.log('  URL:', extractedData.url);
        console.log('  Content Length:', extractedData.content?.length || 0, 'characters');
        console.log('  Word Count:', extractedData.wordCount || 0, 'words');
        console.log('  Has Image:', !!extractedData.image);
        console.log('  Author:', extractedData.author || 'N/A');
        
        return extractedData;
      }
    }
    
    // If not current tab or extraction failed, create basic data structure
    return {
      type: 'webpage',
      url: url,
      title: 'Web Page',
      content: '',
      image: '',
      description: 'Please navigate to the page and use auto-detect to extract content.',
      author: ''
    };
    
  } catch (error) {
    console.error('Webpage extraction error:', error);
    throw new Error('Failed to extract webpage content. Please navigate to the page and use the auto-detect button.');
  }
}

function displayContentSelection(data, type) {
  let contentText = '';
  
  if (type === 'youtube') {
    const { snippet } = data;
    
    // Get thumbnail
    const thumbnails = snippet.thumbnails;
    const thumbnailUrl = thumbnails.medium?.url || thumbnails.default?.url;
    
    // Populate preview
    previewThumbnail.src = thumbnailUrl;
    previewTitle.textContent = snippet.title;
    previewChannel.textContent = snippet.channelTitle;
    contentText = snippet.description || 'No description available';
    descriptionText.value = contentText;
    contentLabel.textContent = 'Video Description:';
    
  } else if (type === 'webpage') {
    // Populate webpage preview
    previewThumbnail.src = data.image || '../images/icon128.png';
    previewTitle.textContent = data.title;
    previewChannel.textContent = data.author || new URL(data.url).hostname;
    contentText = data.content || data.description || 'No content extracted. Try using auto-detect on the page.';
    descriptionText.value = contentText;
    contentLabel.textContent = 'Page Content:';
  }
  
  // Update content statistics
  updateContentStats(contentText);
  
  // Show the selection interface
  hide(statusElement);
  show(contentSelection);
  buttonReset.removeAttribute('disabled');
}

function updateContentStats(content) {
  const charCount = content.length;
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  contentCharCount.textContent = charCount.toLocaleString();
  contentWordCount.textContent = wordCount.toLocaleString();
  
  // Show stats if there's content
  if (charCount > 0) {
    show(contentStats);
  } else {
    hide(contentStats);
  }
}

function handleCancelSelection() {
  hide(contentSelection);
  currentVideoData = null;
}

async function handleRewriteNotes() {
  const notesText = personalNotes.value.trim();
  if (!notesText) return;
  
  try {
    buttonRewriteNotes.setAttribute('disabled', '');
    buttonRewriteNotes.innerHTML = '<span class="icon">⏳</span><span>Polishing...</span>';
    
    // Check if Rewriter API is available
    if (!('ai' in self) || !('rewriter' in self.ai)) {
      throw new Error('Chrome Rewriter API not available. Please update Chrome to the latest version.');
    }
    
    // Create rewriter
    const rewriter = await self.ai.rewriter.create({
      tone: 'more-formal',
      format: 'markdown',
      length: 'as-is'
    });
    
    // Rewrite the notes
    showStatus('✨ Organizing your notes...');
    const rewrittenNotes = await rewriter.rewrite(notesText);
    
    // Update the textarea
    personalNotes.value = rewrittenNotes;
    
    // Cleanup
    rewriter.destroy();
    
    showStatus('✅ Notes polished!');
    setTimeout(() => hide(statusElement), 2000);
    
  } catch (error) {
    console.error('Rewrite error:', error);
    showError(error.message || 'Failed to polish notes. Try manually editing instead.');
  } finally {
    buttonRewriteNotes.removeAttribute('disabled');
    buttonRewriteNotes.innerHTML = '<span class="icon">✨</span><span>Polish with AI</span>';
  }
}

async function handleTranslateCard() {
  if (!currentVideoData) return;
  
  const targetLang = targetLanguage.value;
  
  // If already in English or same language, show message
  if (targetLang === 'en' && !isTranslated) {
    showStatus('ℹ️ Card is already in English');
    setTimeout(() => hide(statusElement), 2000);
    return;
  }
  
  try {
    buttonTranslate.setAttribute('disabled', '');
    buttonTranslate.innerHTML = '<span class="icon">⏳</span><span>Translating...</span>';
    
    showStatus('🌍 Translating card...');
    
    // Check if Translation API is available
    if (!('Translator' in self)) {
      throw new Error('Chrome Translator API not available. This feature requires Chrome 138+ with AI features enabled.');
    }
    
    // Get the language name for display
    const langNames = {
      'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
      'pt': 'Portuguese', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean',
      'ar': 'Arabic', 'hi': 'Hindi', 'ru': 'Russian'
    };
    
    // Check if the language pair is available
    const availability = await Translator.availability({
      sourceLanguage: 'en',
      targetLanguage: targetLang
    });
    
    if (availability === 'no') {
      throw new Error(`Translation to ${langNames[targetLang] || targetLang} is not supported.`);
    }
    
    // Create translator with download progress monitoring
    const translator = await Translator.create({
      sourceLanguage: 'en',
      targetLanguage: targetLang,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const percent = Math.round(e.loaded * 100);
          showStatus(`🌍 Downloading translation model... ${percent}%`);
        });
      }
    });
    
    // Translate summary text
    const summaryText = cardSummary.innerText;
    const translatedSummary = await translator.translate(summaryText);
    
    // Update card with translation
    cardSummary.innerHTML = DOMPurify.sanitize(marked.parse(translatedSummary));
    
    // Translate notes if present
    if (!cardNotesSection.hidden && cardNotes.textContent) {
      const notesText = cardNotes.textContent;
      const translatedNotes = await translator.translate(notesText);
      cardNotes.textContent = translatedNotes;
    }
    
    // Show translation info
    isTranslated = true;
    translationLanguage.textContent = `Translated to ${langNames[targetLang] || targetLang}`;
    show(translationInfo);
    
    showStatus(`✅ Translated to ${langNames[targetLang]}!`);
    setTimeout(() => hide(statusElement), 2000);
    
  } catch (error) {
    console.error('Translation error:', error);
    showError(error.message || 'Translation failed. This feature requires Chrome Canary with translation flags enabled.');
  } finally {
    buttonTranslate.removeAttribute('disabled');
    buttonTranslate.innerHTML = '<span class="icon">🌍</span><span>Translate Card</span>';
  }
}

function handleRestoreOriginal() {
  if (!originalSummary) return;
  
  // Restore original summary
  cardSummary.innerHTML = originalSummary;
  
  // Restore original notes if present
  if (originalNotes && !cardNotesSection.hidden) {
    cardNotes.textContent = originalNotes;
  }
  
  // Hide translation info
  isTranslated = false;
  hide(translationInfo);
  
  showStatus('↩️ Original language restored');
  setTimeout(() => hide(statusElement), 1500);
}

async function handleGenerateSummary() {
  if (!currentVideoData) return;
  
  hide(contentSelection);
  showLoading();
  
  const customPrompt = customPromptInput.value.trim();
  
  try {
    // Get selected content
    const includeDesc = includeDescription.checked;
    const includeCaps = includeCaptions.checked;
    
    let contentToSummarize = '';
    
    if (includeDesc) {
      contentToSummarize = descriptionText.value.trim();
    }
    
    if (!contentToSummarize) {
      throw new Error('Please select at least some content to summarize');
    }
    
    // Get title safely based on content type
    let contentTitle;
    if (currentContentType === 'youtube') {
      contentTitle = currentVideoData?.snippet?.title || 'YouTube Video';
    } else {
      contentTitle = currentVideoData?.title || 'Web Page';
    }
    
    // Generate AI summary
    showStatus('🤖 Generating AI summary...');
    const summary = await generateSummaryFromContent(
      contentTitle,
      contentToSummarize,
      customPrompt
    );
    
    hideLoading();
    displayCard(currentVideoData, summary);
    showStatus('✨ Summary card generated successfully!');
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      hide(statusElement);
    }, 3000);
    
  } catch (error) {
    hideLoading();
    showError(error.message || 'An error occurred. Please try again.');
    console.error('Error:', error);
  }
}

async function generateSummaryFromContent(title, content, customPrompt) {
  const contentType = currentContentType === 'youtube' ? 'YouTube video' : 'article/webpage';
  
  // Use more content for better summaries - limit to 15k chars to stay within context window
  const contentLimit = 15000;
  const contentToUse = content.substring(0, contentLimit);
  const isTruncated = content.length > contentLimit;
  
  // Debug logging
  console.log('🤖 Generating Summary:');
  console.log('  Original Content Length:', content.length, 'chars');
  console.log('  Sending to AI:', contentToUse.length, 'chars');
  console.log('  Truncated:', isTruncated);
  
  const defaultPrompt = `Please create a concise and engaging summary of this ${contentType}. Focus on the key takeaways and main points.

Title: ${title}

Content${isTruncated ? ' (excerpt)' : ''}:
${contentToUse}

Provide a well-structured summary with bullet points or short paragraphs highlighting the most important information.`;

  const contextualPrompt = customPrompt.trim() 
    ? `Title: ${title}\n\nContent${isTruncated ? ' (excerpt)' : ''}:\n${contentToUse}\n\nUser Request: ${customPrompt}`
    : defaultPrompt;
  
  const params = {
    initialPrompts: [
      { 
        role: 'system', 
        content: 'You are a helpful assistant that creates concise, engaging summaries of YouTube videos. Focus on key takeaways and important information. Format your response in markdown for better readability.' 
      }
    ],
    temperature: parseFloat(sliderTemperature.value),
    topK: parseInt(sliderTopK.value)
  };
  
  return await runPrompt(contextualPrompt, params);
}

function handleReset() {
  hideAll();
  reset();
  currentVideoData = null;
  
  // Clear card
  cardThumbnail.src = '';
  cardTitle.textContent = '';
  cardSummary.innerHTML = '';
  
  // Clear content selection
  descriptionText.value = '';
  includeDescription.checked = true;
  includeCaptions.checked = false;
  personalNotes.value = '';
  includeNotes.checked = false;
  buttonRewriteNotes.setAttribute('disabled', '');
  
  buttonReset.setAttribute('disabled', '');
}

async function handleDownloadCard() {
  const card = document.getElementById('share-card');
  
  try {
    showStatus('📸 Generating image...');
    
    const dataUrl = await toPng(card, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: '#ffffff'
    });
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    
    let title = 'summary';
    if (currentContentType === 'youtube') {
      title = currentVideoData?.snippet?.title || 'video-summary';
    } else {
      title = currentVideoData?.title || 'page-summary';
    }
    
    const filename = `ytshare-${title.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}-${timestamp}.png`;
    
    link.download = filename;
    link.href = dataUrl;
    link.click();
    
    showStatus('✅ Image downloaded successfully!');
    setTimeout(() => hide(statusElement), 2000);
    
  } catch (error) {
    showError('Failed to generate image. Please try again.');
    console.error('Error generating image:', error);
  }
}

async function handleCopySummary() {
  const summaryText = cardSummary.innerText;
  
  try {
    await navigator.clipboard.writeText(summaryText);
    showStatus('✅ Summary copied to clipboard!');
    setTimeout(() => hide(statusElement), 2000);
  } catch (error) {
    showError('Failed to copy summary. Please try again.');
    console.error('Error copying to clipboard:', error);
  }
}

async function handleCopyVideoLink() {
  if (!currentVideoData) return;
  
  let contentUrl;
  if (currentContentType === 'youtube') {
    contentUrl = `https://www.youtube.com/watch?v=${currentVideoData.id}`;
  } else {
    contentUrl = currentVideoData.url || '#';
  }
  
  try {
    await navigator.clipboard.writeText(contentUrl);
    showStatus('✅ Link copied to clipboard!');
    setTimeout(() => hide(statusElement), 2000);
  } catch (error) {
    showError('Failed to copy link. Please try again.');
    console.error('Error copying to clipboard:', error);
  }
}

async function handleShareCard() {
  if (!currentVideoData) return;
  
  let contentUrl, title;
  if (currentContentType === 'youtube') {
    contentUrl = `https://www.youtube.com/watch?v=${currentVideoData.id}`;
    title = currentVideoData.snippet?.title || 'YouTube Video';
  } else {
    contentUrl = currentVideoData.url || '#';
    title = currentVideoData.title || 'Web Page';
  }
  
  const summaryText = cardSummary.innerText;
  const shareText = `${title}\n\n${summaryText}\n\nRead more: ${contentUrl}\n\n#YTShare`;
  
  // Try native share API first (mobile/supported browsers)
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: summaryText,
        url: videoUrl
      });
      showStatus('✅ Shared successfully!');
      setTimeout(() => hide(statusElement), 2000);
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Fallback to copying
        await navigator.clipboard.writeText(shareText);
        showStatus('✅ Share text copied to clipboard!');
        setTimeout(() => hide(statusElement), 2000);
      }
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      showStatus('✅ Share text copied to clipboard!');
      setTimeout(() => hide(statusElement), 2000);
    } catch (error) {
      showError('Failed to prepare share text. Please try again.');
      console.error('Error:', error);
    }
  }
}

function handleSocialShare(platform) {
  if (!currentVideoData) return;
  
  let contentUrl, title;
  if (currentContentType === 'youtube') {
    contentUrl = `https://www.youtube.com/watch?v=${currentVideoData.id}`;
    title = currentVideoData.snippet?.title || 'YouTube Video';
  } else {
    contentUrl = currentVideoData.url || '#';
    title = currentVideoData.title || 'Web Page';
  }
  
  const summaryText = cardSummary.innerText;
  
  // Format the share content with summary
  let shareText = '';
  let shareUrl = '';
  
  const contentIcon = currentContentType === 'youtube' ? '📺' : '📄';
  const actionWord = currentContentType === 'youtube' ? 'Watch' : 'Read';
  
  switch (platform) {
    case 'twitter':
      // Twitter with summary (280 char limit consideration)
      const twitterSummary = summaryText.length > 200 
        ? summaryText.substring(0, 197) + '...' 
        : summaryText;
      shareText = `${contentIcon} ${title}\n\n${twitterSummary}\n\n🔗 ${contentUrl}\n\n#YTShare`;
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      break;
      
    case 'linkedin':
      // LinkedIn allows longer posts
      shareText = `${contentIcon} ${title}\n\n${summaryText}\n\n${actionWord} more: ${contentUrl}\n\n#YTShare #ContentSummary`;
      // LinkedIn doesn't support pre-filled text via URL, so we'll copy to clipboard and open LinkedIn
      navigator.clipboard.writeText(shareText).then(() => {
        showStatus('📋 Summary copied! Opening LinkedIn...');
        setTimeout(() => {
          window.open('https://www.linkedin.com/feed/', '_blank', 'width=600,height=600');
        }, 1000);
      });
      return;
      
    case 'reddit':
      // Reddit with summary in self-post format
      shareText = `${summaryText}\n\n[${actionWord} more](${contentUrl})\n\n*Generated with YTShare*`;
      shareUrl = `https://reddit.com/submit?title=${encodeURIComponent(title)}&selftext=${encodeURIComponent(shareText)}`;
      break;
      
    case 'email':
      // Email with full summary
      const emailBody = `${title}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${summaryText}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${actionWord} more:\n${contentUrl}\n\nGenerated with YTShare - AI-powered content summaries`;
      shareUrl = `mailto:?subject=${encodeURIComponent(contentIcon + ' ' + title)}&body=${encodeURIComponent(emailBody)}`;
      break;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=600');
    showStatus(`✅ Opening ${platform} with summary...`);
    setTimeout(() => hide(statusElement), 2000);
  }
}

async function reset() {
  if (session) {
    session.destroy();
  }
  session = null;
}

function showLoading() {
  show(loadingElement);
}

function hideLoading() {
  hide(loadingElement);
}

function showStatus(message) {
  statusElement.textContent = message;
  show(statusElement);
}

function showError(message) {
  errorElement.textContent = message;
  show(errorElement);
}

function hideAll() {
  hide(statusElement);
  hide(errorElement);
  hide(loadingElement);
  hide(contentSelection);
}

function show(element) {
  element.removeAttribute('hidden');
}

function hide(element) {
  element.setAttribute('hidden', '');
}
