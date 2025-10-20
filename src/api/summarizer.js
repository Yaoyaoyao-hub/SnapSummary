/**
 * Chrome Summarizer API Integration
 * Based on best practices from Terra and Bright Sites
 * Reference: https://developer.chrome.com/blog/summarizer-terra-brightsites
 */

/* global Summarizer */

import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Check if Summarizer API is available
 * @returns {Promise<string>} 'available', 'downloadable', or 'unavailable'
 */
export async function checkSummarizerAvailability() {
  try {
    if (!('Summarizer' in self)) {
      return 'unavailable';
    }
    
    const availability = await Summarizer.availability();
    return availability; // 'available', 'downloadable', or 'unavailable'
  } catch (error) {
    console.error('Error checking Summarizer availability:', error);
    return 'unavailable';
  }
}

/**
 * Check if Summarizer API is ready to use
 * @returns {Promise<boolean>}
 */
export async function isSummarizerAvailable() {
  const availability = await checkSummarizerAvailability();
  return availability === 'available';
}

/**
 * Trigger Summarizer model download
 * @param {Function} onProgress - Progress callback (percent)
 * @returns {Promise<boolean>} Success status
 */
export async function downloadSummarizerModel(onProgress = null) {
  try {
    const availability = await checkSummarizerAvailability();
    
    if (availability === 'available') {
      return true; // Already available
    }
    
    if (availability === 'downloadable') {
      // Trigger download
      const summarizer = await Summarizer.create();
      
      // Monitor download progress if callback provided
      if (onProgress && summarizer.addEventListener) {
        summarizer.addEventListener('downloadprogress', (e) => {
          if (e.loaded !== undefined) {
            onProgress(Math.round(e.loaded * 100));
          }
        });
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error downloading Summarizer model:', error);
    return false;
  }
}

/**
 * Generate summary using Summarizer API
 * Based on Terra's implementation with enhanced options
 * 
 * @param {string} text - Text to summarize
 * @param {object} options - Summary options
 * @param {string} options.type - Summary type: 'key-points', 'tl;dr', 'teaser', 'headline'
 * @param {string} options.format - Output format: 'plain-text', 'markdown'
 * @param {string} options.length - Summary length: 'short', 'medium', 'long'
 * @param {string} options.sharedContext - Context to guide summarization
 * @param {string} options.context - Additional context for this specific summary
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @returns {Promise<string>} Summary text
 */
export async function generateSummary(text, options = {}) {
  try {
    // Check availability
    const availability = await checkSummarizerAvailability();
    
    if (availability === 'unavailable') {
      throw new Error(ERROR_MESSAGES.SUMMARIZER_UNAVAILABLE || 'Summarizer API is not available');
    }
    
    if (availability === 'downloadable') {
      throw new Error('Summarizer model needs to be downloaded. Please download it first.');
    }
    
    // Default options based on Terra's implementation
    const summaryOptions = {
      type: options.type || 'teaser',
      format: options.format || 'markdown',
      length: options.length || 'medium',
      sharedContext: options.sharedContext || 
        'Avoid jargon, use correct grammar, focus on clarity, ' +
        'and ensure the user can grasp the content\'s purpose ' +
        'without needing to read the original.',
    };
    
    // Create summarizer with options
    const summarizer = await Summarizer.create(summaryOptions);
    
    // Generate summary
    const summaryText = await summarizer.summarize(text, {
      context: options.context || options.sharedContext,
      signal: options.signal
    });
    
    return summaryText;
    
  } catch (error) {
    console.error('Summarizer API error:', error);
    
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      throw new Error(
        `Content is too long for summarization. ` +
        `Maximum tokens: ${error.maxTokens || 'unknown'}, ` +
        `Requested: ${error.requestedTokens || 'unknown'}`
      );
    }
    
    throw error;
  }
}

/**
 * Generate summary with structured context
 * Follows Terra's pattern of passing title, subtitle, and content separately
 * 
 * @param {object} content - Content object
 * @param {string} content.title - Content title
 * @param {string} content.subtitle - Content subtitle (optional)
 * @param {string} content.body - Main content body
 * @param {object} options - Summary options
 * @returns {Promise<string>} Summary text
 */
export async function generateStructuredSummary(content, options = {}) {
  // Format content similar to Terra's implementation
  let formattedText = `Title: ${content.title}`;
  
  if (content.subtitle) {
    formattedText += `\n\nSubtitle: ${content.subtitle}`;
  }
  
  formattedText += `\n\nContent: ${content.body}`;
  
  // Generate summary
  return await generateSummary(formattedText, options);
}

/**
 * Generate article teaser (short engaging summary)
 * Following Terra's best practices from Chrome case study
 * Reference: https://developer.chrome.com/blog/summarizer-terra-brightsites
 * 
 * @param {string} text - Article text
 * @param {object} options - Additional options
 * @returns {Promise<string>} Teaser text
 */
export async function generateTeaser(text, options = {}) {
  // Terra's shared context approach: clear instructions for quality output
  return await generateSummary(text, {
    ...options,
    type: 'teaser',
    length: options.length || 'short',
    sharedContext: 
      'Avoid jargon, use correct grammar, focus on clarity, ' +
      'and ensure the user can grasp the article\'s purpose ' +
      'without needing to read the original content. ' +
      'Create an engaging teaser that encourages readers to explore more.'
  });
}

/**
 * Generate key points summary (bullet points)
 * @param {string} text - Article text
 * @param {object} options - Additional options
 * @returns {Promise<string>} Key points
 */
export async function generateKeyPoints(text, options = {}) {
  return await generateSummary(text, {
    ...options,
    type: 'key-points',
    format: 'markdown',
    length: options.length || 'medium',
    sharedContext:
      'Avoid jargon, use correct grammar, focus on clarity. ' +
      'Extract the most important points from the content as clear bullet points. ' +
      'Focus on actionable insights and key takeaways the user needs to know.'
  });
}

/**
 * Generate TL;DR summary
 * @param {string} text - Article text
 * @param {object} options - Additional options
 * @returns {Promise<string>} TL;DR summary
 */
export async function generateTLDR(text, options = {}) {
  return await generateSummary(text, {
    ...options,
    type: 'tl;dr',
    length: options.length || 'short',
    sharedContext:
      'Avoid jargon, use correct grammar, focus on clarity. ' +
      'Provide a very brief summary capturing the main point. ' +
      'Ensure the user can grasp the content\'s essence without reading the original.'
  });
}

/**
 * Generate headline
 * @param {string} text - Article text
 * @param {object} options - Additional options
 * @returns {Promise<string>} Headline
 */
export async function generateHeadline(text, options = {}) {
  return await generateSummary(text, {
    ...options,
    type: 'headline',
    length: options.length || 'short',
    sharedContext:
      'Avoid jargon, use correct grammar, focus on clarity. ' +
      'Create a compelling headline that captures the main story. ' +
      'Make it clear, concise, and engaging without being clickbait.'
  });
}

/**
 * Get summarizer input quota information
 * @returns {Promise<object>} Quota information
 */
export async function getSummarizerQuota() {
  try {
    const availability = await checkSummarizerAvailability();
    
    if (availability !== 'available') {
      return null;
    }
    
    // Create a temporary summarizer to check quota
    const summarizer = await Summarizer.create();
    
    return {
      maxTokens: summarizer.inputQuota || 'unknown',
      available: true
    };
  } catch (error) {
    console.error('Error getting summarizer quota:', error);
    return null;
  }
}

/**
 * Validate text length for summarization
 * @param {string} text - Text to validate
 * @returns {Promise<object>} Validation result
 */
export async function validateTextLength(text) {
  const quota = await getSummarizerQuota();
  
  if (!quota) {
    return {
      valid: false,
      reason: 'Cannot determine quota'
    };
  }
  
  // Rough estimation: 1 token ≈ 4 characters
  const estimatedTokens = Math.ceil(text.length / 4);
  
  if (quota.maxTokens !== 'unknown' && estimatedTokens > quota.maxTokens) {
    return {
      valid: false,
      reason: `Text too long. Estimated ${estimatedTokens} tokens, max ${quota.maxTokens}`,
      estimatedTokens,
      maxTokens: quota.maxTokens
    };
  }
  
  return {
    valid: true,
    estimatedTokens,
    maxTokens: quota.maxTokens
  };
}

/**
 * Smart summarization with automatic length adjustment
 * If content is too long, it will try shorter lengths
 * 
 * @param {string} text - Text to summarize
 * @param {object} options - Summary options
 * @returns {Promise<object>} Result with summary and metadata
 */
export async function smartSummarize(text, options = {}) {
  const lengths = ['short', 'medium', 'long'];
  const requestedLength = options.length || 'medium';
  const lengthsToTry = [requestedLength, ...lengths.filter(l => l !== requestedLength)];
  
  for (const length of lengthsToTry) {
    try {
      const summary = await generateSummary(text, {
        ...options,
        length
      });
      
      return {
        success: true,
        summary,
        length,
        adjustedLength: length !== requestedLength
      };
    } catch (error) {
      if (error.name === 'QuotaExceededError' && length !== 'short') {
        console.log(`Length ${length} exceeded quota, trying shorter...`);
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Unable to generate summary - content too long even for shortest length');
}


