// State management
function mapBadgeColor(name) {
  switch ((name || 'red').toLowerCase()) {
    case 'red':
      return [217, 48, 37, 255];
    case 'orange':
      return [255, 152, 0, 255];
    case 'yellow':
      return [251, 188, 5, 255];
    case 'green':
      return [52, 168, 83, 255];
    case 'blue':
      return [66, 133, 244, 255];
    case 'purple':
      return [156, 39, 176, 255];
    case 'gray':
      return [128, 128, 128, 255];
    default:
      return [217, 48, 37, 255];
  }
}
// i18n in-memory cache for global override
let _i18nLang = null;
let _i18nDict = null;
function i18nGet(key, fallback = '') {
  try {
    if (_i18nLang && _i18nLang !== 'auto' && _i18nDict && _i18nDict[_i18nLang]) {
      return _i18nDict[_i18nLang][key]?.message || fallback || chrome.i18n.getMessage(key) || '';
    }
    return chrome.i18n.getMessage(key) || fallback || '';
  } catch {
    return fallback || '';
  }
}
function preloadI18n(lang, cb) {
  _i18nLang = lang || 'auto';
  if (!lang || lang === 'auto') {
    _i18nDict = null;
    if (cb) {
      cb();
    }
    return;
  }
  fetch(`/_locales/${lang}/messages.json`)
    .then(r => r.json())
    .then(json => {
      _i18nDict = _i18nDict || {};
      _i18nDict[lang] = json;
      if (cb) {
        cb();
      }
    })
    .catch(() => {
      if (cb) {
        cb();
      }
    });
}
// Load language on startup and when changed
chrome.storage.sync.get({ language: 'auto' }, ({ language }) => preloadI18n(language));
chrome.storage.onChanged.addListener(changes => {
  if (changes.language) {
    preloadI18n(changes.language.newValue);
  }
});

let stateChanged = true;
let tabUrl = {};
// removed unused: urlList, domains, dupUrls

// Settings
let badgeColorSetting = 'green';

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
      sortTabs: false,
      badgeColor: 'green'
    },
    function (items) {
      if (chrome.runtime.lastError) {
        console.error('Error loading configs:', chrome.runtime.lastError);
        return;
      }

      autoClose = items.autoClose;
      currentWindowOnly = items.currentWindowOnly;
      sortTabs = items.sortTabs;
      badgeColorSetting = items.badgeColor || 'red';

      console.log('Loaded configs:', {
        autoClose,
        currentWindowOnly,
        sortTabs,
        badgeColor: badgeColorSetting
      });

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

function setBadgeTextAndColor(text, color) {
  chrome.action.setBadgeBackgroundColor({ color }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error setting badge color:', chrome.runtime.lastError);
      return;
    }
    chrome.action.setBadgeText({ text }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting badge text:', chrome.runtime.lastError);
      }
    });
  });
}

function setTitle(msg) {
  chrome.action.setTitle({ title: msg }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error setting title:', chrome.runtime.lastError);
    }
  });
}

// Helpers used by both badge and popup
function getDomain(url) {
  return url.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
}

function isCloseableUrl(url) {
  // Now we close duplicates for all normal URLs including chrome://newtab/ and about:blank
  // Keep a guard against empty/undefined values
  return Boolean(url);
}

function computeCountsFromTabs(tabs) {
  const urlCounts = {};
  const titles = {};
  let totalTabs = 0;

  tabs.forEach(t => {
    const real = extractRealUrl(t.url || '');
    urlCounts[real] = (urlCounts[real] || 0) + 1;
    titles[real] = t.title || titles[real] || real;
    totalTabs += 1;
  });

  const uniqueUrls = Object.keys(urlCounts).length;
  const duplicates = totalTabs - uniqueUrls;

  // Closeable duplicates exclude special URLs (e.g., New Tab)
  let duplicatesCloseable = 0;
  Object.entries(urlCounts).forEach(([url, count]) => {
    const dupsHere = Math.max(0, count - 1);
    if (isCloseableUrl(url)) {
      duplicatesCloseable += dupsHere;
    }
  });

  const duplicatesList = Object.entries(urlCounts)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([url, count]) => ({ url, count, title: titles[url] }));

  // Top domains by total tab occurrences
  const domainCounts = {};
  Object.keys(urlCounts).forEach(u => {
    const d = getDomain(u);
    domainCounts[d] = (domainCounts[d] || 0) + urlCounts[u];
  });
  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([domain, count]) => ({ domain, count }));

  return {
    totalTabs,
    uniqueUrls,
    duplicates,
    duplicatesCloseable,
    urlCounts,
    titles,
    duplicatesList,
    topDomains
  };
}

function getTopDomainsTitle(topDomains) {
  const list = topDomains.filter(a => a.count >= 5).map(a => `${a.count} : ${a.domain}`);
  return list.length > 0 ? `## Top Domains\n${list.join('\n')}\n` : '';
}

function refreshBadge() {
  if (!stateChanged) {
    return;
  }

  // Query tabs fresh to avoid cache divergence with popup
  queryTabsWithFilter(tabs => {
    const counts = computeCountsFromTabs(tabs);

    const tabsLabel = i18nGet('totalTabs', 'Tabs');
    const dupsLabel = i18nGet('duplicateTabs', 'Duplicates');
    let title = `${tabsLabel}: ${counts.totalTabs} || ${dupsLabel}: ${counts.duplicates}\n`;
    title += getTopDomainsTitle(counts.topDomains);

    if (counts.duplicates > 0) {
      setIcon('active');
      setBadgeTextAndColor(
        counts.duplicates.toString(),
        mapBadgeColor ? mapBadgeColor(badgeColorSetting) : [217, 48, 37, 255]
      );

      const dupListForTitle = Object.entries(counts.urlCounts)
        .filter(([, v]) => v && v > 1)
        .map(([url, c]) => {
          const safeTitle = counts.titles[url] ? counts.titles[url].slice(0, 50) : url.slice(0, 50);
          return `${c} : ${safeTitle}`;
        })
        .sort()
        .reverse();
      setTitle(
        title +
          '## ' +
          i18nGet('duplicateUrlsFound', 'Duplicate sites') +
          '\n' +
          dupListForTitle.join('\n')
      );
    } else {
      setIcon('inactive');
      setBadgeTextAndColor(counts.totalTabs.toString(), [128, 128, 128, 255]);
      setTitle(title);
    }

    stateChanged = false;
  });
}

// Expose minimal test hooks without breaking MV3 service worker
if (typeof globalThis !== 'undefined') {
  globalThis.__cdt_test = Object.assign(globalThis.__cdt_test || {}, {
    computeCountsFromTabs,
    isCloseableUrl,
    getDomain,
    refreshBadgeForTest: () => {
      stateChanged = true;
      refreshBadge();
    }
  });
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

chrome.tabs.onCreated.addListener(tab => {
  const realUrl = extractRealUrl(tab.url || '');
  tabUrl[tab.id] = {
    url: realUrl,
    title: tab.title || '',
    originalUrl: tab.url || '',
    isSuspended: Boolean(tab.url) && realUrl !== tab.url
  };
  stateChanged = true;
  refreshBadge();
  handleAutoClose();
});

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

chrome.tabs.onReplaced.addListener((_addedTabId, removedTabId) => {
  delete tabUrl[removedTabId];
  stateChanged = true;
  refreshBadge();
});

chrome.tabs.onActivated.addListener(_activeInfo => {
  stateChanged = true;
  refreshBadge();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    console.log('Settings changed:', changes);
    init();
  }
});

// Note: if a default_popup is set, onClicked won't fire. We keep this for users without popup.
chrome.action.onClicked.addListener(() => {
  console.log('Extension clicked - Settings:', { autoClose, currentWindowOnly, sortTabs });

  // Force refresh before closing duplicates to ensure accurate data
  forceRefreshAllTabs();

  // Small delay to allow refresh to complete
  setTimeout(() => {
    closeDuplicateTabs();
  }, 500);
});

// Listen for messages from popup/options
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === 'CLOSE_DUPLICATES') {
    closeDuplicateTabs();
    sendResponse({ ok: true });
    return true;
  }
  if (message && message.type === 'SET_AUTO_CLOSE') {
    chrome.storage.sync.set({ autoClose: Boolean(message.value) }, () => {
      sendResponse({ ok: !chrome.runtime.lastError, error: chrome.runtime.lastError?.message });
    });
    return true;
  }
  if (message && message.type === 'GET_COUNTS') {
    queryTabsWithFilter(tabs => {
      const counts = computeCountsFromTabs(tabs);
      sendResponse({
        ok: true,
        totalTabs: counts.totalTabs,
        duplicates: counts.duplicates,
        duplicatesCloseable: counts.duplicatesCloseable,
        uniqueUrls: counts.uniqueUrls,
        topDomains: counts.topDomains,
        duplicatesList: counts.duplicatesList,
        settings: { autoClose, currentWindowOnly, sortTabs }
      });
    });
    return true; // async response
  }
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

    // Group tabs by their real URL
    const groups = {};
    tabs.forEach(t => {
      const real = extractRealUrl(t.url);
      (groups[real] = groups[real] || []).push(t);
    });

    // Helper to select which tab to keep within a group deterministically
    const pickTabToKeep = group => {
      // 1) Prefer active tab among the group
      const actives = group.filter(t => t.active);
      if (actives.length === 1) {
        return actives[0];
      }
      if (actives.length > 1) {
        // If multiple active (different windows), pick the one with the smallest windowId then lowest id
        return actives.sort((a, b) => a.windowId - b.windowId || a.id - b.id)[0];
      }
      // 2) Then prefer pinned
      const pinneds = group.filter(t => t.pinned);
      if (pinneds.length > 0) {
        return pinneds.sort((a, b) => a.windowId - b.windowId || a.id - b.id)[0];
      }
      // 3) Fallback: the earliest by windowId then id for stability
      return group.sort((a, b) => a.windowId - b.windowId || a.id - b.id)[0];
    };

    const tabsToClose = [];
    Object.keys(groups).forEach(url => {
      const group = groups[url];
      if (group.length <= 1) {
        return;
      }
      const keep = pickTabToKeep(group);
      group.forEach(t => {
        if (t.id !== keep.id) {
          tabsToClose.push(t.id);
        }
      });
    });

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

// Keyboard shortcut to close duplicates
if (chrome.commands && chrome.commands.onCommand && chrome.commands.onCommand.addListener) {
  chrome.commands.onCommand.addListener(command => {
    if (command === 'close-duplicates') {
      closeDuplicateTabs();
    }
  });
}
