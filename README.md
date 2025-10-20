# SnapSummary ⚡

**AI-Powered Content Summaries for YouTube Videos & Web Articles**

SnapSummary is a Chrome extension that leverages Chrome's built-in AI APIs to generate intelligent summaries of YouTube videos and web articles. Create beautiful, shareable summary cards with just a few clicks.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-green)
![Chrome](https://img.shields.io/badge/Chrome-138%2B-yellow)

## ✨ Features

### Core Functionality
- 🎯 **Auto-Detect**: Automatically detect YouTube videos and web articles from the current tab
- 🤖 **AI-Powered Summarization**: Multiple AI engines powered by Chrome's native APIs
  - **Summarizer API**: Fast, structured summaries (teasers, key points, TL;DR, headlines)
  - **Prompt API**: Flexible custom prompts for tailored summaries
- 📄 **Multi-Source Support**: Works with YouTube videos and any web article/blog post
- 🎨 **Beautiful Summary Cards**: Export professional-looking summary cards as images

### Smart Features
- 🌍 **Multi-Language Translation**: Translate summaries into 11+ languages using Chrome's Translator API
- 📝 **Editable Summaries**: Click to edit any part of the generated summary
- 💾 **Save & History**: Save your favorite summaries and access them later
- 🔗 **Social Sharing**: Share to Twitter/X, LinkedIn, Reddit, or Email
- ⚙️ **Customizable AI Settings**: Adjust temperature and top-k parameters for fine-tuned results

### Advanced Options
- 📋 **Summary Types**:
  - **Teaser**: Engaging 1-5 sentence overview
  - **Key Points**: Structured bullet list (3-7 points)
  - **TL;DR**: Quick summary (1-5 sentences)
  - **Headline**: Concise title (12-22 words)
- 📏 **Length Control**: Short, Medium, or Long summaries
- ✨ **Custom Prompts**: Override defaults with your own instructions
- 🎛️ **AI Parameter Control**: Temperature (0-2) and Top-K (1-8) settings

## 🏗️ Architecture

SnapSummary follows a clean, modular architecture:

```
src/
├── main.js                 # Application entry point
├── api/
│   ├── ai.js              # Prompt API integration
│   ├── summarizer.js      # Summarizer API (Chrome built-in)
│   ├── youtube.js         # YouTube Data API
├── config/
│   └── constants.js       # App constants and messages
├── services/
│   ├── content-extractor.js  # Web content extraction
│   ├── export.js          # Card export & sharing
│   ├── summary.js         # Summary generation logic
│   └── translation.js     # Translation service
├── ui/
│   ├── display.js         # UI rendering
│   └── status.js          # Status messages
└── utils/
    ├── card.js            # Card utilities
    ├── chrome-storage.js  # Chrome storage wrapper
    ├── dom.js             # DOM helpers
    ├── image.js           # Image processing
    ├── storage.js         # Local storage
    ├── url.js             # URL parsing
    └── validation.js      # Input validation
```

### Key Technologies
- **Chrome APIs**: Built-in AI (Summarizer, Prompt, Translator), Storage, Tabs, Scripting
- **Rollup**: Modern JavaScript bundling
- **DOMPurify**: XSS protection for rendered content
- **Marked**: Markdown parsing for AI responses
- **html-to-image**: High-quality card image export

## 🚀 Installation

### Prerequisites
- **Chrome 138+** (Canary, Dev, or Beta channel recommended)
- Chrome AI features enabled (see below)

### Enable Chrome AI Features

1. Open Chrome and navigate to:
   ```
   chrome://flags/#optimization-guide-on-device-model
   ```
   Set to **Enabled**

2. Navigate to:
   ```
   chrome://flags/#prompt-api-for-gemini-nano
   ```
   Set to **Enabled**

3. Navigate to:
   ```
   chrome://flags/#summarization-api-for-gemini-nano
   ```
   Set to **Enabled**

4. Navigate to:
   ```
   chrome://flags/#translation-api
   ```
   Set to **Enabled**

5. **Restart Chrome**

6. Download AI models (automatic on first use, or manual):
   ```
   chrome://components/
   ```
   Find **Optimization Guide On Device Model** and click **Check for update**

### Install the Extension

#### Option 1: Load Unpacked (Development)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yourusername/SnapSummary.git
   cd SnapSummary
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

4. Build the extension:
   ```bash
   npm run build
   ```

5. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

6. Enable **Developer mode** (toggle in top-right corner)

7. Click **Load unpacked**

8. Select the `dist` folder from the project directory

9. The extension is now installed! Click the SnapSummary icon in your toolbar.

#### Option 2: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store soon.

## 📖 Usage

### Quick Start

1. **Navigate** to any YouTube video or article webpage
2. **Click** the SnapSummary icon in your Chrome toolbar
3. **Click** the 🎯 Auto-Detect button (or paste URL manually)
4. **Review** the extracted content
5. **Click** "Generate Summary"
6. **Edit** the summary card if needed (all fields are editable)
7. **Download** as an image, **Save** to history, or **Share** on social media

### Advanced Usage

#### Custom Prompts
Instead of using preset summary types, enter your own instructions:
```
Summarize this video in 3 bullet points, focusing on actionable takeaways
```

#### AI Parameter Tuning
- **Temperature** (0-2):
  - `0`: Focused, deterministic
  - `0.8`: Balanced (default)
  - `2`: Creative, varied
- **Top-K** (1-8):
  - Lower: More focused word choices
  - Higher: More diverse vocabulary

#### Translation
1. Generate a summary
2. Click **Translate Card**
3. Select target language
4. Click **Translate Now**
5. Use **Restore Original** to revert

#### History Management
1. Click **History** tab
2. View all saved summaries
3. Click **View** to re-open a card
4. Click **Delete** to remove
5. Click **Clear All** to reset history

## 🧪 Development

### Project Structure
```
SnapSummary/
├── dist/              # Built extension (generated)
├── src/               # Source code
├── sidepanel/         # UI files (HTML, CSS)
├── images/            # Extension icons
├── manifest.json      # Extension manifest
├── background.js      # Background service worker
├── rollup.config.mjs  # Build configuration
└── package.json       # Dependencies
```

### Build Commands
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch mode (rebuild on changes) - requires adding to package.json
npm run watch
```

### Adding New Features

1. **API Services**: Add to `src/api/`
2. **Business Logic**: Add to `src/services/`
3. **UI Components**: Add to `src/ui/`
4. **Utilities**: Add to `src/utils/`
5. **Update**: `src/main.js` to integrate

## 🔑 API Keys & Security Strategy

### YouTube Data API Setup

This extension uses a **smart approach** to balance ease-of-use with security:

✅ **For Users**: Works immediately, no setup required  
✅ **For You**: API key stays private in your repository  
✅ **For Distribution**: Key is included in the built extension  

#### How It Works

```
📁 GitHub Repository (Public)
├── src/config/api-keys.js ❌ (gitignored - your private key)
├── config.example.js ✅ (template for contributors)
└── README.md ✅ (instructions)

📦 Built Extension (Distributed)
└── dist/ ✅ (includes the key - ready to use!)
```

#### Setup Instructions

1. **Create your API key file:**
   ```bash
   cp config.example.js src/config/api-keys.js
   ```

2. **Add your YouTube API key:**
   Edit `src/config/api-keys.js`:
   ```javascript
   export const API_KEYS = {
     YOUTUBE_API_KEY: 'YOUR_KEY_HERE'  // Your actual key
   };
   ```
   
   **Get a key from**: [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project → Enable **YouTube Data API v3** → Create API Key

3. **Build the extension:**
   ```bash
   npm run build
   ```
   
   The `dist/` folder now contains your key (ready for distribution!)

#### Distribution Strategy

**✅ Safe Approach:**

1. **GitHub**: Push your code (api-keys.js is gitignored ✓)
2. **Chrome Web Store**: Upload the `dist/` folder (includes key ✓)
3. **Users**: Download and use immediately (no setup needed ✓)

**Your key is:**
- ❌ **NOT** in your public GitHub repo
- ✅ **IS** in the distributed extension
- ✅ Protected by daily quota (10,000 units = ~2,000-3,000 video fetches)

#### Quota Management

**How it works:**

1. **Shared API Key**: All users share a single YouTube API key
2. **Daily Quota**: 10,000 units/day (≈2,000-3,000 video fetches)
3. **If Exceeded**: Extension shows friendly error, resets at midnight Pacific Time
4. **Alternative**: Extension works great with web articles (no API key needed!)

**Typical Usage:**
- 1 video fetch = ~3-5 quota units
- 10,000 units = plenty for casual daily use
- Quota resets daily at midnight PT

**If Quota Runs Out:**
```
⏰ Daily quota exceeded (resets at midnight Pacific Time).
The extension is free to use with a shared API key.
Try again tomorrow, or the extension works great with web articles! 🌐
```

**Monitor Your Usage:**
- [Google Cloud Console](https://console.cloud.google.com/apis/dashboard)
- Set up alerts if needed
- View daily/monthly usage charts

**Pro Tip**: The extension's AI summarization works brilliantly on web articles without using any YouTube quota! 🎯

**🔒 Security**: Your key is gitignored but included in builds. This is the **standard approach** for free Chrome extensions with shared API keys.

## 🌟 Chrome AI APIs Used

This extension showcases Chrome's cutting-edge on-device AI capabilities:

### 1. **Summarizer API**
- Fast, structured summarization
- Multiple output formats (teaser, key-points, tl;dr, headline)
- Length control (short, medium, long)
- Reference: [Chrome for Developers - Summarizer API](https://developer.chrome.com/blog/summarizer-terra-brightsites)

### 2. **Prompt API (Gemini Nano)**
- Flexible custom prompting
- Context-aware responses
- Temperature and Top-K control
- Reference: [Chrome for Developers - Prompt API](https://developer.chrome.com/docs/ai/built-in)

### 3. **Translator API**
- On-device translation
- 11+ languages supported
- Preserves formatting
- Reference: [Chrome for Developers - Translation API](https://developer.chrome.com/docs/ai/translator-api)

## 🛠️ Troubleshooting

### "Prompt API not available"
- Ensure Chrome 138+ is installed
- Enable flags as described in Installation
- Restart Chrome completely
- Check `chrome://components/` for model download

### "Summarizer API unavailable"
- Summarizer API is newer and may not be available on all Chrome versions
- The extension falls back to Prompt API automatically
- Check Chrome Canary/Dev channel for latest features

### Content extraction fails
- Ensure you're on the actual page (not chrome:// pages)
- Some sites may block content extraction (CSP restrictions)
- Try using "Auto-Detect" button instead of manual URL

### Translation not working
- Translation API is experimental
- Requires specific Chrome flags enabled
- Not all language pairs may be supported yet

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Follow existing code structure and naming conventions
2. Add JSDoc comments for new functions
3. Test with multiple content types (YouTube, articles, blogs)
4. Ensure compatibility with Chrome 138+
5. Update README if adding new features

## 🙏 Acknowledgments

- Inspired by [Terra's use of Summarizer API](https://developer.chrome.com/blog/summarizer-terra-brightsites)
- Built with Chrome's built-in AI capabilities
- Icons from system emoji

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/SnapSummary/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/SnapSummary/discussions)

## 🗺️ Roadmap

- [ ] Support for more content types (PDF, Twitter threads)
- [ ] Batch summarization for multiple tabs
- [ ] Summary comparison and merging
- [ ] Export to multiple formats (PDF, Markdown, JSON)
- [ ] Browser sync for saved summaries
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Custom themes for summary cards

---

**Made with ⚡ by the SnapSummary team**

*Powered by Chrome's on-device AI - Your data never leaves your browser*
