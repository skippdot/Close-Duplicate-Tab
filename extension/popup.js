// Global language override for popup (applies to text content and title attributes)
function applyPopupI18nOverride() {
  try {
    chrome.storage.sync.get({ language: 'auto' }, ({ language }) => {
      if (!language || language === 'auto') {
        return;
      }
      fetch(`_locales/${language}/messages.json`)
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
          document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const msg = getMsg(key);
            if (msg) {
              el.title = msg;
            }
          });
          const titleEl = document.querySelector('title');
          const titleMsg = getMsg('extensionName');
          if (titleEl && titleMsg) {
            titleEl.textContent = titleMsg;
          }
        });
    });
  } catch {
    // ignore
  }
}

function renderCounts(total, dups) {
  const el = document.getElementById('counts');
  el.innerHTML = `<span class="total">${total}</span> <span class="dups">(${dups})</span>`;
}

function renderDomains(domains) {
  const list = document.getElementById('domains');
  list.innerHTML = '';
  domains.forEach(({ domain, count }) => {
    const row = document.createElement('div');
    row.className = 'domain';
    row.innerHTML = `<span>${domain}</span><span class="count">${count}</span>`;
    list.appendChild(row);
  });
}

function renderDuplicates(dups) {
  const list = document.getElementById('dupList');
  const section = document.getElementById('dupSection');
  list.innerHTML = '';
  if (!dups || dups.length === 0) {
    if (section) {
      section.style.display = 'none';
    }
    return;
  }
  if (section) {
    section.style.display = 'block';
  }
  dups.forEach(({ url, count, title, duplicatesToClose }) => {
    const row = document.createElement('div');
    row.className = 'dup';
    const safeTitle = title && title.length > 70 ? title.slice(0, 70) + '…' : title || url;
    const dupCount =
      typeof duplicatesToClose === 'number' ? duplicatesToClose : Math.max(0, (count || 0) - 1);
    row.innerHTML = `<span title="${url}">${safeTitle}</span><span class="count">${dupCount}×</span>`;
    list.appendChild(row);
  });
}

function setAutoCloseToggle(checked) {
  const toggle = document.getElementById('autoCloseToggle');
  if (toggle) {
    toggle.checked = !!checked;
  }
}

function refresh() {
  chrome.runtime.sendMessage({ type: 'GET_COUNTS' }, resp => {
    if (!resp || !resp.ok) {
      return;
    }
    const dupsToClose =
      typeof resp.duplicatesCloseable === 'number' ? resp.duplicatesCloseable : resp.duplicates;

    // Prepare duplicates list with "to close" numbers for clearer UI
    const dupList = (resp.duplicatesList || []).map(item => ({
      ...item,
      duplicatesToClose: Math.max(0, (item.count || 0) - 1)
    }));

    renderCounts(resp.totalTabs, dupsToClose);
    renderDuplicates(dupList);
    renderDomains(resp.topDomains || []);
    setAutoCloseToggle(resp.settings?.autoClose);

    const closeBtn = document.getElementById('closeDupsBtn');
    closeBtn.disabled = (dupsToClose || 0) === 0;
    closeBtn.title = closeBtn.disabled ? 'No closeable duplicates' : 'Close duplicate tabs now';
  });
}

// Wire buttons
const closeBtn = document.getElementById('closeDupsBtn');
closeBtn.disabled = true;
closeBtn.addEventListener('click', () => {
  if (closeBtn.disabled) {
    return;
  }
  chrome.runtime.sendMessage({ type: 'CLOSE_DUPLICATES' }, () => {
    setTimeout(refresh, 600);
  });
  // Apply i18n override on load
  applyPopupI18nOverride();
});

document.getElementById('openSettingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Initial load
refresh();
window.addEventListener('focus', refresh);
