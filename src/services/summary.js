/**
 * Summary Generation Service
 * Smart routing between Summarizer API (predefined types) and Prompt API (custom prompts)
 * 
 * Reference: 
 * - Summarizer API: https://developer.chrome.com/docs/ai/summarizer-api
 * - When to use which: https://developer.chrome.com/blog/summarizer-terra-brightsites
 */

import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Prompt API (for custom prompts)
import { generateSummary as generateAISummary } from '../api/ai.js';

// Summarizer API (for predefined types)
import {
  isSummarizerAvailable,
  generateTeaser,
  generateKeyPoints,
  generateTLDR,
  generateHeadline,
  generateSummary as generateSummarizerSummary
} from '../api/summarizer.js';

/**
 * Determine which API to use based on whether user has custom prompt
 * 
 * - Summarizer API: Use for standard summaries (teaser, key-points, tldr, headline)
 * - Prompt API: Use when user provides custom prompt
 * 
 * @param {string} customPrompt - User's custom prompt
 * @returns {string} 'summarizer' or 'prompt'
 */
function determineApi(customPrompt) {
  // If user has custom prompt, use Prompt API
  if (customPrompt && customPrompt.trim().length > 0) {
    return 'prompt';
  }
  
  // Otherwise, prefer Summarizer API (more specialized for summarization)
  return 'summarizer';
}

/**
 * Generate summary using the appropriate API
 * 
 * @param {object} params - Generation parameters
 * @param {string} params.title - Content title
 * @param {string} params.content - Content to summarize
 * @param {string} params.customPrompt - User's custom prompt (optional)
 * @param {string} params.contentType - Content type ('youtube' or 'webpage')
 * @param {number} params.temperature - AI temperature (for Prompt API)
 * @param {number} params.topK - AI top-K value (for Prompt API)
 * @param {string} params.summaryType - Summary type for Summarizer API: 'teaser', 'key-points', 'tldr', 'headline'
 * @param {string} params.summaryLength - Summary length: 'short', 'medium', 'long'
 * @returns {Promise<object>} Summary result (markdown and HTML)
 */
export async function generateSummary(params) {
  const {
    title,
    content,
    customPrompt = '',
    contentType = 'content',
    temperature,
    topK,
    summaryType = 'teaser',
    summaryLength = 'medium'
  } = params;
  
  const apiToUse = determineApi(customPrompt);
  let summaryMarkdown;
  
  if (apiToUse === 'summarizer') {
    // Use Summarizer API for standard summaries
    // Check availability
    const available = await isSummarizerAvailable();
    
    if (available) {
      // Format content following Terra's exact structure from Chrome case study
      // Reference: https://developer.chrome.com/blog/summarizer-terra-brightsites
      // Terra's format: "Title: X;\n\n Sub-title: Y;\n\n Article content: Z."
      const formattedContent = `Title: ${title};\n\n${params.subtitle ? `Sub-title: ${params.subtitle};\n\n` : ''}Article content: ${content}`;
      
      // Generate summary based on type
      try {
        switch (summaryType) {
          case 'teaser':
            summaryMarkdown = await generateTeaser(formattedContent, {
              length: summaryLength
            });
            break;
          case 'key-points':
            summaryMarkdown = await generateKeyPoints(formattedContent, {
              length: summaryLength
            });
            break;
          case 'tldr':
            summaryMarkdown = await generateTLDR(formattedContent, {
              length: summaryLength
            });
            break;
          case 'headline':
            summaryMarkdown = await generateHeadline(formattedContent, {
              length: summaryLength
            });
            break;
          default:
            // Default to teaser
            summaryMarkdown = await generateSummarizerSummary(formattedContent, {
              type: summaryType,
              length: summaryLength,
              format: 'markdown'
            });
        }
      } catch (error) {
        console.warn('Summarizer API failed, falling back to Prompt API:', error);
        // Fallback to Prompt API
        summaryMarkdown = await generateAISummary(
          title,
          content,
          customPrompt || `Generate a ${summaryType} summary`,
          contentType,
          { temperature, topK }
        );
      }
    } else {
      console.warn('Summarizer API not available, using Prompt API');
      // Fallback to Prompt API
      summaryMarkdown = await generateAISummary(
        title,
        content,
        customPrompt || `Generate a ${summaryType} summary`,
        contentType,
        { temperature, topK }
      );
    }
  } else {
    // Use Prompt API for custom prompts
    summaryMarkdown = await generateAISummary(
      title,
      content,
      customPrompt,
      contentType,
      { temperature, topK }
    );
  }
  
  // Convert markdown to HTML
  const summaryHtml = marked.parse(summaryMarkdown);
  
  // Sanitize HTML (security)
  const sanitizedHtml = DOMPurify.sanitize(summaryHtml);
  
  return {
    markdown: summaryMarkdown,
    html: sanitizedHtml,
    apiUsed: apiToUse
  };
}

/**
 * Generate standard summary (uses Summarizer API)
 * This is a convenience function for generating standard summaries
 * 
 * @param {string} title - Content title
 * @param {string} content - Content to summarize
 * @param {string} type - Summary type: 'teaser', 'key-points', 'tldr', 'headline'
 * @param {string} length - Summary length: 'short', 'medium', 'long'
 * @returns {Promise<object>} Summary result
 */
export async function generateStandardSummary(title, content, type = 'teaser', length = 'medium') {
  return await generateSummary({
    title,
    content,
    customPrompt: '', // No custom prompt = use Summarizer API
    summaryType: type,
    summaryLength: length
  });
}

/**
 * Generate custom summary (uses Prompt API)
 * This is a convenience function for generating custom summaries
 * 
 * @param {string} title - Content title
 * @param {string} content - Content to summarize
 * @param {string} customPrompt - User's custom prompt
 * @param {object} aiParams - AI parameters (temperature, topK)
 * @returns {Promise<object>} Summary result
 */
export async function generateCustomSummary(title, content, customPrompt, aiParams = {}) {
  return await generateSummary({
    title,
    content,
    customPrompt,
    temperature: aiParams.temperature,
    topK: aiParams.topK
  });
}

/**
 * Prepare content for summarization
 * Following Terra's approach from Chrome case study:
 * https://developer.chrome.com/blog/summarizer-terra-brightsites
 * 
 * Terra structures content as: "Title: X; Subtitle: Y; Article content: Z"
 * 
 * @param {object} videoData - Video or webpage data
 * @param {string} contentType - Content type ('youtube' or 'webpage')
 * @param {boolean} includeDescription - Include description
 * @param {boolean} includeCaptions - Include captions (YouTube only)
 * @returns {object} Prepared content { title, subtitle, content }
 */
export function prepareContent(videoData, contentType, includeDescription = true, includeCaptions = false) {
  let title, subtitle, content;
  
  if (contentType === 'youtube') {
    title = videoData?.snippet?.title || 'YouTube Video';
    subtitle = videoData?.snippet?.channelTitle || '';
    content = '';
    
    if (includeDescription) {
      content += videoData?.snippet?.description || '';
    }
    
    if (includeCaptions && videoData?.captions) {
      if (content) content += '\n\n';
      content += videoData.captions;
    }
  } else {
    // Webpage
    title = videoData?.title || 'Web Page';
    subtitle = videoData?.subtitle || videoData?.excerpt || '';
    content = videoData?.content || videoData?.description || '';
  }
  
  return { title, subtitle, content };
}

/**
 * Parse markdown to HTML
 * @param {string} markdown - Markdown text
 * @returns {string} HTML
 */
export function markdownToHtml(markdown) {
  return marked.parse(markdown);
}

/**
 * Sanitize HTML content
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html);
}

/**
 * Format summary for display
 * @param {string} summaryMarkdown - Summary in markdown
 * @returns {string} Formatted HTML
 */
export function formatSummaryForDisplay(summaryMarkdown) {
  const html = markdownToHtml(summaryMarkdown);
  return sanitizeHtml(html);
}

/**
 * Get available summary types for Summarizer API
 * @returns {Array<object>} Available types with descriptions
 */
export function getAvailableSummaryTypes() {
  return [
    {
      value: 'teaser',
      label: 'Teaser',
      description: 'Engaging summary to draw readers in',
      lengths: {
        short: '1 sentence',
        medium: '3 sentences',
        long: '5 sentences'
      }
    },
    {
      value: 'key-points',
      label: 'Key Points',
      description: 'Bullet list of important points',
      lengths: {
        short: '3 bullet points',
        medium: '5 bullet points',
        long: '7 bullet points'
      }
    },
    {
      value: 'tldr',
      label: 'TL;DR',
      description: 'Quick overview for busy readers',
      lengths: {
        short: '1 sentence',
        medium: '3 sentences',
        long: '5 sentences'
      }
    },
    {
      value: 'headline',
      label: 'Headline',
      description: 'Concise article headline',
      lengths: {
        short: '12 words',
        medium: '17 words',
        long: '22 words'
      }
    }
  ];
}
