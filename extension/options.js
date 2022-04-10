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

// Event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);

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
