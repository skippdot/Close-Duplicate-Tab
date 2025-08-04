# Installation Guide - Close Duplicate Tab Extension

## 📦 Installation Methods

### Method 1: GitHub Download (Recommended)

#### Step-by-Step Instructions

1. **Download the Extension**
   - Go to [GitHub Repository](https://github.com/skippdot/Close-Duplicate-Tab)
   - Click the green "Code" button
   - Select "Download ZIP"
   - Save the file to your computer

2. **Extract the Files**
   - Locate the downloaded ZIP file
   - Right-click and select "Extract All" (Windows) or double-click (Mac)
   - Remember the location where you extracted the files

3. **Open Chrome Extensions**
   - Open Google Chrome
   - Type `chrome://extensions/` in the address bar
   - Press Enter

4. **Enable Developer Mode**
   - Look for "Developer mode" toggle in the top-right corner
   - Click to enable it (the toggle should turn blue/on)

5. **Load the Extension**
   - Click the "Load unpacked" button that appears
   - Navigate to the extracted folder
   - **Important**: Select the `extension` folder (not the root folder)
   - Click "Select Folder" or "Open"

6. **Verify Installation**
   - The extension should appear in your extensions list
   - You should see the Close Duplicate Tab icon in your Chrome toolbar
   - The icon will show a badge with the number of duplicate tabs

### Method 2: Git Clone (For Developers)

```bash
# Clone the repository
git clone https://github.com/skippdot/Close-Duplicate-Tab.git

# Navigate to the project
cd Close-Duplicate-Tab

# Install development dependencies (optional)
npm install

# Load the extension/folder in Chrome
```

### Method 3: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store after the current updates are reviewed and approved.

## 🔧 Post-Installation Setup

### 1. Configure Settings
- Right-click the extension icon
- Select "Options"
- Configure your preferences:
  - **Auto Close**: Automatically close duplicates (recommended)
  - **Current Window Only**: Limit to current window if you use multiple windows
  - **Sort Tabs**: Organize tabs by URL when closing duplicates

### 2. Test the Extension
- Open several tabs to the same website (e.g., google.com)
- Check that the extension badge shows the number of duplicates
- Click the extension icon to close duplicates
- Verify that active and pinned tabs are preserved

### 3. Learn the Keyboard Shortcut
- **Windows/Linux**: `Ctrl + Shift + D`
- **Mac**: `Cmd + Shift + D`

## 🐛 Troubleshooting

### Extension Not Loading?

**Problem**: "Load unpacked" button is grayed out
- **Solution**: Make sure "Developer mode" is enabled

**Problem**: Error when loading extension
- **Solution**: Ensure you selected the `extension` folder, not the root project folder

**Problem**: Extension loads but doesn't work
- **Solution**: Check that you have the latest version of Chrome (88+)

### Badge Not Showing Numbers?

**Problem**: Extension icon doesn't show duplicate count
- **Solution**: 
  1. Open multiple tabs with the same URL
  2. Wait a few seconds for detection
  3. Click the extension icon to force refresh

### Auto-Close Not Working?

**Problem**: Duplicates aren't closing automatically
- **Solution**:
  1. Check that "Auto Close" is enabled in options
  2. Wait 2 seconds after creating duplicates (there's a delay)
  3. Ensure you have exact URL matches

### Settings Not Saving?

**Problem**: Options reset after closing Chrome
- **Solution**:
  1. Make sure Chrome has permission to store data
  2. Try disabling and re-enabling the extension
  3. Check Chrome's storage settings

## 🔄 Updating the Extension

### Manual Update
1. Download the latest version from GitHub
2. Extract the new files
3. Go to `chrome://extensions/`
4. Find the Close Duplicate Tab extension
5. Click the refresh/reload icon
6. Or remove the old version and load the new one

### Automatic Updates (Chrome Web Store)
Once available on the Chrome Web Store, updates will be automatic.

## 🗑️ Uninstalling

### Remove Extension
1. Go to `chrome://extensions/`
2. Find "Close Duplicate Tab"
3. Click "Remove"
4. Confirm removal

### Clean Up (Optional)
- Delete the downloaded extension files from your computer
- Chrome will automatically clean up extension data

## 📊 Verification Checklist

After installation, verify these features work:

- [ ] Extension icon appears in toolbar
- [ ] Badge shows number of duplicate tabs
- [ ] Clicking icon closes duplicate tabs
- [ ] Active tabs are preserved
- [ ] Pinned tabs are preserved
- [ ] Keyboard shortcut works (`Ctrl+Shift+D`)
- [ ] Options page opens and saves settings
- [ ] Auto-close works (if enabled)
- [ ] Current window only works (if enabled)

## 🆘 Getting Help

### Before Asking for Help
1. Check this installation guide
2. Try the troubleshooting steps above
3. Make sure you're using Chrome 88 or later
4. Verify you selected the correct `extension` folder

### Where to Get Help
- **GitHub Issues**: [Report bugs](https://github.com/skippdot/Close-Duplicate-Tab/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/skippdot/Close-Duplicate-Tab/discussions)
- **Documentation**: Check other files in the `docs/` folder

### When Reporting Issues
Please include:
- Chrome version (`chrome://version/`)
- Operating system
- Extension version
- Steps to reproduce the problem
- Any error messages from the console

## 🎯 Success!

If you can see the extension icon and it shows a badge with duplicate tab counts, you've successfully installed Close Duplicate Tab! 

Enjoy your cleaner, more organized browsing experience! 🎉
