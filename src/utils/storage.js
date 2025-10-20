/**
 * LocalStorage Utility Functions
 */

/**
 * Save item to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
}

/**
 * Load item from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Stored value or default
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return defaultValue;
  }
}

/**
 * Save string directly (without JSON encoding)
 * @param {string} key - Storage key
 * @param {string} value - String value
 */
export function saveString(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Failed to save string:', error);
  }
}

/**
 * Load string directly (without JSON parsing)
 * @param {string} key - Storage key
 * @param {string} defaultValue - Default value
 * @returns {string} Stored string or default
 */
export function loadString(key, defaultValue = '') {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (error) {
    console.error('Failed to load string:', error);
    return defaultValue;
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from storage:', error);
  }
}

/**
 * Clear all items from localStorage
 */
export function clearStorage() {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}


