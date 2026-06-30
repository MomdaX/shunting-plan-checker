// DOM 元素
const checkBtn = document.getElementById('checkBtn');
const logContent = document.getElementById('logContent');
const monitorSwitch = document.getElementById('monitorSwitch');
const iframeSection = document.getElementById('iframeSection');
const iframeList = document.getElementById('iframeList');
const targetTitleInput = document.getElementById('targetTitleInput');

let currentTabId = null;
const DEFAULT_TITLE = '调车计划分析系统';

// ============ 目标标题管理 ============
function getTargetTitle() {
  return targetTitleInput.value.trim() || DEFAULT_TITLE;
}

async function saveTargetTitle() {
  const title = targetTitleInput.value.trim() || DEFAULT_TITLE;
  // 直接写 storage 确保持久化（即使 background 未就绪也不会丢）
  await chrome.storage.local.set({ targetTitle: title });
  // 同步通知 background
  try {
    await chrome.runtime.sendMessage({
      action: 'setTargetTitle',
      targetTitle: title
    });
  } catch (e) {
    // background 未就绪，不影响
  }
}

// 实时保存：输入时保存
targetTitleInput.addEventListener('input', saveTargetTitle);
// 兜底：失焦时也保存
targetTitleInput.addEventListener('change', saveTargetTitle);
// 回车：保存并立即手动检查
targetTitleInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    await saveTargetTitle();
    checkBtn.click();
  }
});

// ============ 初始化：获取当前 tab ID ============
async function initTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab ? tab.id : null;
}

// ============ UI 辅助函数 ============
function addLogEntry(log) {
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${log.type || 'info'}`;
  logEntry.textContent = `[${log.time}] ${log.message}`;
  logContent.appendChild(logEntry);
}

function refreshLogs(logs) {
  logContent.innerHTML = '';
  if (logs && logs.length > 0) {
    logs.forEach(log => addLogEntry(log));
  }
  logContent.scrollTop = logContent.scrollHeight;
}

function updateIframeList(iframes, monitorIframeIdx) {
  iframeList.innerHTML = '';

  if (!iframes || iframes.length === 0) {
    iframeSection.style.display = 'none';
    return;
  }

  iframes.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'iframe-item';
    const isChecked = item.checked;
    const isTarget = (idx === monitorIframeIdx);
    const indent = item.depth ? item.depth * 16 : 0;
    div.innerHTML = `
      <span class="iframe-index" style="margin-left:${indent}px;">#${idx + 1}</span>
      <span class="iframe-title-text">${item.title || '无标题'}</span>
      ${item.hasTable ? '<span style="color:#00ff00;font-size:10px;margin-left:4px;">含表格</span>' : ''}
      <span class="iframe-status ${isChecked ? 'checked' : 'pending'}">${isChecked ? '已检查' : '待检查'}</span>
      ${isTarget ? '<span style="color:#00bfff;font-size:10px;margin-left:4px;">目标</span>' : ''}
    `;
    iframeList.appendChild(div);
  });

  iframeSection.style.display = 'block';
}

// ============ 从 background 获取状态 ============
async function refreshStatus() {
  try {
    const status = await chrome.runtime.sendMessage({ action: 'getStatus' });
    if (!status) return;

    // 更新开关状态
    monitorSwitch.checked = status.enabled;

    // 更新目标标题输入框
    if (status.targetTitle) {
      targetTitleInput.value = status.targetTitle;
    }

    // 更新 iframe 列表
    updateIframeList(status.iframeList, status.monitorIframeIdx);

    // 更新日志
    refreshLogs(status.logs);
  } catch (e) {
    // background 可能未就绪
  }
}

// ============ 事件处理 ============

// 监测开关
monitorSwitch.addEventListener('change', async () => {
  if (monitorSwitch.checked) {
    await chrome.runtime.sendMessage({
      action: 'startMonitor',
      tabId: currentTabId,
      targetTitle: getTargetTitle()
    });
  } else {
    await chrome.runtime.sendMessage({ action: 'stopMonitor' });
  }
  // 刷新显示
  setTimeout(refreshStatus, 300);
});

// 手动检查
checkBtn.addEventListener('click', async () => {
  checkBtn.disabled = true;
  try {
    await chrome.runtime.sendMessage({
      action: 'manualCheck',
      tabId: currentTabId,
      targetTitle: getTargetTitle()
    });
  } catch (error) {
  } finally {
    checkBtn.disabled = false;
    setTimeout(refreshStatus, 300);
  }
});

// 监听 storage 变化，实时更新 UI
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.monitorState) {
    const state = changes.monitorState.newValue;
    if (state) {
      monitorSwitch.checked = state.enabled;
      updateIframeList(state.iframeList, state.monitorIframeIdx);
      refreshLogs(state.logs);
      if (state.targetTitle !== undefined) {
        targetTitleInput.value = state.targetTitle;
      }
    }
  }
});

// ============ 启动 ============
(async function init() {
  await initTab();
  // 先从 storage 直接恢复输入框（不受 background 状态影响）
  const stored = await chrome.storage.local.get('targetTitle');
  if (stored.targetTitle) {
    targetTitleInput.value = stored.targetTitle;
  }
  await refreshStatus();
})();
