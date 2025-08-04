// State management
let stateChanged = true;
let tabUrl = {};
let urlList = {};
let domains = [];
let dupUrls = [];

// Settings
let autoClose = false;
let currentWindowOnly = false;
let sortTabs = false;

// Auto-close timeout for debouncing
let autoCloseTimeout;

// URL extraction utility for suspended tabs (Marvellous Suspender, etc.)
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

function loadConfigs(callback) {
  chrome.storage.sync.get(
    {
      autoClose: false,
      currentWindowOnly: false,
      sortTabs: false
    },
    function (items) {
      if (chrome.runtime.lastError) {
        console.error('Error loading configs:', chrome.runtime.lastError);
        return;
      }

      autoClose = items.autoClose;
      currentWindowOnly = items.currentWindowOnly;
      sortTabs = items.sortTabs;

      console.log('Loaded configs:', { autoClose, currentWindowOnly, sortTabs });

      if (callback) {
        callback();
      }
    }
  );
}

// Tab querying functions with proper error handling
function _queryAllTabs(callback) {
  chrome.tabs.query({}, tabs => {
    if (chrome.runtime.lastError) {
      console.error('Error querying all tabs:', chrome.runtime.lastError);
      return;
    }
    console.log(`Found ${tabs.length} total tabs`);
    callback(tabs);
  });
}

function queryTabsWithFilter(callback) {
  const queryOptions = {};
  if (currentWindowOnly) {
    queryOptions.currentWindow = true;
  }

  chrome.tabs.query(queryOptions, tabs => {
    if (chrome.runtime.lastError) {
      console.error('Error querying tabs with filter:', chrome.runtime.lastError);
      return;
    }
    console.log(`Found ${tabs.length} tabs with filter (currentWindowOnly: ${currentWindowOnly})`);

    // Additional debugging for the counting issue
    if (tabs.length < 10) {
      console.warn('Suspiciously low tab count detected. This might indicate an issue.');
      console.log('Query options used:', queryOptions);
      console.log('Current settings:', { currentWindowOnly, autoClose, sortTabs });

      // Try querying all tabs to compare
      chrome.tabs.query({}, allTabs => {
        if (!chrome.runtime.lastError) {
          console.log(`Total tabs in all windows: ${allTabs.length}`);
          if (allTabs.length > tabs.length) {
            console.warn(
              'Detected difference between filtered and all tabs. This might explain the counting issue.'
            );
          }
        }
      });
    }

    callback(tabs);
  });
}

function initTabUrl(tabs) {
  tabUrl = {};

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const realUrl = extractRealUrl(tab.url);
    tabUrl[tab.id] = {
      url: realUrl,
      title: tab.title,
      originalUrl: tab.url,
      isSuspended: realUrl !== tab.url
    };
  }

  console.log(`Processed ${tabs.length} tabs, found ${Object.keys(tabUrl).length} entries`);
}

function init() {
  loadConfigs(() => {
    queryTabsWithFilter(tabs => {
      initTabUrl(tabs);
      stateChanged = true;
      refreshBadge();
    });
  });
}

// Force refresh all tab data - useful for debugging counting issues
function forceRefreshAllTabs() {
  console.log('Force refreshing all tab data...');

  // Clear existing data
  tabUrl = {};
  stateChanged = true;

  // Query all tabs regardless of settings to get accurate count
  chrome.tabs.query({}, allTabs => {
    if (chrome.runtime.lastError) {
      console.error('Error in force refresh:', chrome.runtime.lastError);
      return;
    }

    console.log(`Force refresh found ${allTabs.length} total tabs`);
    initTabUrl(allTabs);

    // Now apply filtering if needed
    queryTabsWithFilter(filteredTabs => {
      if (currentWindowOnly && filteredTabs.length !== allTabs.length) {
        console.log(
          `Filtering to current window: ${filteredTabs.length} of ${allTabs.length} tabs`
        );
        initTabUrl(filteredTabs);
      }

      stateChanged = true;
      refreshBadge();
    });
  });
}

function setIcon(type) {
  const iconPath = type === 'inactive' ? 'icon_128_gs.png' : 'icon_128.png';
  chrome.action.setIcon({ path: iconPath }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error setting icon:', chrome.runtime.lastError);
    }
  });
}

function setBadge(msg) {
  chrome.action.setBadgeBackgroundColor(
    {
      color: [0, 0, 0, 0]
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting badge color:', chrome.runtime.lastError);
        return;
      }

      chrome.action.setBadgeText({ text: msg }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting badge text:', chrome.runtime.lastError);
        }
      });
    }
  );
}

function setTitle(msg) {
  chrome.action.setTitle({ title: msg }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error setting title:', chrome.runtime.lastError);
    }
  });
}

function updateUrlList() {
  urlList = {};

  for (const tabId in tabUrl) {
    const url = tabUrl[tabId].url;

    if (url in urlList) {
      urlList[url].count += 1;
    } else {
      urlList[url] = { count: 1, title: tabUrl[tabId].title };
    }
  }
}

function getDomain(url) {
  return url.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
}

function updateDomains() {
  domains = [];
  const domainsList = {};

  for (const url in urlList) {
    const domain = getDomain(url);
    if (domain in domainsList) {
      domainsList[domain] += 1;
    } else {
      domainsList[domain] = 1;
    }
  }

  for (const domain in domainsList) {
    domains.push({ domain: domain, count: domainsList[domain] });
  }
}

function getTopDomains() {
  const topDomains = domains
    .sort((a, b) => b.count - a.count) // Fixed: sort descending directly
    .filter(a => a.count >= 5)
    .map(a => `${a.count} : ${a.domain}`);

  return topDomains.length > 0 ? `## Top Domains\n${topDomains.join('\n')}\n` : '';
}

function refreshBadge() {
  if (!stateChanged) {
    return;
  }

  updateUrlList();
  updateDomains();

  let tabCount = 0;
  let urlCount = 0;
  dupUrls = [];

  for (const url in urlList) {
    if (urlList[url] === undefined) {
      continue;
    }

    const count = urlList[url].count;
    tabCount += count;
    urlCount++;

    if (count > 1) {
      dupUrls.push(`${count} : ${urlList[url].title.substr(0, 50)}`);
    }
  }

  const diff = tabCount - urlCount;

  let title = `Tabs: ${tabCount} || Duplicates: ${diff}\n`;
  title += getTopDomains();

  if (diff > 0) {
    setIcon('active');
    setBadge(diff.toString());
    setTitle(title + '## Duplicate sites\n' + dupUrls.sort().reverse().join('\n'));
  } else {
    setIcon('inactive');
    setBadge('');
    setTitle(title);
  }

  stateChanged = false;
}

chrome.runtime.onInstalled.addListener(details => {
  console.log('Extension installed/updated:', details);
  init();

  // Set up periodic refresh to prevent counting issues
  setInterval(() => {
    console.log('Periodic tab data refresh...');
    forceRefreshAllTabs();
  }, 30000); // Refresh every 30 seconds
});

chrome.runtime.onStartup.addListener(details => {
  console.log('Extension startup:', details);
  init();

  // Set up periodic refresh to prevent counting issues
  setInterval(() => {
    console.log('Periodic tab data refresh...');
    forceRefreshAllTabs();
  }, 30000); // Refresh every 30 seconds
});

// Auto-close handler with debouncing
function handleAutoClose() {
  if (!autoClose) {
    return;
  }

  // Debounce auto-close to avoid rapid firing
  clearTimeout(autoCloseTimeout);
  autoCloseTimeout = setTimeout(() => {
    closeDuplicateTabs(true); // true = auto mode
  }, 2000); // Wait 2 seconds after last tab change
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.title) {
    const realUrl = extractRealUrl(tab.url);
    tabUrl[tabId] = {
      url: realUrl,
      title: tab.title,
      originalUrl: tab.url,
      isSuspended: realUrl !== tab.url
    };

    stateChanged = true;
    refreshBadge();
    handleAutoClose();
  }
});

chrome.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  delete tabUrl[tabId];
  stateChanged = true;
  refreshBadge();
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  delete tabUrl[removedTabId];
  stateChanged = true;
  refreshBadge();
});

chrome.tabs.onActivated.addListener(_activeInfo => {
  refreshBadge();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    console.log('Settings changed:', changes);
    init();
  }
});

chrome.action.onClicked.addListener(() => {
  console.log('Extension clicked - Settings:', { autoClose, currentWindowOnly, sortTabs });

  // Force refresh before closing duplicates to ensure accurate data
  forceRefreshAllTabs();

  // Small delay to allow refresh to complete
  setTimeout(() => {
    closeDuplicateTabs();
  }, 500);
});

function closeDuplicateTabs(isAutoMode = false) {
  queryTabsWithFilter(tabs => {
    if (sortTabs) {
      tabs.sort((a, b) => {
        if (a.windowId !== b.windowId) {
          return a.windowId - b.windowId;
        }
        return a.url.toLowerCase().localeCompare(b.url.toLowerCase());
      });
    }

    const urls = {};
    const tabsToClose = [];
    let newIndex = 0;
    let winId = -1;

    for (let i = 0; i < tabs.length; i++) {
      const currentTab = tabs[i];
      const realUrl = extractRealUrl(currentTab.url);

      if (sortTabs && winId !== currentTab.windowId) {
        winId = currentTab.windowId;
        newIndex = 0;
      }

      if (realUrl in urls) {
        const existingTab = urls[realUrl];

        // Prefer active and pinned tabs
        if (!existingTab.pinned && (currentTab.pinned || currentTab.active)) {
          tabsToClose.push(existingTab.id);
          urls[realUrl] = currentTab;
        } else {
          tabsToClose.push(currentTab.id);
        }
      } else {
        urls[realUrl] = currentTab;
        if (sortTabs) {
          chrome.tabs.move(currentTab.id, { index: newIndex++ }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error moving tab:', chrome.runtime.lastError);
            }
          });
        }
      }
    }

    // Close duplicate tabs
    if (tabsToClose.length > 0) {
      console.log(`${isAutoMode ? 'Auto-' : ''}Closing ${tabsToClose.length} duplicate tabs`);

      chrome.tabs.remove(tabsToClose, () => {
        if (chrome.runtime.lastError) {
          console.error('Error closing tabs:', chrome.runtime.lastError);
        } else {
          console.log(`Successfully closed ${tabsToClose.length} duplicate tabs`);
        }
      });
    }

    stateChanged = true;
    setTimeout(refreshBadge, 500); // Refresh after tabs are closed
  });
}
