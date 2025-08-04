# Changelog

All notable changes to the Close Duplicate Tab extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2024-12-08

### 🎨 User Interface Improvements
- **Enhanced Options Page**: Complete redesign with modern HTML5 structure and professional styling
- **Detailed Setting Descriptions**: Comprehensive explanations for each setting with usage examples
- **Improved Accessibility**: Proper labels, ARIA attributes, and keyboard navigation support
- **Visual Hierarchy**: Clean layout with fieldsets, legends, and logical groupings
- **Status Messages**: Professional success/error feedback with auto-hide functionality

### 🔧 Development Tools & Code Quality
- **ESLint Integration**: Comprehensive linting with Chrome extension specific rules
- **Prettier Formatting**: Automatic code formatting for consistent style
- **Quality Scripts**: Added `npm run quality`, `lint`, `format` commands for development workflow
- **Zero Linting Errors**: Fixed all 730+ linting issues for professional code quality
- **Enhanced Documentation**: Added comprehensive linting guide and development instructions

### 📚 Documentation Enhancements
- **Linting Guide**: Complete guide for code quality standards and development workflow
- **Improved README**: Added development tools information and npm scripts documentation
- **Installation Guide**: Enhanced with troubleshooting and verification steps
- **Improvements Summary**: Detailed documentation of all enhancements made

## [2.6.0] - 2024-12-08

### 🎉 Major Release - Complete Overhaul

This release represents a complete rewrite and modernization of the extension with significant new features and bug fixes.

### ✨ Added
- **Auto-Close Feature**: Automatically close duplicate tabs as they're detected (2-second debounce)
- **Tab Suspender Compatibility**: Full support for Marvellous Suspender and other tab suspender extensions
- **Keyboard Shortcuts**: Added `Ctrl+Shift+D` (Windows/Linux) and `Cmd+Shift+D` (Mac) to close duplicates
- **Enhanced Options Page**: Redesigned settings page with all features enabled
- **Current Window Only**: Option to limit duplicate detection to the current window
- **Comprehensive Error Handling**: All Chrome API calls now include proper error handling
- **Debug Logging**: Added console logging for troubleshooting and monitoring
- **Performance Optimization**: Improved handling of large tab counts (500+ tabs)

### 🔧 Fixed
- **Critical Tab Counting Bug**: Fixed issue where extension showed incorrect tab counts (e.g., "Tabs: 5" when user had 500+ tabs)
- **currentWindowOnly Setting**: Fixed broken functionality that was commented out in previous version
- **Global Variable Leaks**: Fixed missing variable declarations that created global variables
- **Memory Management**: Improved tab tracking to prevent memory leaks
- **URL Extraction**: Added proper handling of suspended tab URLs with real URL extraction

### 🚀 Improved
- **JavaScript Modernization**: Converted entire codebase to ES6+ syntax
  - Replaced `var` with `const`/`let`
  - Added arrow functions and template literals
  - Improved code structure and readability
- **Error Resilience**: Extension now handles errors gracefully without silent failures
- **Badge Updates**: More efficient and accurate badge updating
- **Tab Preference Logic**: Better handling of active vs inactive and pinned vs unpinned tabs
- **Sort Algorithm**: Fixed and improved tab sorting functionality

### 🧪 Testing
- **Comprehensive Test Suite**: Added 24 automated tests with 100% pass rate
- **Jest Framework**: Implemented modern testing infrastructure
- **Edge Case Coverage**: Tests for suspended tabs, large tab counts, malformed URLs
- **Manual Testing Tools**: Created interactive test page and testing guides
- **Performance Testing**: Validated with 500+ tab scenarios

### 📚 Documentation
- **Updated README**: Comprehensive installation and usage instructions
- **Testing Guide**: Detailed manual and automated testing procedures
- **Implementation Status**: Complete tracking of all changes and fixes
- **Code Comments**: Added extensive inline documentation

### 🏗️ Development
- **Project Structure**: Organized files into logical folders (`extension/`, `tests/`, `docs/`)
- **Build Process**: Added npm scripts for testing and development
- **Chrome API Updates**: Fully compatible with Manifest V3 requirements
- **Code Quality**: Implemented modern JavaScript best practices

### 🔒 Security & Privacy
- **Enhanced Privacy**: Maintained zero data collection policy
- **Local Processing**: All operations remain client-side
- **Minimal Permissions**: Only requests necessary Chrome permissions
- **Error Boundaries**: Improved error handling prevents crashes

## [2.5.1] - 2024-12-02

### 🔄 Manifest V3 Migration
- **Updated Manifest**: Migrated from deprecated Manifest V2 to V3
- **Service Worker**: Replaced background scripts with service worker
- **API Updates**: Updated `chrome.browserAction` to `chrome.action`
- **Privacy Policy**: Added comprehensive privacy policy page
- **Documentation**: Added detailed README with installation instructions

### 🐛 Fixed
- **Chrome Web Store Compliance**: Addressed Manifest V2 deprecation
- **Modern Standards**: Updated to current Chrome extension requirements

## [2.5.0] - Legacy Version

### 📜 Historical Release
- **Basic Functionality**: Core duplicate tab detection and closing
- **Badge Display**: Shows number of duplicate tabs
- **Manual Operation**: Click-to-close duplicate tabs
- **Simple Settings**: Basic options for tab sorting

### ⚠️ Deprecated
- **Manifest V2**: No longer supported by Chrome Web Store
- **Limited Features**: Many features were commented out or incomplete

---

## 🔮 Upcoming Features

### Planned for v2.7.0
- **User Notifications**: Toast notifications when tabs are closed
- **Statistics Dashboard**: Track duplicate tab patterns over time
- **Whitelist/Blacklist**: Exclude specific domains from duplicate detection
- **Advanced URL Matching**: Handle URL variations (trailing slashes, query parameters)
- **Export/Import Settings**: Backup and restore extension configuration

### Under Consideration
- **Tab Grouping Integration**: Work with Chrome's native tab groups
- **Duplicate Prevention**: Warn before opening duplicate tabs
- **Smart Suggestions**: Recommend tabs to close based on usage patterns
- **Dark Mode**: Dark theme for options page
- **Multiple Window Management**: Advanced multi-window duplicate handling

## 📊 Version Comparison

| Feature | v2.5.0 | v2.5.1 | v2.6.0 |
|---------|--------|--------|--------|
| Manifest Version | V2 | V3 | V3 |
| Tab Counting | ❌ Buggy | ❌ Buggy | ✅ Fixed |
| Auto-Close | ❌ Missing | ❌ Missing | ✅ Added |
| Suspender Support | ❌ No | ❌ No | ✅ Full |
| Current Window Only | ❌ Broken | ❌ Broken | ✅ Fixed |
| Error Handling | ❌ Poor | ❌ Poor | ✅ Comprehensive |
| Testing | ❌ None | ❌ None | ✅ 24 Tests |
| Documentation | ❌ Minimal | ✅ Basic | ✅ Complete |

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/skippdot/Close-Duplicate-Tab/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/skippdot/Close-Duplicate-Tab/discussions)
- **Email**: For security issues or private concerns

---

**Note**: This extension was completely rewritten for v2.6.0 to address fundamental issues and add modern features. Users upgrading from v2.5.x will notice significant improvements in reliability and functionality.
