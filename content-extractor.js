// Enhanced content extractor for web pages
// Focuses on extracting ONLY main article content, filtering out noise
// Based on best practices from Terra, Mozilla Readability, and Chrome Summarizer API

(async function() {
  
  // ============= CONFIGURATION =============
  
  const CONFIG = {
    MAX_CONTENT_LENGTH: 20000,
    SCROLL_WAIT_TIME: 200,
    MAX_SCROLL_ATTEMPTS: 3,
    MIN_CONTENT_LENGTH: 300,
    MIN_IMAGE_WIDTH: 200,
    MIN_IMAGE_HEIGHT: 100,
    // Minimum content density score to consider as main content
    MIN_CONTENT_DENSITY: 0.3,
    // Minimum link density (high link density = navigation/sidebar)
    MAX_LINK_DENSITY: 0.5
  };
  
  // ============= DYNAMIC CONTENT LOADING =============
  
  /**
   * Wait for dynamic content to load by scrolling the page
   * This triggers lazy-loaded content and infinite scroll
   */
  async function waitForDynamicContent() {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const checkContent = () => {
        attempts++;
        
        // Trigger lazy loading by scrolling to different positions
        if (attempts === 1) {
          window.scrollTo(0, document.body.scrollHeight);
        } else if (attempts === 2) {
          window.scrollTo(0, document.body.scrollHeight / 2);
        } else {
          window.scrollTo(0, 0);
          resolve();
        }
        
        if (attempts < CONFIG.MAX_SCROLL_ATTEMPTS) {
          setTimeout(checkContent, CONFIG.SCROLL_WAIT_TIME);
        } else {
          resolve();
        }
      };
      
      checkContent();
    });
  }

  // Wait for content to load
  await waitForDynamicContent();

  // ============= RESULT STRUCTURE =============
  
  const result = {
    type: 'webpage',
    url: window.location.href,
    title: '',
    subtitle: '',
    content: '',
    image: '',
    author: '',
    publishDate: '',
    modifiedDate: '',
    description: '',
    excerpt: '',
    tags: [],
    categories: [],
    language: '',
    readingTime: 0,
    wordCount: 0,
    structuredData: null
  };

  // ============= UTILITY FUNCTIONS =============
  
  /**
   * Get meta tag content by selector
   */
  const getMeta = (selector) => {
    const el = document.querySelector(selector);
    return el?.content || el?.textContent?.trim() || '';
  };
  
  /**
   * Get attribute from element
   */
  const getAttr = (selector, attr) => {
    const el = document.querySelector(selector);
    return el?.getAttribute(attr) || '';
  };
  
  /**
   * Calculate link density of an element (high = navigation/spam)
   * Link density = (text in links) / (total text)
   */
  function calculateLinkDensity(element) {
    const textLength = (element.textContent || '').length;
    if (textLength === 0) return 1;
    
    const links = element.querySelectorAll('a');
    let linkLength = 0;
    links.forEach(link => {
      linkLength += (link.textContent || '').length;
    });
    
    return linkLength / textLength;
  }
  
  /**
   * Calculate content density (paragraphs + text vs structural elements)
   * High density = likely main content
   */
  function calculateContentDensity(element) {
    const text = (element.textContent || '').trim();
    if (!text) return 0;
    
    const paragraphs = element.querySelectorAll('p');
    const textLength = text.length;
    const structuralElements = element.querySelectorAll('div, span, table, ul, ol').length;
    
    // More paragraphs and text = higher density
    // More structural divs = lower density
    const density = (paragraphs.length * 100 + textLength) / (structuralElements + 1);
    
    return density;
  }
  
  /**
   * Check if element is likely navigation, sidebar, or other noise
   */
  function isNoiseElement(element) {
    const className = (element.className || '').toLowerCase();
    const id = (element.id || '').toLowerCase();
    const role = (element.getAttribute('role') || '').toLowerCase();
    
    // Explicit noise patterns
    const noisePatterns = [
      // Navigation
      'nav', 'navigation', 'navbar', 'menu', 'sidebar', 'side-bar',
      // Meta content
      'header', 'footer', 'breadcrumb', 'meta', 'byline',
      // Ads & promotional
      'ad', 'ads', 'advertisement', 'promo', 'promotion', 'sponsor',
      // Social & sharing
      'social', 'share', 'sharing', 'follow',
      // Comments & related
      'comment', 'discussion', 'related', 'recommend', 'suggestion',
      // UI chrome
      'popup', 'modal', 'overlay', 'tooltip', 'dropdown',
      // Newsletter/subscription
      'newsletter', 'subscribe', 'subscription', 'signup',
      // Misc
      'widget', 'plugin', 'banner'
    ];
    
    // Check if any noise pattern matches
    const hasNoisePattern = noisePatterns.some(pattern => 
      className.includes(pattern) || 
      id.includes(pattern) ||
      role.includes(pattern)
    );
    
    if (hasNoisePattern) return true;
    
    // Check ARIA attributes
    if (element.getAttribute('aria-hidden') === 'true') return true;
    if (['navigation', 'banner', 'complementary'].includes(role)) return true;
    
    // Check if element is hidden
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
    
    return false;
  }
  
  /**
   * Parse JSON-LD structured data
   * Many modern websites use this for rich metadata
   */
  function extractStructuredData() {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent);
          
          // Handle both single objects and arrays
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            // Look for Article, NewsArticle, BlogPosting schemas
            if (item['@type'] && 
                ['Article', 'NewsArticle', 'BlogPosting', 'ScholarlyArticle'].includes(item['@type'])) {
              return item;
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.warn('Error parsing structured data:', error);
    }
    return null;
  }
  
  /**
   * Estimate reading time in minutes
   */
  function estimateReadingTime(text) {
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
  
  /**
   * Detect language from meta tags or HTML lang attribute
   */
  function detectLanguage() {
    return getMeta('meta[property="og:locale"]') ||
           getMeta('meta[http-equiv="content-language"]') ||
           document.documentElement.lang ||
           'en';
  }

  // ============= STRUCTURED DATA EXTRACTION =============
  
  result.structuredData = extractStructuredData();
  
  // Extract from structured data if available (most reliable)
  if (result.structuredData) {
    result.title = result.structuredData.headline || result.title;
    result.author = result.structuredData.author?.name || 
                   result.structuredData.author || 
                   result.author;
    result.publishDate = result.structuredData.datePublished || result.publishDate;
    result.modifiedDate = result.structuredData.dateModified || result.modifiedDate;
    result.description = result.structuredData.description || result.description;
    
    if (result.structuredData.image) {
      if (typeof result.structuredData.image === 'string') {
        result.image = result.structuredData.image;
      } else if (result.structuredData.image.url) {
        result.image = result.structuredData.image.url;
      } else if (Array.isArray(result.structuredData.image) && result.structuredData.image[0]) {
        result.image = result.structuredData.image[0].url || result.structuredData.image[0];
      }
    }
  }

  // ============= META TAG EXTRACTION =============
  
  // Title extraction (multiple fallbacks)
  if (!result.title) {
    result.title = getMeta('meta[property="og:title"]') ||
                   getMeta('meta[name="twitter:title"]') ||
                   getMeta('meta[name="title"]') ||
                   getMeta('meta[property="article:title"]') ||
                   document.querySelector('h1')?.textContent?.trim() ||
                   document.querySelector('title')?.textContent?.trim() ||
                   document.title ||
                   'Web Page';
  }
  
  // Subtitle extraction (common in news articles)
  result.subtitle = getMeta('meta[property="og:description"]')?.substring(0, 200) ||
                   document.querySelector('h2.subtitle')?.textContent?.trim() ||
                   document.querySelector('.article-subtitle')?.textContent?.trim() ||
                   document.querySelector('[class*="subhead"]')?.textContent?.trim() ||
                   '';
  
  // Image extraction
  if (!result.image) {
    result.image = getMeta('meta[property="og:image"]') ||
                   getMeta('meta[name="twitter:image"]') ||
                   getMeta('meta[name="image"]') ||
                   getAttr('link[rel="image_src"]', 'href');
  }
  
  // Description extraction
  if (!result.description) {
    result.description = getMeta('meta[property="og:description"]') ||
                        getMeta('meta[name="twitter:description"]') ||
                        getMeta('meta[name="description"]') ||
                        '';
  }
  
  // Author extraction (multiple sources)
  if (!result.author) {
    result.author = getMeta('meta[name="author"]') ||
                   getMeta('meta[property="article:author"]') ||
                   getMeta('meta[name="twitter:creator"]') ||
                   document.querySelector('[rel="author"]')?.textContent?.trim() ||
                   document.querySelector('.author-name')?.textContent?.trim() ||
                   document.querySelector('[class*="author"]')?.textContent?.trim() ||
                   document.querySelector('[itemprop="author"]')?.textContent?.trim() ||
                   '';
  }
  
  // Date extraction
  if (!result.publishDate) {
    result.publishDate = getMeta('meta[property="article:published_time"]') ||
                        getMeta('meta[name="publication_date"]') ||
                        getMeta('meta[name="date"]') ||
                        getAttr('time[datetime]', 'datetime') ||
                        document.querySelector('time')?.textContent?.trim() ||
                        '';
  }
  
  if (!result.modifiedDate) {
    result.modifiedDate = getMeta('meta[property="article:modified_time"]') ||
                         getMeta('meta[name="last-modified"]') ||
                         '';
  }
  
  // Language detection
  result.language = detectLanguage();
  
  // Tags and categories (common in CMS systems)
  const tagElements = document.querySelectorAll('[rel="tag"], .tag, .article-tag, [class*="tag"]');
  result.tags = Array.from(tagElements)
    .map(el => el.textContent.trim())
    .filter(tag => tag.length > 0 && tag.length < 50)
    .slice(0, 10); // Limit to 10 tags
  
  const categoryElements = document.querySelectorAll('[rel="category"], .category, .article-category');
  result.categories = Array.from(categoryElements)
    .map(el => el.textContent.trim())
    .filter(cat => cat.length > 0 && cat.length < 50)
    .slice(0, 5); // Limit to 5 categories

  // ============= INTELLIGENT IMAGE SELECTION =============
  
  if (!result.image) {
    // Find the best hero/feature image
    const candidateImages = Array.from(document.querySelectorAll('img[src]'))
      .filter(img => {
        if (!img.src || img.src.startsWith('data:')) return false;
        
        const src = img.src.toLowerCase();
        const alt = (img.alt || '').toLowerCase();
        const className = (img.className || '').toLowerCase();
        const parentClass = (img.parentElement?.className || '').toLowerCase();
        
        // Exclude icons, logos, avatars, ads
        const excludeKeywords = ['icon', 'logo', 'avatar', 'ad', 'banner', 'button', 'emoji', 'sprite'];
        if (excludeKeywords.some(kw => 
          src.includes(kw) || 
          className.includes(kw) || 
          parentClass.includes(kw)
        )) {
          return false;
        }
        
        // Prefer images with certain class names (feature/hero images)
        const preferredKeywords = ['feature', 'hero', 'main', 'article', 'post', 'content'];
        const hasPreferredClass = preferredKeywords.some(kw => 
          className.includes(kw) || parentClass.includes(kw)
        );
        
        // Must have reasonable dimensions
        const width = img.naturalWidth || img.width || 0;
        const height = img.naturalHeight || img.height || 0;
        
        if (width < CONFIG.MIN_IMAGE_WIDTH || height < CONFIG.MIN_IMAGE_HEIGHT) {
          return false;
        }
        
        // Boost score for preferred images
        img.dataset.score = hasPreferredClass ? 1000 : 0;
        
        return true;
      })
      .map(img => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const area = width * height;
        const score = area + parseInt(img.dataset.score || 0);
        
        return { src: img.src, width, height, area, score };
      })
      .sort((a, b) => b.score - a.score);
    
    if (candidateImages.length > 0) {
      result.image = candidateImages[0].src;
    }
  }

  // ============= ADVANCED MAIN CONTENT EXTRACTION =============
  
  /**
   * Find main content container using multiple strategies
   * Enhanced with content density and link density checks
   */
  function findMainContent() {
    let mainElement = null;
    let bestScore = 0;
    
    // Strategy 1: Try semantic HTML and common selectors (MOST RELIABLE)
    const mainSelectors = [
      'article[role="article"]',
      'article.article',
      'article.post',
      '[role="article"]',
      '[role="main"] article',
      'main article',
      '[itemtype*="Article"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.article-body',
      '.post-body',
      '.content-body',
      'article',
      'main',
      '[role="main"]',
      '.main-content',
      '#article',
      '#post',
      '#content article',
      '.markdown-body', // GitHub
      '.wiki-content', // Confluence
      '.mw-parser-output', // MediaWiki
    ];
    
    for (const selector of mainSelectors) {
      const el = document.querySelector(selector);
      if (el && !isNoiseElement(el)) {
        const textLength = (el.innerText || '').length;
        const linkDensity = calculateLinkDensity(el);
        const contentDensity = calculateContentDensity(el);
        
        // Must have sufficient content and low link density
        if (textLength > CONFIG.MIN_CONTENT_LENGTH && 
            linkDensity < CONFIG.MAX_LINK_DENSITY &&
            contentDensity > CONFIG.MIN_CONTENT_DENSITY) {
          mainElement = el;
          console.log(`✅ Found main content via semantic selector: ${selector}`);
          console.log(`   Text: ${textLength} chars, Link Density: ${linkDensity.toFixed(2)}, Content Density: ${contentDensity.toFixed(2)}`);
          break;
        }
      }
    }
    
    // Strategy 2: Advanced scoring with content quality metrics
    if (!mainElement) {
      console.log('🔍 Semantic selectors failed, using advanced scoring...');
      const containers = Array.from(document.querySelectorAll('div, section, main, article, [role="main"]'));
      
      containers.forEach(container => {
        // Skip if it's noise
        if (isNoiseElement(container)) return;
        
        const text = container.innerText || '';
        const textLength = text.length;
        
        // Skip if too short
        if (textLength < CONFIG.MIN_CONTENT_LENGTH) return;
        
        // Calculate quality metrics
        const paragraphs = container.querySelectorAll('p');
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const lists = container.querySelectorAll('ul, ol');
        const links = container.querySelectorAll('a');
        
        const linkDensity = calculateLinkDensity(container);
        const contentDensity = calculateContentDensity(container);
        
        // Skip high link density (navigation/spam)
        if (linkDensity > CONFIG.MAX_LINK_DENSITY) return;
        
        // Skip low content density (too many divs, not enough text)
        if (contentDensity < CONFIG.MIN_CONTENT_DENSITY) return;
        
        // Calculate comprehensive score
        const score = 
          (paragraphs.length * 100) +      // Paragraphs are good
          (headings.length * 50) +         // Headings indicate structure
          (lists.length * 30) +            // Lists are content
          (textLength * 0.5) +             // More text is better
          (contentDensity * 10) -          // Higher density is better
          (linkDensity * 500) -            // Lower link density is better
          (links.length * 5);              // Too many links is bad
        
        if (score > bestScore) {
          bestScore = score;
          mainElement = container;
          console.log(`📊 New best score: ${score.toFixed(0)} - ${textLength} chars, ${paragraphs.length} paragraphs`);
          console.log(`   Link Density: ${linkDensity.toFixed(2)}, Content Density: ${contentDensity.toFixed(2)}`);
        }
      });
      
      if (mainElement) {
        console.log(`✅ Found main content via scoring (score: ${bestScore.toFixed(0)})`);
      }
    }
    
    return mainElement;
  }

  /**
   * Extract structured text with hierarchy
   * Removes ALL noise elements for clean content
   */
  function extractStructuredText(element) {
    if (!element) return '';
    
    const clone = element.cloneNode(true);
    
    // Remove unwanted elements (COMPREHENSIVE list)
    const removeSelectors = [
      // Scripts and styles
      'script', 'style', 'noscript', 'iframe', 'object', 'embed', 'svg',
      // Page structure
      'nav', 'header', 'footer', 'aside',
      // Forms and inputs
      'button', 'form', 'input', 'select', 'textarea',
      // Ads (exhaustive list)
      '.ad', '.ads', '.advertisement', '.adsbygoogle', 
      '[class*="ad-"]', '[id*="ad-"]', '[class*="advert"]',
      '.sponsored', '.sponsor', '[data-ad]',
      // Sidebars and widgets
      '.sidebar', '.widget', '.menu', '.navigation', '.nav', '.navbar',
      '[class*="sidebar"]', '[id*="sidebar"]',
      // Comments
      '.comments', '.comment-section', '.comment-list', '.comment-form',
      '[id*="comment"]', '[class*="comment"]', '[id*="disqus"]',
      // Social and sharing
      '.social', '.share', '.sharing', '.social-share',
      '[class*="social"]', '[class*="share"]',
      // Related content
      '.related', '.recommended', '.more-posts', '.related-posts', 
      '.suggestions', '[class*="related"]', '[class*="recommend"]',
      // Popups and modals
      '.popup', '.modal', '.overlay', '.lightbox',
      '[class*="popup"]', '[class*="modal"]',
      // Hidden elements
      '[aria-hidden="true"]', '[style*="display: none"]', '[style*="visibility: hidden"]',
      // Newsletter/subscription
      '.newsletter', '.subscription', '.subscribe', '.signup',
      '[class*="newsletter"]', '[class*="subscri"]',
      // Breadcrumbs and meta
      '.breadcrumb', '.breadcrumbs', '.meta', '.post-meta', '.article-meta',
      // Author bio (if separate from article)
      '.author-bio', '.about-author',
      // Tags and categories (often noisy)
      '.tags', '.categories', '[class*="tag-"]',
      // Video players (keep description text, remove player)
      '.video-player', '[class*="video-js"]',
      // Captions and credits for media
      'figcaption', '.caption', '.credit',
    ];
    
    removeSelectors.forEach(selector => {
      try {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      } catch (e) {
        // Ignore invalid selectors
      }
    });

    // Build structured content with proper formatting
    const parts = [];
    
    // Walk through the DOM tree
    const walker = document.createTreeWalker(
      clone,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const tag = node.tagName?.toLowerCase();
          
          // Accept content-bearing elements
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre', 'code'].includes(tag)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    const processedElements = new Set();
    let currentNode;
    
    while (currentNode = walker.nextNode()) {
      if (processedElements.has(currentNode)) continue;
      
      const tag = currentNode.tagName.toLowerCase();
      const text = currentNode.textContent.trim();
      
      if (!text || text.length < 10) continue;
      
      // Check if text is already captured by a child element
      let hasTextInChild = false;
      for (const child of currentNode.children) {
        if (processedElements.has(child)) {
          hasTextInChild = true;
          break;
        }
      }
      
      if (!hasTextInChild) {
        // Get direct text content (not from children)
        let directText = '';
        for (const child of currentNode.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            directText += child.textContent;
          }
        }
        
        const cleanDirectText = directText.trim();
        
        if (cleanDirectText.length > 10) {
          // Format based on element type
          if (tag.match(/^h[1-6]$/)) {
            parts.push('\n## ' + cleanDirectText + '\n');
          } else if (tag === 'li') {
            parts.push('• ' + cleanDirectText);
          } else if (tag === 'blockquote') {
            parts.push('> ' + cleanDirectText);
          } else if (tag === 'pre' || tag === 'code') {
            parts.push('```\n' + cleanDirectText + '\n```');
          } else if (tag === 'p') {
            parts.push(cleanDirectText);
          }
          
          processedElements.add(currentNode);
        }
      }
    }

    // Fallback to simple text extraction if structured approach didn't work
    if (parts.length === 0) {
      return clone.innerText || clone.textContent || '';
    }

    return parts.join('\n\n');
  }

  /**
   * Clean and normalize text
   */
  function cleanText(text) {
    return text
      .replace(/\n\s*\n\s*\n+/g, '\n\n')          // Max 2 consecutive line breaks
      .replace(/[ \t]+/g, ' ')                      // Normalize spaces
      .replace(/\n[ \t]+/g, '\n')                   // Remove leading spaces on new lines
      .replace(/\s+([,.!?;:])/g, '$1')              // Fix punctuation spacing
      .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1 $2')  // Fix sentence breaks
      .trim()
      .substring(0, CONFIG.MAX_CONTENT_LENGTH);     // Limit to max length
  }

  // ============= MAIN CONTENT EXTRACTION =============
  
  console.log('🔍 Starting main content extraction...');
  const mainElement = findMainContent();
  
  if (mainElement) {
    console.log('✅ Main content element found, extracting text...');
    result.content = extractStructuredText(mainElement);
  } else {
    console.warn('⚠️  No main content element found, using fallback...');
    // Fallback: Get all visible text (risky but better than nothing)
    result.content = document.body.innerText || document.body.textContent || '';
  }

  // Clean and normalize content
  result.content = cleanText(result.content);
  
  // Calculate statistics
  result.wordCount = result.content.split(/\s+/).filter(w => w.length > 0).length;
  result.readingTime = estimateReadingTime(result.content);
  
  console.log(`📊 Extracted ${result.wordCount} words (${result.readingTime} min read)`);
  
  // Create excerpt if not available
  if (!result.excerpt && result.content) {
    result.excerpt = result.content
      .substring(0, 300)
      .replace(/\s+\S*$/, '') + '...'; // Don't cut words
  }

  // ============= QUALITY VALIDATION =============
  
  // Validate that we extracted meaningful content
  const hasValidContent = result.content.length >= CONFIG.MIN_CONTENT_LENGTH;
  const hasTitle = result.title && result.title !== 'Web Page';
  
  if (!hasValidContent) {
    console.warn('⚠️  Content extraction may be incomplete - content too short');
  } else {
    console.log('✅ Content extraction successful!');
  }
  
  if (!hasTitle) {
    console.warn('⚠️  Could not extract a meaningful title');
  }

  // Return the extracted content
  return result;

})();

