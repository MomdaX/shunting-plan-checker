// ============ 常量 ============
const MONITOR_INTERVAL_MS = 2000; // 监测间隔 2 秒
const ALARM_NAME = 'monitor-keepalive';
const STORAGE_KEY = 'monitorState';
const DEFAULT_TITLE = '调车计划分析系统'; // 默认匹配标题

// ============ 监测状态 ============
let monitorTimerId = null;
let monitorTabId = null;
let targetTitle = DEFAULT_TITLE;

// 启动时从 storage 恢复 targetTitle
(async function initTargetTitle() {
  const state = await loadState();
  if (state && state.targetTitle) {
    targetTitle = state.targetTitle;
  }
})();

// ============ 根据 title 查找目标 iframe 索引 ============
function findTargetIframe(iframes, title) {
  const matchTitle = title || targetTitle || DEFAULT_TITLE;
  if (!iframes || iframes.length === 0) return -1;
  // 只精确匹配 title
  let idx = iframes.findIndex(f => f.title === matchTitle && f.hasTable);
  if (idx !== -1) return idx;
  idx = iframes.findIndex(f => f.title === matchTitle);
  return idx;
}

// ============ 图标更新 ============
function setIcon(active) {
  const iconPath = active ? 'icons/icon-active.png' : 'icons/icon-inactive.png';
  chrome.action.setIcon({ path: { 128: iconPath } });
}

// ============ 存储状态 ============
async function saveState(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

async function loadState() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || null;
}

// ============ 日志管理 ============
const MAX_LOGS = 50;

async function addLog(message, type) {
  const state = await loadState() || {};
  const logs = state.logs || [];
  logs.push({
    time: new Date().toLocaleTimeString(),
    message,
    type
  });
  if (logs.length > MAX_LOGS) logs.shift();
  state.logs = logs;
  await saveState(state);
}

// ============ 向 content script 发送消息 ============
async function sendToContent(tabId, action, args) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action, args });
    return response;
  } catch (e) {
    // content script 可能未注入或 tab 已关闭
    return null;
  }
}

// ============ 核心监测逻辑 ============
async function monitorTick() {
  try {
    // 获取当前监测的 tab
    let tab = null;
    try {
      tab = await chrome.tabs.get(monitorTabId);
    } catch (e) {
      // tab 不存在，尝试获取当前活动 tab
    }

    if (!tab || !tab.active) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        tab = activeTab;
        monitorTabId = tab.id;
        const st = await loadState() || {};
        st.monitorTabId = tab.id;
        await saveState(st);
      } else {
        return;
      }
    }

    // 1. 扫描 iframe
    const scanResult = await sendToContent(tab.id, 'scanIframes');
    if (!scanResult) return;

    const iframes = scanResult.iframes || [];

    // 更新 iframe 列表到 storage
    const state = await loadState() || {};
    state.iframeList = iframes;
    await saveState(state);

    // 2. 按标题自动匹配目标 iframe 并检查
    const targetIdx = findTargetIframe(iframes);
    if (targetIdx >= 0) {
      state.monitorIframeIdx = targetIdx;
      await saveState(state);

      const target = iframes[targetIdx];
      if (target && !target.checked) {
        await sendToContent(tab.id, 'checkIframe', { iframeIdx: targetIdx });
      }
    } else if (iframes.length > 0) {
      // 有 iframe 但没匹配到目标
      if (state.monitorIframeIdx !== -2) {
        state.monitorIframeIdx = -2;
        await saveState(state);
        await addLog(`未找到匹配的 iframe: "${targetTitle}"`, 'warning');
      }
    }
  } catch (e) {
    // 静默处理错误
  }

  // 更新状态时间戳
  const state = await loadState() || {};
  state.lastTick = Date.now();
  await saveState(state);
}

// ============ 启动监测 ============
async function startMonitor(tabId, customTitle) {
  // 先停止之前的监测
  await stopMonitor(false);

  monitorTabId = tabId;
  if (customTitle) {
    targetTitle = customTitle;
  }

  const state = {
    enabled: true,
    monitorTabId: tabId,
    monitorIframeIdx: -1,
    targetTitle: targetTitle,
    iframeList: [],
    logs: [],
    lastResult: null
  };
  await saveState(state);

  setIcon(true);
  await addLog('自动监测已开启', 'success');

  // 用 setTimeout 链实现周期性检查
  scheduleNextTick();

  // 创建 alarm 作为保活机制（每 1 分钟）
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
}

function scheduleNextTick() {
  monitorTimerId = setTimeout(async () => {
    const state = await loadState();
    if (state && state.enabled) {
      await monitorTick();
      scheduleNextTick();
    }
  }, MONITOR_INTERVAL_MS);
}

// ============ 停止监测 ============
async function stopMonitor(addLogEntry) {
  if (monitorTimerId) {
    clearTimeout(monitorTimerId);
    monitorTimerId = null;
  }

  try {
    await chrome.alarms.clear(ALARM_NAME);
  } catch (e) {}

  setIcon(false);

  const state = await loadState() || {};
  state.enabled = false;
  state.targetTitle = targetTitle;
  await saveState(state);

  if (addLogEntry !== false) {
    await addLog('自动监测已关闭', 'warning');
  }
}

// ============ 手动检查 ============
async function manualCheck(tabId, customTitle) {
  if (customTitle) targetTitle = customTitle;
  await addLog(`开始检查，匹配标题: ${targetTitle}`, 'info');

  const scanResult = await sendToContent(tabId, 'scanIframes');
  let targetIdx = -1;
  if (scanResult) {
    const iframes = scanResult.iframes || [];
    const state = await loadState() || {};
    state.iframeList = iframes;
    await saveState(state);

    // 按标题自动匹配目标 iframe
    targetIdx = findTargetIframe(iframes);
    if (targetIdx >= 0) {
      state.monitorIframeIdx = targetIdx;
      await saveState(state);
    }
  }

  if (targetIdx < 0) {
    await addLog(`未找到匹配的 iframe: "${targetTitle}"`, 'warning');
    const state = await loadState() || {};
    state.lastResult = { message: `未找到标题为 "${targetTitle}" 的 iframe`, hasError: true };
    await saveState(state);
    return;
  }

  const result = await sendToContent(tabId, 'checkIframe', { iframeIdx: targetIdx });
  if (result) {
    const state = await loadState() || {};
    state.lastResult = result;
    await saveState(state);
    await addLog(`检查完成: ${result.message}`, result.hasError ? 'error' : 'success');
  } else {
    await addLog('检查失败：无法连接到页面', 'error');
  }
}

// ============ 清除标记 ============
async function clearMarks(tabId, iframeIdx) {
  await sendToContent(tabId, 'clearMarks', { iframeIdx: iframeIdx || 0 });
  await addLog('已清除所有标记', 'success');

  const state = await loadState() || {};
  state.lastResult = null;
  await saveState(state);
}

// ============ 消息处理 ============
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    switch (request.action) {
      case 'startMonitor': {
        const tabId = request.tabId || (sender.tab ? sender.tab.id : null);
        await startMonitor(tabId, request.targetTitle);
        sendResponse({ success: true });
        break;
      }

      case 'stopMonitor': {
        await stopMonitor(true);
        sendResponse({ success: true });
        break;
      }

      case 'setTargetTitle': {
        targetTitle = request.targetTitle || DEFAULT_TITLE;
        const state = await loadState() || {};
        state.targetTitle = targetTitle;
        await saveState(state);
        sendResponse({ success: true });
        break;
      }

      case 'getStatus': {
        const state = await loadState();
        sendResponse({
          enabled: state ? state.enabled : false,
          monitorTabId: state ? state.monitorTabId : null,
          monitorIframeIdx: state ? (state.monitorIframeIdx != null ? state.monitorIframeIdx : -1) : -1,
          targetTitle: state ? (state.targetTitle || DEFAULT_TITLE) : DEFAULT_TITLE,
          iframeList: state ? (state.iframeList || []) : [],
          logs: state ? (state.logs || []) : [],
          lastResult: state ? state.lastResult : null,
          lastTick: state ? state.lastTick : 0
        });
        break;
      }

      case 'manualCheck': {
        const tabId = request.tabId || (sender.tab ? sender.tab.id : null);
        await manualCheck(tabId, request.targetTitle);
        sendResponse({ success: true });
        break;
      }

      case 'clearMarks': {
        const tabId = request.tabId || (sender.tab ? sender.tab.id : null);
        await clearMarks(tabId, -1);
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  })();
  return true; // 保持消息通道开放（异步响应）
});

// ============ Alarm 保活 ============
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const state = await loadState();
    if (state && state.enabled) {
      // 如果监测应该运行但 timeout 链断了，重新启动
      if (!monitorTimerId) {
        scheduleNextTick();
      }
    } else {
      await chrome.alarms.clear(ALARM_NAME);
    }
  }
});

// ============ Tab 关闭处理 ============
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === monitorTabId) {
    await stopMonitor(true);
  }
});

// ============ 启动时恢复状态 ============
(async function init() {
  setIcon(false);
  const state = await loadState();
  if (state && state.enabled) {
    // 之前的监测在 Service Worker 重启后已失效，重置为关闭
    state.enabled = false;
    await saveState(state);
    await addLog('浏览器重启，监测已自动停止', 'warning');
  }
})();
