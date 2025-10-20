/**
 * Chrome Storage Utility Functions
 * Uses chrome.storage.local for persistent card history
 */

const STORAGE_KEY = 'snapsummary_saved_cards';
const MAX_SAVED_CARDS = 50; // Limit to prevent storage issues

/**
 * Save a summary card to Chrome storage
 * @param {object} card - Card data
 * @returns {Promise<void>}
 */
export async function saveSummaryCard(card) {
  try {
    const cardData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: card.title,
      summary: card.summary,
      url: card.url,
      contentType: card.contentType,
      thumbnail: card.thumbnail,
      personalNotes: card.personalNotes || ''
    };
    
    // Get existing cards
    const existingCards = await getSavedCards();
    
    // Add new card at beginning
    const updatedCards = [cardData, ...existingCards];
    
    // Limit to MAX_SAVED_CARDS
    const limitedCards = updatedCards.slice(0, MAX_SAVED_CARDS);
    
    // Save to Chrome storage
    await chrome.storage.local.set({ [STORAGE_KEY]: limitedCards });
    
    console.log('✅ Card saved to history');
    return cardData.id;
  } catch (error) {
    console.error('Failed to save card:', error);
    throw error;
  }
}

/**
 * Get all saved summary cards
 * @returns {Promise<Array>} Array of saved cards
 */
export async function getSavedCards() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    console.error('Failed to load saved cards:', error);
    return [];
  }
}

/**
 * Delete a saved card by ID
 * @param {string} cardId - Card ID
 * @returns {Promise<void>}
 */
export async function deleteSavedCard(cardId) {
  try {
    const cards = await getSavedCards();
    const filtered = cards.filter(card => card.id !== cardId);
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
  } catch (error) {
    console.error('Failed to delete card:', error);
    throw error;
  }
}

/**
 * Clear all saved cards
 * @returns {Promise<void>}
 */
export async function clearAllSavedCards() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: [] });
  } catch (error) {
    console.error('Failed to clear cards:', error);
    throw error;
  }
}

/**
 * Get card by ID
 * @param {string} cardId - Card ID
 * @returns {Promise<object|null>} Card data or null
 */
export async function getSavedCardById(cardId) {
  try {
    const cards = await getSavedCards();
    return cards.find(card => card.id === cardId) || null;
  } catch (error) {
    console.error('Failed to get card:', error);
    return null;
  }
}

