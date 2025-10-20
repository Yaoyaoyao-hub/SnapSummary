/**
 * Translation Service
 */

import {
  translateText as aiTranslateText,
  checkTranslationAvailability,
  isTranslatorAvailable
} from '../api/ai.js';
import { CONFIG, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Translate text to target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} Translated text
 */
export async function translate(text, targetLanguage, onProgress = null) {
  if (!isTranslatorAvailable()) {
    throw new Error(ERROR_MESSAGES.TRANSLATOR_UNAVAILABLE);
  }
  
  // Check availability
  const availability = await checkTranslationAvailability('en', targetLanguage);
  
  if (availability === 'no') {
    const langName = CONFIG.LANGUAGES[targetLanguage] || targetLanguage;
    throw new Error(ERROR_MESSAGES.TRANSLATION_NOT_SUPPORTED(langName));
  }
  
  // Translate
  return await aiTranslateText(text, targetLanguage, onProgress);
}

/**
 * Check if translation is supported for language
 * @param {string} targetLanguage - Target language code
 * @returns {Promise<boolean>} Whether translation is supported
 */
export async function isTranslationSupported(targetLanguage) {
  if (!isTranslatorAvailable()) {
    return false;
  }
  
  const availability = await checkTranslationAvailability('en', targetLanguage);
  return availability !== 'no';
}

/**
 * Get language name from code
 * @param {string} languageCode - Language code
 * @returns {string} Language name
 */
export function getLanguageName(languageCode) {
  return CONFIG.LANGUAGES[languageCode] || languageCode;
}

/**
 * Get all supported languages
 * @returns {Array<{code: string, name: string}>} Language list
 */
export function getSupportedLanguages() {
  return Object.entries(CONFIG.LANGUAGES).map(([code, name]) => ({
    code,
    name
  }));
}


