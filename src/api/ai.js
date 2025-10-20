/**
 * AI API Integration (Chrome Prompt API - Gemini Nano)
 */

/* global LanguageModel, Translator */

import { CONFIG, AI_PROMPTS, ERROR_MESSAGES } from '../config/constants.js';

let session = null;

/**
 * Check if Chrome Prompt API is available
 * @returns {boolean}
 */
export function isPromptApiAvailable() {
  return 'LanguageModel' in self;
}

/**
 * Get AI model defaults/capabilities
 * @returns {Promise<object>} Model parameters
 */
export async function getModelDefaults() {
  if (!isPromptApiAvailable()) {
    throw new Error(ERROR_MESSAGES.PROMPT_API_UNAVAILABLE);
  }
  
  return await LanguageModel.params();
}

/**
 * Create or get AI session
 * @param {object} params - Session parameters
 * @param {number} params.temperature - Temperature (0-2)
 * @param {number} params.topK - Top K value (1-8)
 * @returns {Promise<object>} AI session
 */
export async function getSession(params = {}) {
  if (!session) {
    const sessionParams = {
      initialPrompts: [AI_PROMPTS.SYSTEM],
      temperature: params.temperature || CONFIG.DEFAULT_TEMPERATURE,
      topK: params.topK || CONFIG.DEFAULT_TOP_K
    };
    
    session = await LanguageModel.create(sessionParams);
  }
  
  return session;
}

/**
 * Reset AI session (forces recreation on next use)
 */
export function resetSession() {
  session = null;
}

/**
 * Generate text using AI prompt
 * @param {string} prompt - User prompt
 * @param {object} params - AI parameters
 * @returns {Promise<string>} Generated text
 */
export async function generateText(prompt, params = {}) {
  if (!isPromptApiAvailable()) {
    throw new Error(ERROR_MESSAGES.PROMPT_API_UNAVAILABLE);
  }
  
  try {
    const aiSession = await getSession(params);
    return await aiSession.prompt(prompt);
  } catch (error) {
    console.error('AI generation failed:', error);
    resetSession();
    throw error;
  }
}

/**
 * Generate summary from content
 * @param {string} title - Content title
 * @param {string} content - Content to summarize
 * @param {string} customPrompt - User's custom prompt (optional)
 * @param {string} contentType - Content type ('youtube' or 'webpage')
 * @param {object} aiParams - AI parameters (temperature, topK)
 * @returns {Promise<string>} Summary text
 */
export async function generateSummary(title, content, customPrompt = '', contentType = 'content', aiParams = {}) {
  const contentLimit = CONFIG.CONTENT_LIMIT;
  const contentToUse = content.substring(0, contentLimit);
  const isTruncated = content.length > contentLimit;
  
  // Build prompt
  const prompt = customPrompt.trim()
    ? AI_PROMPTS.CUSTOM_SUMMARY(title, contentToUse, customPrompt, isTruncated)
    : AI_PROMPTS.DEFAULT_SUMMARY(title, contentToUse, contentType, isTruncated);
  
  return await generateText(prompt, aiParams);
}

/**
 * Check if Rewriter API is available
 * @returns {boolean}
 */
export function isRewriterAvailable() {
  return 'ai' in self && 'rewriter' in self.ai;
}

/**
 * Rewrite/polish text using Rewriter API
 * Reference: https://developer.chrome.com/docs/ai/rewriter-api
 * 
 * @param {string} text - Text to rewrite
 * @param {object} options - Rewriter options
 * @param {string} options.tone - 'as-is', 'more-formal', 'more-casual'
 * @param {string} options.format - 'as-is', 'markdown', 'plain-text'
 * @param {string} options.length - 'as-is', 'shorter', 'longer'
 * @param {string} options.sharedContext - Context to guide rewriting
 * @param {string} options.context - Additional context for this specific rewrite
 * @returns {Promise<string>} Rewritten text
 */
export async function rewriteText(text, options = {}) {
  if (!isRewriterAvailable()) {
    throw new Error(ERROR_MESSAGES.REWRITER_UNAVAILABLE);
  }
  
  // Build rewriter options following Chrome docs
  const rewriterOptions = {
    tone: options.tone || 'more-formal',
    format: options.format || 'markdown',
    length: options.length || 'as-is'
  };
  
  // Add sharedContext if provided (helps model understand the content domain)
  if (options.sharedContext) {
    rewriterOptions.sharedContext = options.sharedContext;
  }
  
  const rewriter = await self.ai.rewriter.create(rewriterOptions);
  
  try {
    // Rewrite with optional context
    const rewrittenText = await rewriter.rewrite(text, {
      context: options.context
    });
    return rewrittenText;
  } finally {
    rewriter.destroy();
  }
}

/**
 * Check if Translator API is available
 * @returns {boolean}
 */
export function isTranslatorAvailable() {
  return 'Translator' in self;
}

/**
 * Check if translation is available for language pair
 * @param {string} sourceLanguage - Source language code
 * @param {string} targetLanguage - Target language code
 * @returns {Promise<string>} Availability status ('readily', 'after-download', 'no')
 */
export async function checkTranslationAvailability(sourceLanguage, targetLanguage) {
  if (!isTranslatorAvailable()) {
    return 'no';
  }
  
  return await Translator.availability({
    sourceLanguage,
    targetLanguage
  });
}

/**
 * Translate text
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLanguage, onProgress = null) {
  if (!isTranslatorAvailable()) {
    throw new Error(ERROR_MESSAGES.TRANSLATOR_UNAVAILABLE);
  }
  
  const translatorOptions = {
    sourceLanguage: 'en',
    targetLanguage
  };
  
  if (onProgress) {
    translatorOptions.monitor = (m) => {
      m.addEventListener('downloadprogress', (e) => {
        const percent = Math.round(e.loaded * 100);
        onProgress(percent);
      });
    };
  }
  
  const translator = await Translator.create(translatorOptions);
  
  try {
    return await translator.translate(text);
  } finally {
    // Translator API doesn't have explicit destroy method
  }
}


