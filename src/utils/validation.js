/**
 * Validation Utility Functions
 */

/**
 * Count characters in text
 * @param {string} text - Text to count
 * @returns {number} Character count
 */
export function countCharacters(text) {
  return text ? text.length : 0;
}

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Check if text is empty or whitespace only
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export function isEmpty(text) {
  return !text || text.trim().length === 0;
}

/**
 * Truncate text to maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength);
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Get current timestamp
 * @returns {string} Formatted timestamp
 */
export function getCurrentTimestamp() {
  return new Date().toLocaleString();
}

/**
 * Generate filename with timestamp
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension (without dot)
 * @returns {string} Filename
 */
export function generateFilename(prefix, extension) {
  return `${prefix}-${Date.now()}.${extension}`;
}


