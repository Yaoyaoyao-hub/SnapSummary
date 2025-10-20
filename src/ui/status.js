/**
 * UI Status Management
 */

import { show, hide, setText, setHTML } from '../utils/dom.js';

// DOM elements (will be initialized)
let statusElement, loadingElement, errorElement;

/**
 * Initialize status UI elements
 * @param {object} elements - Status elements
 */
export function initStatusElements(elements) {
  statusElement = elements.status;
  loadingElement = elements.loading;
  errorElement = elements.error;
}

/**
 * Show status message
 * @param {string} message - Status message
 * @param {number} autohideMs - Auto-hide after milliseconds (0 = no auto-hide)
 */
export function showStatus(message, autohideMs = 0) {
  if (statusElement) {
    setText(statusElement, message);
    show(statusElement);
    
    if (autohideMs > 0) {
      setTimeout(() => hide(statusElement), autohideMs);
    }
  }
}

/**
 * Hide status message
 */
export function hideStatus() {
  if (statusElement) {
    hide(statusElement);
  }
}

/**
 * Show loading indicator
 * @param {string} message - Loading message
 */
export function showLoading(message = 'Loading...') {
  if (loadingElement) {
    const messageEl = loadingElement.querySelector('.loading-message');
    if (messageEl) {
      setText(messageEl, message);
    }
    show(loadingElement);
  }
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
  if (loadingElement) {
    hide(loadingElement);
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 * @param {number} autohideMs - Auto-hide after milliseconds (0 = no auto-hide)
 */
export function showError(message, autohideMs = 0) {
  if (errorElement) {
    setText(errorElement, message);
    show(errorElement);
    
    if (autohideMs > 0) {
      setTimeout(() => hide(errorElement), autohideMs);
    }
  }
  console.error(message);
}

/**
 * Hide error message
 */
export function hideError() {
  if (errorElement) {
    hide(errorElement);
  }
}

/**
 * Hide all status elements
 */
export function hideAll() {
  hideStatus();
  hideLoading();
  hideError();
}


