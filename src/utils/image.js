/**
 * Image Utility Functions
 */

/**
 * Convert image URL to data URL to avoid CORS issues
 * @param {string} url - Image URL
 * @returns {Promise<string>} Data URL
 */
export async function convertImageToDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Prepare images in element for export by converting to data URLs
 * @param {HTMLElement} element - Element containing images
 * @returns {Promise<Function>} Cleanup function to restore original URLs
 */
export async function prepareImagesForExport(element) {
  const images = element.querySelectorAll('img');
  const originalSources = new Map();
  
  for (const img of images) {
    if (img.src && !img.src.startsWith('data:')) {
      originalSources.set(img, img.src);
      
      try {
        // Try to convert to data URL
        const dataUrl = await convertImageToDataUrl(img.src);
        img.src = dataUrl;
      } catch (error) {
        console.warn('Could not convert image, using fallback:', error);
        // Use local fallback icon
        img.src = '../images/icon128.png';
      }
    }
  }
  
  // Return cleanup function
  return () => {
    originalSources.forEach((originalSrc, img) => {
      img.src = originalSrc;
    });
  };
}

