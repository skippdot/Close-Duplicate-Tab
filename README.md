# Close Duplicate Tab

A Chrome extension that automatically identifies and closes duplicate browser tabs with identical URLs, helping reduce browser memory usage and tab clutter.

## Features

- **Duplicate Detection**: Automatically identifies tabs with identical URLs
- **Smart Badge**: Shows the number of duplicate tabs in the extension icon
- **Intelligent Closing**: Preserves active and pinned tabs when closing duplicates
- **Tab Sorting**: Optional feature to reorganize tabs by URL when closing duplicates
- **Multi-Window Support**: Works across all browser windows
- **Real-time Updates**: Badge updates automatically as you browse

## Installation

### From Chrome Web Store
*Coming soon - the extension is currently being updated to Manifest V3*

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will appear in your toolbar

## How It Works

1. **Detection**: The extension monitors all your tabs and identifies duplicates by comparing URLs
2. **Badge Display**: The number of duplicate tabs is shown on the extension icon
3. **Smart Closing**: When you click the extension icon, it closes duplicate tabs while preserving:
   - Active tabs (currently selected)
   - Pinned tabs
   - The most recently accessed tab for each URL

## Settings

Access settings by right-clicking the extension icon and selecting "Options":

- **Sort Tabs**: Reorganize tabs by URL when closing duplicates (helps group related tabs)
- **Auto Close**: *(Coming soon)* Automatically close duplicates as they're detected
- **Current Window Only**: *(Coming soon)* Limit duplicate detection to the current window

## Privacy

This extension respects your privacy:
- ✅ No data collection
- ✅ No external connections
- ✅ All processing happens locally in your browser
- ✅ Only stores your preferences locally

See our full [Privacy Policy](https://skippdot.github.io/Close-Duplicate-Tab/privacy-policy.html).

## Permissions

The extension requires these permissions:
- **tabs**: To read tab URLs, identify duplicates, and close duplicate tabs
- **storage**: To save your preferences

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Background**: Service Worker (efficient and modern)
- **Compatibility**: Chrome 88+ (Manifest V3 requirement)

## Development

### Project Structure
```
├── manifest.json          # Extension configuration
├── close_tabs.js          # Main extension logic
├── options.html           # Settings page
├── options.js             # Settings functionality
├── privacy-policy.html    # Privacy policy
├── README.md             # This file
└── icons/                # Extension icons
    ├── icon_16.png
    ├── icon_48.png
    ├── icon_128.png
    └── icon_128_gs.png   # Grayscale (inactive state)
```

### Building
No build process required - this is a vanilla JavaScript extension.

### Testing
1. Load the extension in developer mode
2. Open multiple tabs with the same URL
3. Check that the badge shows the number of duplicates
4. Click the extension icon to close duplicates
5. Verify that active/pinned tabs are preserved

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### Version 2.5.1
- ✅ Migrated to Manifest V3
- ✅ Updated to use Service Workers
- ✅ Replaced deprecated `chrome.browserAction` with `chrome.action`
- ✅ Improved event-driven badge updates
- ✅ Added privacy policy

### Version 2.5
- Previous version (Manifest V2 - deprecated)

## License

This project is open source. See the repository for license details.

## Support

- Report issues on [GitHub Issues](https://github.com/skippdot/Close-Duplicate-Tab/issues)
- For Chrome Web Store related questions, use the store's support system

---

**Note**: The original extension was removed from the Chrome Web Store for using deprecated Manifest V2. This updated version uses the modern Manifest V3 standard and follows current Chrome extension best practices.