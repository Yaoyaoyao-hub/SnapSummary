/**
 * DOM Utility Functions
 */

/**
 * Show element
 * @param {HTMLElement} element - Element to show
 */
export function show(element) {
  if (element) {
    element.removeAttribute('hidden');
    element.style.display = 'block';
  }
}

/**
 * Hide element
 * @param {HTMLElement} element - Element to hide
 */
export function hide(element) {
  if (element) {
    element.setAttribute('hidden', '');
    element.style.display = 'none';
  }
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Element to toggle
 */
export function toggle(element) {
  if (element) {
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Hide all specified elements
 * @param {...HTMLElement} elements - Elements to hide
 */
export function hideAll(...elements) {
  elements.forEach(el => hide(el));
}

/**
 * Get element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
export function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with ID "${id}" not found`);
  }
  return element;
}

/**
 * Set element text content safely
 * @param {HTMLElement} element - Element
 * @param {string} text - Text to set
 */
export function setText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

/**
 * Set element HTML safely
 * @param {HTMLElement} element - Element
 * @param {string} html - HTML to set
 */
export function setHTML(element, html) {
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * Set input value safely
 * @param {HTMLInputElement} element - Input element
 * @param {string} value - Value to set
 */
export function setValue(element, value) {
  if (element) {
    element.value = value;
  }
}

/**
 * Enable button
 * @param {HTMLButtonElement} button - Button element
 */
export function enableButton(button) {
  if (button) {
    button.removeAttribute('disabled');
  }
}

/**
 * Disable button
 * @param {HTMLButtonElement} button - Button element
 */
export function disableButton(button) {
  if (button) {
    button.setAttribute('disabled', '');
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Download data as file
 * @param {string} data - Data URL or blob URL
 * @param {string} filename - Filename for download
 */
export function downloadFile(data, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = data;
  link.click();
}


