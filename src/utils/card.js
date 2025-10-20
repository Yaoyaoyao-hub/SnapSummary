/**
 * Card Utility Functions
 */

/**
 * Prepare card for download by hiding empty sections
 * @param {HTMLElement} cardElement - Card element
 * @returns {Function} Cleanup function to restore visibility
 */
export function prepareCardForDownload(cardElement) {
  const hiddenElements = [];
  
  // Hide personal notes if empty
  const notesSection = cardElement?.querySelector('#card-personal-notes-section');
  const notesContent = cardElement?.querySelector('#card-personal-notes');
  
  if (notesSection && notesContent) {
    const hasContent = notesContent.textContent.trim().length > 0;
    
    if (!hasContent) {
      notesSection.style.display = 'none';
      hiddenElements.push(notesSection);
    }
  }
  
  // Return cleanup function to restore visibility
  return () => {
    hiddenElements.forEach(el => {
      el.style.display = '';
    });
  };
}

