// Saves options to chrome.storage
function saveOptions(event) {
  if (event) {
    event.preventDefault();
  }

  const autoClose = document.getElementById('autoClose')
    ? document.getElementById('autoClose').checked
    : false;
  const currentWindowOnly = document.getElementById('currentWindowOnly')
    ? document.getElementById('currentWindowOnly').checked
    : false;
  const sortTabs = document.getElementById('sortTabs').checked;

  chrome.storage.sync.set(
    {
      autoClose: autoClose,
      currentWindowOnly: currentWindowOnly,
      sortTabs: sortTabs
    },
    function () {
      if (chrome.runtime.lastError) {
        console.error('Error saving options:', chrome.runtime.lastError);
        showStatus('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      console.log('Settings saved:', { autoClose, currentWindowOnly, sortTabs });
      showStatus('Settings saved successfully!', 'success');
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get(
    {
      autoClose: false,
      currentWindowOnly: false,
      sortTabs: false
    },
    function (items) {
      if (chrome.runtime.lastError) {
        console.error('Error loading options:', chrome.runtime.lastError);
        showStatus('Error loading settings: ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      if (document.getElementById('autoClose')) {
        document.getElementById('autoClose').checked = items.autoClose;
      }
      if (document.getElementById('currentWindowOnly')) {
        document.getElementById('currentWindowOnly').checked = items.currentWindowOnly;
      }
      if (document.getElementById('sortTabs')) {
        document.getElementById('sortTabs').checked = items.sortTabs;
      }

      console.log('Settings loaded:', items);
    }
  );
}

// Show status message with styling
function showStatus(message, type = 'success') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status-message status-${type}`;
  statusDiv.style.display = 'block';

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// URL extraction utility (same as in close_tabs.js)
function extractRealUrl(tabUrl) {
  // Handle null/undefined inputs
  if (!tabUrl) {
    return tabUrl;
  }

  // Check if this is a suspended tab URL
  if (tabUrl.includes('suspended.html#')) {
    try {
      const hashPart = tabUrl.split('#')[1];
      const params = new URLSearchParams(hashPart);
      const realUrl = params.get('uri');
      if (realUrl) {
        return decodeURIComponent(realUrl);
      }
    } catch (error) {
      console.warn('Failed to extract real URL from suspended tab:', error);
    }
  }

  // Check for other common tab suspender patterns
  if (tabUrl.includes('chrome-extension://') && tabUrl.includes('suspended')) {
    try {
      const url = new URL(tabUrl);
      // Handle different suspender extension patterns
      const realUrl = url.searchParams.get('uri') || url.hash.match(/uri=([^&]+)/)?.[1];
      if (realUrl) {
        return decodeURIComponent(realUrl);
      }
    } catch (error) {
      console.warn('Failed to extract URL from suspender:', error);
    }
  }

  return tabUrl; // Return original URL if not suspended
}

// Get domain from URL
function getDomain(url) {
  return url.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
}

// Load and display tab statistics
function loadTabStatistics() {
  if (!chrome.tabs) {
    console.warn('Chrome tabs API not available');
    return;
  }

  chrome.tabs.query({}, tabs => {
    if (chrome.runtime.lastError) {
      console.error('Error querying tabs:', chrome.runtime.lastError);
      showStatus('Error loading tab statistics: ' + chrome.runtime.lastError.message, 'error');
      return;
    }

    console.log(`Found ${tabs.length} total tabs for statistics`);

    // Process tabs to get statistics
    const urlCounts = {};
    const domains = {};
    let suspendedCount = 0;

    tabs.forEach(tab => {
      const realUrl = extractRealUrl(tab.url);
      const isSuspended = realUrl !== tab.url;

      if (isSuspended) {
        suspendedCount++;
      }

      // Count URLs
      if (realUrl in urlCounts) {
        urlCounts[realUrl]++;
      } else {
        urlCounts[realUrl] = 1;
      }

      // Count domains
      const domain = getDomain(realUrl);
      if (domain in domains) {
        domains[domain]++;
      } else {
        domains[domain] = 1;
      }
    });

    // Calculate statistics
    const totalTabs = tabs.length;
    const uniqueUrls = Object.keys(urlCounts).length;
    const duplicateTabs = totalTabs - uniqueUrls;

    // Update UI
    updateStatisticsDisplay(totalTabs, uniqueUrls, duplicateTabs, suspendedCount);
    updateDuplicatesList(urlCounts);
    updateDomainsList(domains);
  });
}

// Update statistics display
function updateStatisticsDisplay(totalTabs, uniqueUrls, duplicateTabs, suspendedTabs) {
  document.getElementById('totalTabs').textContent = totalTabs;
  document.getElementById('uniqueUrls').textContent = uniqueUrls;
  document.getElementById('duplicateTabs').textContent = duplicateTabs;
  document.getElementById('suspendedTabs').textContent = suspendedTabs;
}

// Update duplicates list
function updateDuplicatesList(urlCounts) {
  const duplicatesList = document.getElementById('duplicatesList');
  const duplicatesContent = document.getElementById('duplicatesContent');

  // Find URLs with duplicates
  const duplicates = Object.entries(urlCounts)
    .filter(([_url, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  if (duplicates.length === 0) {
    duplicatesList.style.display = 'none';
    return;
  }

  duplicatesList.style.display = 'block';
  duplicatesContent.innerHTML = '';

  duplicates.forEach(([url, count]) => {
    const item = document.createElement('div');
    item.className = 'duplicate-item';

    const title = url.length > 60 ? url.substring(0, 60) + '...' : url;
    item.innerHTML = `<span class="duplicate-count">${count}×</span>${title}`;

    duplicatesContent.appendChild(item);
  });
}

// Update domains list
function updateDomainsList(domains) {
  const domainsList = document.getElementById('domainsList');
  const domainsContent = document.getElementById('domainsContent');

  // Find domains with 5+ tabs
  const topDomains = Object.entries(domains)
    .filter(([_domain, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1]); // Sort by count descending

  if (topDomains.length === 0) {
    domainsList.style.display = 'none';
    return;
  }

  domainsList.style.display = 'block';
  domainsContent.innerHTML = '';

  topDomains.forEach(([domain, count]) => {
    const item = document.createElement('div');
    item.className = 'domain-item';
    item.innerHTML = `
      <span>${domain}</span>
      <span class="domain-count">${count} tabs</span>
    `;
    domainsContent.appendChild(item);
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  loadTabStatistics();
});

// Handle form submission
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
  settingsForm.addEventListener('submit', saveOptions);
}

// Fallback for direct button click
const saveButton = document.getElementById('save');
if (saveButton) {
  saveButton.addEventListener('click', saveOptions);
}

// Refresh statistics button
const refreshButton = document.getElementById('refreshStats');
if (refreshButton) {
  refreshButton.addEventListener('click', loadTabStatistics);
}
