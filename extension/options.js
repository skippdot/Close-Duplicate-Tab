// Saves options to chrome.storage
function saveOptions() {
  const autoClose = document.getElementById('autoClose') ? document.getElementById('autoClose').checked : false;
  const currentWindowOnly = document.getElementById('currentWindowOnly') ? document.getElementById('currentWindowOnly').checked : false;
  const sortTabs = document.getElementById('sortTabs').checked;

  chrome.storage.sync.set({
    autoClose: autoClose,
    currentWindowOnly: currentWindowOnly,
    sortTabs: sortTabs
  }, function () {
    if (chrome.runtime.lastError) {
      console.error('Error saving options:', chrome.runtime.lastError);
      return;
    }

    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get({
    autoClose: false,
    currentWindowOnly: false,
    sortTabs: false
  }, function (items) {
    if (chrome.runtime.lastError) {
      console.error('Error loading options:', chrome.runtime.lastError);
      return;
    }

    if (document.getElementById('autoClose')) {
      document.getElementById('autoClose').checked = items.autoClose;
    }
    if (document.getElementById('currentWindowOnly')) {
      document.getElementById('currentWindowOnly').checked = items.currentWindowOnly;
    }
    document.getElementById('sortTabs').checked = items.sortTabs;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);