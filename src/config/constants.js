/**
 * Application Configuration and Constants
 */

// Import API key from private file (gitignored, but included in build)
import { API_KEYS } from './api-keys.js';

export const CONFIG = {
  // YouTube API Key - Imported from private file
  // The key is NOT in the public repo, but IS included when you build/distribute
  // This allows: GitHub repo = clean, Distributed extension = working
  YOUTUBE_API_KEY: API_KEYS.YOUTUBE_API_KEY,
  YOUTUBE_API_BASE: 'https://www.googleapis.com/youtube/v3',
  
  // AI Settings
  DEFAULT_TEMPERATURE: 0.8,
  DEFAULT_TOP_K: 3,
  CONTENT_LIMIT: 15000, // Max chars to send to AI
  
  // Storage Keys
  STORAGE_KEYS: {
    CUSTOM_PROMPT: 'ytshare_custom_prompt',
    TEMPERATURE: 'ytshare_temperature',
    TOP_K: 'ytshare_topk',
    TARGET_LANGUAGE: 'ytshare_target_language'
  },
  
  // Content Types
  CONTENT_TYPES: {
    YOUTUBE: 'youtube',
    WEBPAGE: 'webpage'
  },
  
  // Language Codes and Names
  LANGUAGES: {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ru': 'Russian'
  }
};

export const AI_PROMPTS = {
  SYSTEM: {
    role: 'system',
    content: 'You are a helpful assistant that creates concise, engaging summaries of YouTube videos and articles. Focus on key takeaways and important information. Format your response in markdown for better readability.'
  },
  
  DEFAULT_SUMMARY: (title, content, contentType, isTruncated) => `Please create a concise and engaging summary of this ${contentType}. Focus on the key takeaways and main points.

Title: ${title}

Content${isTruncated ? ' (excerpt)' : ''}:
${content}

Provide a well-structured summary with bullet points or short paragraphs highlighting the most important information.`,
  
  CUSTOM_SUMMARY: (title, content, customPrompt, isTruncated) => `Title: ${title}

Content${isTruncated ? ' (excerpt)' : ''}:
${content}

User Request: ${customPrompt}`
};

export const ERROR_MESSAGES = {
  PROMPT_API_UNAVAILABLE: 'Chrome Prompt API not available. Please ensure you are using Chrome 138+ with AI features enabled.',
  SUMMARIZER_UNAVAILABLE: 'Chrome Summarizer API not available. Please ensure you are using Chrome 138+ with AI features enabled.',
  TRANSLATOR_UNAVAILABLE: 'Chrome Translator API not available. This feature requires Chrome 138+ with AI features enabled.',
  REWRITER_UNAVAILABLE: 'Chrome Rewriter API not available. Please update Chrome to the latest version.',
  VIDEO_NOT_FOUND: 'Video not found',
  NO_CONTENT_TO_SUMMARIZE: 'Please select at least some content to summarize',
  EXTRACTION_FAILED: 'Failed to extract webpage content. Please navigate to the page and use the auto-detect button.',
  TRANSLATION_NOT_SUPPORTED: (lang) => `Translation to ${lang} is not supported.`,
  CONTENT_TOO_LONG: 'Content is too long for summarization. Please try with a shorter excerpt.'
};

export const STATUS_MESSAGES = {
  DETECTING_PAGE: '🔍 Detecting current page...',
  FETCHING_VIDEO: '📺 Fetching YouTube video...',
  EXTRACTING_CONTENT: '📄 Extracting webpage content...',
  GENERATING_SUMMARY: '🤖 Generating AI summary...',
  GENERATING_IMAGE: '📸 Generating image...',
  TRANSLATING: '🌍 Translating card...',
  DOWNLOADING_MODEL: (percent) => `🌍 Downloading translation model... ${percent}%`,
  POLISHING_NOTES: '✨ Organizing your notes...',
  SUCCESS: '✨ Summary card generated successfully!',
  CARD_DOWNLOADED: '✅ Card downloaded!',
  TEXT_COPIED: '✅ Text copied to clipboard!',
  LINK_COPIED: '✅ Link copied!',
  NOTES_POLISHED: '✅ Notes polished!',
  ORIGINAL_RESTORED: '↩️ Original language restored',
  ALREADY_IN_ENGLISH: 'ℹ️ Card is already in English'
};

