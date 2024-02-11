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
  const badgeColor = document.getElementById('badgeColor')?.value || 'green';
  const language = document.getElementById('language')?.value || 'auto';

  chrome.storage.sync.set(
    {
      autoClose: autoClose,
      currentWindowOnly: currentWindowOnly,
      sortTabs: sortTabs,
      badgeColor: badgeColor,
      language: language
    },
    function () {
      if (chrome.runtime.lastError) {
        console.error('Error saving options:', chrome.runtime.lastError);
        const errorMsg =
          chrome.i18n.getMessage('errorSavingSettings') + ' ' + chrome.runtime.lastError.message;
        showStatus('errorSavingSettings', 'error', errorMsg);
        return;
      }

      console.log('Settings saved:', { autoClose, currentWindowOnly, sortTabs });
      showStatus('settingsSaved', 'success', 'Settings saved successfully!');
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
      sortTabs: false,
      badgeColor: 'green'
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
      if (document.getElementById('badgeColor')) {
        document.getElementById('badgeColor').value = items.badgeColor || 'red';
      }
      if (document.getElementById('language')) {
        document.getElementById('language').value = items.language || 'auto';
      }

      console.log('Settings loaded:', items);
    }
  );
}

// Show status message with styling
function showStatus(messageKey, type = 'success', fallbackMessage = '') {
  const statusDiv = document.getElementById('status');
  // Try to get i18n message, fallback to provided message or key
  const message = chrome.i18n.getMessage(messageKey) || fallbackMessage || messageKey;
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

// Initialize internationalization
function initializeI18n() {
  // Update all elements with data-i18n attributes
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = message;
      } else {
        element.textContent = message;
      }
    }
  });

  // Update document title
  const titleElement = document.querySelector('title[data-i18n]');
  if (titleElement) {
    const messageKey = titleElement.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      document.title = message;
    }
  }
}

// Apply language override for options page (simple demo):
const langSelect = document.getElementById('language');
if (langSelect) {
  langSelect.addEventListener('change', () => {
    const lang = langSelect.value;
    if (lang && lang !== 'auto') {
      document.documentElement.setAttribute('lang', lang);
      // Dynamically swap texts for options page only
      try {
        fetch(`_locales/${lang}/messages.json`)
          .then(r => r.json())
          .then(dict => {
            const getMsg = key => (dict[key] && dict[key].message) || chrome.i18n.getMessage(key);
            document.querySelectorAll('[data-i18n]').forEach(el => {
              const key = el.getAttribute('data-i18n');
              const msg = getMsg(key);
              if (!msg) {
                return;
              }
              if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = msg;
              } else {
                el.textContent = msg;
              }
            });
            const titleEl = document.querySelector('title[data-i18n]');
            if (titleEl) {
              const key = titleEl.getAttribute('data-i18n');
              const msg = getMsg(key);
              if (msg) {
                document.title = msg;
              }
            }
          });
      } catch (e) {
        console.warn('Language swap failed', e);
      }
    } else {
      // Back to i18n default
      document.documentElement.removeAttribute('lang');
      initializeI18n();
    }
  });
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

    // Process tabs to get statistics
    const urlCounts = {};
    const domainTabs = {};
    let suspendedCount = 0;

    tabs.forEach(tab => {
      const realUrl = extractRealUrl(tab.url);
      const isSuspended = realUrl !== tab.url;

      if (isSuspended) {
        suspendedCount++;
      }

      // Count URLs
      urlCounts[realUrl] = (urlCounts[realUrl] || 0) + 1;

      // Group tabs by domain
      const domain = getDomain(realUrl);
      if (!(domain in domainTabs)) {
        domainTabs[domain] = [];
      }
      domainTabs[domain].push({
        id: tab.id,
        title: tab.title,
        url: realUrl,
        originalUrl: tab.url,
        isSuspended: isSuspended,
        isActive: tab.active,
        isPinned: tab.pinned
      });
    });

    // Calculate statistics
    const totalTabs = tabs.length;
    const uniqueUrls = Object.keys(urlCounts).length;
    const duplicateTabs = totalTabs - uniqueUrls;

    // Update UI
    updateStatisticsDisplay(totalTabs, uniqueUrls, duplicateTabs, suspendedCount);
    updateDuplicatesList(urlCounts);
    updateDomainsListEnhanced(domainTabs);
  });
}

// Auto-refresh options page on tab state changes (debounced)
(function setupLiveUpdates() {
  const debounced = (() => {
    let t;
    return () => {
      clearTimeout(t);
      t = setTimeout(loadTabStatistics, 300);
    };
  })();

  if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener(debounced);
  }
  if (chrome.tabs && chrome.tabs.onRemoved) {
    chrome.tabs.onRemoved.addListener(debounced);
  }
  if (chrome.tabs && chrome.tabs.onCreated) {
    chrome.tabs.onCreated.addListener(debounced);
  }
  if (chrome.tabs && chrome.tabs.onReplaced) {
    chrome.tabs.onReplaced.addListener(debounced);
  }
  if (chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener(debounced);
  }
})();

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

// Update enhanced domains list with search and tab switching
function updateDomainsListEnhanced(domainTabs) {
  const domainsList = document.getElementById('domainsList');

  if (Object.keys(domainTabs).length === 0) {
    domainsList.style.display = 'none';
    return;
  }

  domainsList.style.display = 'block';

  // Store all domain data for search functionality
  window.allDomainTabs = domainTabs;

  renderDomainsList(domainTabs);
}

// Render domains list
function renderDomainsList(domainTabs, searchTerm = '') {
  const domainsContent = document.getElementById('domainsContent');
  domainsContent.innerHTML = '';

  // Filter domains based on search term
  const filteredDomains = Object.entries(domainTabs).filter(([domain, tabs]) => {
    if (!searchTerm) {
      return true;
    }

    const searchLower = searchTerm.toLowerCase();
    // Search in domain name
    if (domain.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in tab titles and URLs
    return tabs.some(
      tab =>
        tab.title.toLowerCase().includes(searchLower) || tab.url.toLowerCase().includes(searchLower)
    );
  });

  if (filteredDomains.length === 0) {
    domainsContent.innerHTML = '<div class="no-results">No matching domains or pages found</div>';
    return;
  }

  // Sort by tab count descending
  filteredDomains.sort((a, b) => b[1].length - a[1].length);

  filteredDomains.forEach(([domain, tabs]) => {
    const domainGroup = document.createElement('div');
    domainGroup.className = 'domain-group';

    const domainHeader = document.createElement('div');
    domainHeader.className = 'domain-header';
    domainHeader.innerHTML = `
      <span>${domain}</span>
      <span class="domain-count">${tabs.length} tabs</span>
    `;

    const domainTabsContainer = document.createElement('div');
    domainTabsContainer.className = 'domain-tabs';

    tabs.forEach(tab => {
      const tabItem = document.createElement('div');
      tabItem.className = 'tab-item';
      tabItem.dataset.tabId = tab.id;

      const statusIcons = [];
      if (tab.isActive) {
        statusIcons.push('🔵');
      }
      if (tab.isPinned) {
        statusIcons.push('📌');
      }
      if (tab.isSuspended) {
        statusIcons.push('💤');
      }

      tabItem.innerHTML = `
        <div class="tab-title">${statusIcons.join(' ')} ${tab.title}</div>
        <div class="tab-url">${tab.url}</div>
      `;

      tabItem.addEventListener('click', () => switchToTab(tab.id));
      domainTabsContainer.appendChild(tabItem);
    });

    domainHeader.addEventListener('click', () => {
      const isExpanded = domainTabsContainer.classList.contains('expanded');
      domainTabsContainer.classList.toggle('expanded', !isExpanded);
    });

    domainGroup.appendChild(domainHeader);
    domainGroup.appendChild(domainTabsContainer);
    domainsContent.appendChild(domainGroup);
  });
}

// Switch to a specific tab
function switchToTab(tabId) {
  chrome.tabs.update(tabId, { active: true }, tab => {
    if (chrome.runtime.lastError) {
      console.error('Error switching to tab:', chrome.runtime.lastError);
      showStatus('Error switching to tab: ' + chrome.runtime.lastError.message, 'error');
      return;
    }

    // Also focus the window containing the tab
    chrome.windows.update(tab.windowId, { focused: true }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error focusing window:', chrome.runtime.lastError);
      }
    });

    console.log('Switched to tab:', tab.title);
  });
}

// Initialize collapsible settings
function initializeCollapsibleSettings() {
  const settingHeaders = document.querySelectorAll('.setting-header[data-setting]');

  settingHeaders.forEach(header => {
    const settingName = header.dataset.setting;
    const content = document.getElementById(settingName + 'Content');
    const arrow = header.querySelector('.collapse-arrow');

    if (content && arrow) {
      header.addEventListener('click', e => {
        const isCheckbox = e.target.type === 'checkbox';
        const isLabelClick = e.target.tagName === 'LABEL' || e.target.closest('label');
        // Also update popup texts when it opens next time
        chrome.runtime.sendMessage({ type: 'I18N_UPDATED' });
        // На клике по тексту label: не трогаем описание, даём браузеру саму переключить чекбокс
        if (isLabelClick) {
          return; // default label behavior toggles the checkbox
        }
        // Любая другая область заголовка (кроме самого чекбокса) — раскрывает описание
        if (!isCheckbox) {
          const isExpanded = content.classList.contains('expanded');
          content.classList.toggle('expanded', !isExpanded);
          arrow.classList.toggle('expanded', !isExpanded);
        }
      });
    }
  });
}

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.getElementById('domainSearch');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const searchTerm = e.target.value;
      if (window.allDomainTabs) {
        renderDomainsList(window.allDomainTabs, searchTerm);
      }
    });
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeI18n();
  restoreOptions();
  loadTabStatistics();
  initializeCollapsibleSettings();
  initializeSearch();
});

// Handle form submission
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
  settingsForm.addEventListener('submit', saveOptions);

  // Enable Save button only when there are changes; add asterisk marker
  (function setupDirtyState() {
    const saveBtn = document.getElementById('save');
    const titleH1 = document.querySelector('.right-panel h1');
    if (!saveBtn || !titleH1) {
      return;
    }

    const initial = {};

    function snapshot() {
      initial.autoClose = !!document.getElementById('autoClose')?.checked;
      initial.currentWindowOnly = !!document.getElementById('currentWindowOnly')?.checked;
      initial.sortTabs = !!document.getElementById('sortTabs')?.checked;
      initial.badgeColor = document.getElementById('badgeColor')?.value || 'red';
    }

    function isDirty() {
      return (
        initial.autoClose !== !!document.getElementById('autoClose')?.checked ||
        initial.currentWindowOnly !== !!document.getElementById('currentWindowOnly')?.checked ||
        initial.sortTabs !== !!document.getElementById('sortTabs')?.checked ||
        initial.badgeColor !== (document.getElementById('badgeColor')?.value || 'red')
      );
    }

    function updateUI() {
      const dirty = isDirty();
      saveBtn.disabled = !dirty;
      titleH1.textContent = dirty
        ? 'Close Duplicate Tabs Settings *'
        : 'Close Duplicate Tabs Settings';
    }

    // After restore, take snapshot and disable Save
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        snapshot();
        updateUI();
      }, 0);
    });

    // Watch inputs for changes
    ['autoClose', 'currentWindowOnly', 'sortTabs', 'badgeColor'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', updateUI);
        el.addEventListener('input', updateUI);
      }
    });

    // After successful save, refresh snapshot and disable
    const originalShowStatus = window.showStatus;
    window.showStatus = function (messageKey, type = 'success', fallbackMessage = '') {
      originalShowStatus.call(window, messageKey, type, fallbackMessage);
      if (type === 'success') {
        snapshot();
        updateUI();
      }
    };
  })();
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
