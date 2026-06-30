// 股道容量配置
const TRACK_CAPACITY = {
  "站区": {
    '1': 65, '2': 65, '3': 65, '4': 65, '5': 66, '6': 62, '7': 63, '8': 59,
    '9': 59, '10': 64, '11': 63, '12': 63, '13': 62, '14': 63, '15': 67,
    'B1': 6, 'B2': 10
  },
  "货场": {
    'H1': 41, 'H2': 42, 'H3': 45, 'H4': 46, 'H5': 16, 'H6': 24
  },
  "鹰岭": {
    'CZ3': 23, 'CZ4': 23, 'GT1': 40, 'GT2': 40, 'SH1': 31, 'SH2': 30,
    'SH3': 21, 'TS1': 30, 'TS2': 40, 'YX1': 31, 'YX2': 31, 'YX3': 31,
    'GM1': 20, 'GM2': 20, 'GM3': 19, 'GM4': 19
  },
  "港": {
    'L1': 57, 'L2': 48, 'L3': 47, 'G1': 57, 'G2': 53,
    'ZL1': 15, 'ZL2': 14, 'ZL3': 14, 'LZ': 18
  },
  "中油": {
    'YQX': 53, 'Y1': 29, 'Y2': 29, 'Y3': 32, 'Y4': 32, 'Y5': 33, 'Y6': 33,
    'Y7': 57, 'Y8': 58, 'Y9': 52, 'Y10': 52, 'Y11': 55, 'Y12': 55,
    'Y13': 57, 'Y14': 57, 'Y15': 32, 'Y16': 15, 'YH1': 55, 'YH2': 55
  }
};

// 获取股道容量
function getTrackCapacity(track) {
  if (!track) return null;
  for (const area in TRACK_CAPACITY) {
    if (TRACK_CAPACITY[area][track]) return TRACK_CAPACITY[area][track];
  }
  return null;
}

// 安全获取文本内容
function getTextContent(cell) {
  return cell ? cell.innerText || cell.textContent || "" : "";
}

// 安全查找索引
function safeIndexOf(text, searchString) {
  if (!text || !searchString) return -1;
  if (Array.isArray(text)) {
    return text.indexOf(searchString);
  }
  return String(text).indexOf(String(searchString));
}

// 规范化股道号
function normTk(t) {
  const m = /^X(\d+)$/.exec(t);
  return m ? m[1] : t;
}

// 转义正则表达式
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 修剪空格
function trim(t) {
  return t.replace(/^\s+|\s+$/g, '');
}

// 添加标记和删除线
function addStK(cell, keyword, isStrike) {
  if (!cell) return;
  const h = cell.innerHTML || "";
  const st = isStrike
    ? `<span class="mark-complete-cancel">${keyword}<span class="strike-line"></span></span>`
    : `<span style="color:red">${keyword}</span>`;
  const txt = getTextContent(cell);
  const escapedK = escapeRegExp(keyword);

  if (txt.indexOf(keyword) !== -1) {
    cell.innerHTML = h.replace(new RegExp(escapedK, 'g'), st);
  } else {
    cell.innerHTML = trim(txt) ? h + ' ' + st : st;
  }
}

// 精确标记
function addPreciseStK(cell, keyword, isStrike, precedingText) {
  if (!cell) return;
  const h = cell.innerHTML || "";
  const st = isStrike
    ? `<span class="mark-complete-cancel">${keyword}<span class="strike-line"></span></span>`
    : `<span style="color:red">${keyword}</span>`;
  const txt = getTextContent(cell);
  const escapedK = escapeRegExp(keyword);
  const escapedPreceding = precedingText ? escapeRegExp(precedingText) : '';

  if (txt.indexOf(keyword) !== -1) {
    if (precedingText) {
      const pattern = new RegExp('(' + escapedPreceding + ')(' + escapedK + ')', 'g');
      cell.innerHTML = h.replace(pattern, '$1' + st);
    } else {
      cell.innerHTML = h.replace(new RegExp(escapedK), st);
    }
  } else {
    cell.innerHTML = trim(txt) ? h + ' ' + st : st;
  }
}

// 添加行标记
function addMrk(row, mark) {
  if (mark && row.getAttribute('data-marked')) return;
  if (mark) {
    const sC = row.cells[0];
    if (!sC) return;
    const sp = document.createElement('span');
    sp.style.cssText = 'color:red;font-weight:bold;font-size:15px;margin-right:5px';
    sp.innerHTML = '>';
    sC.insertBefore(sp, sC.firstChild);
    row.setAttribute('data-marked', 'true');
  }
}

// 添加标记并标记行
function addMarkAndStrike(row, cell, keyword, isStrike) {
  addStK(cell, keyword, isStrike);
  addMrk(row, true);
}

// 精确标记
function addPreciseMarkAndStrike(row, cell, keyword, isStrike, precedingText) {
  addPreciseStK(cell, keyword, isStrike, precedingText);
  addMrk(row, true);
}

// 检查转场方向
function checkTransferDirection(fromTrack, toTrack, rmkCell, rowRef) {
  if (!rmkCell) return;
  let targetArea = null;
  for (const area in TRACK_CAPACITY) {
    if (TRACK_CAPACITY[area][toTrack]) {
      targetArea = area;
      break;
    }
  }
  if (!targetArea || targetArea === '站区') return;
  const rmkText = getTextContent(rmkCell);
  if (targetArea && safeIndexOf(rmkText, targetArea) === -1) {
    addMarkAndStrike(rowRef, rmkCell, targetArea, false);
  }
}

// 在数组中查找
function inAry(v, a) {
  try {
    if (!a || !a.length) return false;
    return a.includes(v);
  } catch (e) {
    return false;
  }
}

// 处理备注行
function procNoteR(rs, keyword, prcNts) {
  const nR = rs[rs.length - 2];
  const nC = nR.cells[1];
  if (nC) {
    const nT = getTextContent(nC);
    if (nT.indexOf(keyword) === -1) {
      addStK(nC, keyword + '；', false);
      addMrk(nR, true);
    }
    prcNts[keyword] = true;
  }
}

// 递归在文档中查找包含表格的最深层文档
// 返回 { doc, iframePath } — iframePath 是从起始文档到目标文档的索引路径
function findTableDoc(doc, path) {
  path = path || [];
  const tables = doc.getElementsByTagName('table');
  if (tables && tables.length > 0) {
    return { doc: doc, iframePath: path };
  }
  // 递归搜索嵌套 iframe
  const iframes = doc.getElementsByTagName('iframe');
  for (let i = 0; i < iframes.length; i++) {
    try {
      const idoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
      const result = findTableDoc(idoc, path.concat([i]));
      if (result) return result;
    } catch (e) {
      // 跨域跳过
    }
  }
  return null;
}

// 递归在文档中查找指定 id 的元素所在文档
function findElementDoc(doc, elementId) {
  if (doc.getElementById(elementId)) return doc;
  const iframes = doc.getElementsByTagName('iframe');
  for (let i = 0; i < iframes.length; i++) {
    try {
      const idoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
      const result = findElementDoc(idoc, elementId);
      if (result) return result;
    } catch (e) {}
  }
  return null;
}

// 递归扫描所有 iframe（包含嵌套层级），展平为一维数组
// 每个条目带 iframePath（索引路径数组）和 depth
function scanIframesRecursive(doc, depth) {
  depth = depth || 0;
  const iframes = doc.getElementsByTagName('iframe');
  const result = [];
  for (let i = 0; i < iframes.length; i++) {
    try {
      const idoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
      const titleEl = idoc.querySelector('title');
      const h1El = idoc.querySelector('h1');
      const hasAuditResult = idoc.getElementById('auditResultSpan') !== null;
      const hasTable = (idoc.getElementsByTagName('table').length > 0);

      // 根据是否包含表格决定 title 的优先级
      let title = (titleEl ? titleEl.textContent : '') || (h1El ? h1El.textContent : '');
      const prefix = depth > 0 ? '↳ '.repeat(depth) : '';

      result.push({
        index: result.length,
        iframeIndex: i,        // 当前层级中的索引
        depth: depth,
        title: title || (prefix + 'iframe ' + (i + 1)),
        src: iframes[i].src || iframes[i].getAttribute('src') || '',
        checked: hasAuditResult,
        hasTable: hasTable
      });

      // 继续递归搜索嵌套 iframe
      const nested = scanIframesRecursive(idoc, depth + 1);
      result.push.apply(result, nested);
    } catch (e) {
      result.push({
        index: result.length,
        iframeIndex: i,
        depth: depth,
        title: 'iframe ' + (i + 1) + ' (跨域)',
        src: '',
        checked: false,
        hasTable: false
      });
    }
  }
  return result;
}

// 对外接口：扫描所有 iframe
function scanIframes() {
  return scanIframesRecursive(document, 0);
}

// 根据展平索引找到对应的 iframe 并获取其 document
// 返回 { doc, iframePath }
function getIframeDocByFlatIndex(flatIndex) {
  const allIframes = scanIframesRecursive(document, 0);
  if (flatIndex < 0 || flatIndex >= allIframes.length) return null;

  // 构建路径：从根文档开始，按每个 iframe 的 iframeIndex 逐层进入
  let currentDoc = document;
  // 需要收集路径，重新扫描时保留路径信息
  const pathResult = getIframePathByFlatIndex(document, flatIndex, 0);
  if (!pathResult) return null;

  currentDoc = document;
  for (const idx of pathResult.path) {
    const iframes = currentDoc.getElementsByTagName('iframe');
    if (!iframes || idx >= iframes.length) return null;
    try {
      currentDoc = iframes[idx].contentDocument || iframes[idx].contentWindow.document;
    } catch (e) {
      return null;
    }
  }
  return { doc: currentDoc, iframePath: pathResult.path };
}

function getIframePathByFlatIndex(doc, targetIdx, currentIdx) {
  const iframes = doc.getElementsByTagName('iframe');
  let counter = currentIdx;
  for (let i = 0; i < iframes.length; i++) {
    if (counter === targetIdx) {
      return { path: [i], found: true };
    }
    counter++;
    try {
      const idoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
      const nested = getIframePathByFlatIndex(idoc, targetIdx, counter);
      if (nested && nested.found) {
        return { path: [i].concat(nested.path), found: true };
      }
      // 更新 counter，跳过已扫描的嵌套 iframe
      counter = nested ? nested.nextIdx : counter + countNestedIframes(idoc);
    } catch (e) {
      counter++; // 跨域 iframe 算一个但无法进入
    }
  }
  return null;
}

function countNestedIframes(doc) {
  let count = 0;
  const iframes = doc.getElementsByTagName('iframe');
  for (const iframe of iframes) {
    count++; // 当前 iframe
    try {
      const idoc = iframe.contentDocument || iframe.contentWindow.document;
      count += countNestedIframes(idoc);
    } catch (e) {}
  }
  return count;
}

// 主要检查逻辑
function calcMark(iframeIdx) {
  let pMdf = false;
  let tables = null;
  let tbody = null;
  let targetDoc = null;

  if (iframeIdx !== undefined && iframeIdx !== null) {
    // 通过展平索引定位到任意嵌套深度的 iframe
    const iframeInfo = getIframeDocByFlatIndex(iframeIdx);
    if (!iframeInfo) {
      return { success: false, error: '未找到指定的 iframe (索引 ' + iframeIdx + ')', hasError: true };
    }
    targetDoc = iframeInfo.doc;
    tables = targetDoc.getElementsByTagName('table');
  } else {
    // 递归搜索：从主文档开始，深入嵌套 iframe 找到表格
    const tableDocResult = findTableDoc(document);
    if (tableDocResult) {
      targetDoc = tableDocResult.doc;
      tables = targetDoc.getElementsByTagName('table');
    }
  }
  
  if (!tables || tables.length === 0) {
    return { success: false, error: '未找到表格元素', hasError: true };
  }
  
  tbody = tables[0];
  const rs = tbody.rows;
  let ttl = 0;

  // 遍历数据行
  for (let i = 6; i < rs.length - 6; i++) {
    const cs = rs[i].cells;
    if (cs.length < 7) continue;

    const o = i === 6 ? 1 : 0;
    const opC = cs[1 + o];
    const tkC = cs[2 + o];
    const sgnC = cs[3 + o];
    const cntC = cs[4 + o];
    const rmkC = cs[6 + o];

    const sgn = trim(getTextContent(sgnC));
    const cnt = parseInt(getTextContent(cntC)) || 0;
    const opT = trim(getTextContent(opC));
    const rmkT = getTextContent(rmkC);
    const cT = normTk(trim(getTextContent(tkC)));
    const cR = rmkC;
    const cRT = getTextContent(cR);
    const hL = /[a-zA-Z]/.test(cT);

    // 计算总数
    if (sgn === '+') ttl += cnt;
    else if (sgn === '-') ttl -= cnt;

    const track = normTk(trim(getTextContent(tkC)));

    // 检查"完"标记
    if (sgn === '-' && i > 6 && i < rs.length - 1) {
      const hasFn = safeIndexOf(rmkT, '完') !== -1;
      if (ttl < 0) {
        cntC.style.color = 'red';
        cntC.style.fontWeight = 'bold';
        cntC.style.borderBottom = '2px solid red';
      }
      if (ttl > 0 && hasFn) {
        addMarkAndStrike(rs[i], rmkC, '完', true);
      } else if (ttl === 0 && !hasFn && cnt > 0) {
        addMarkAndStrike(rs[i], rmkC, '完', false);
      }
    }

    // 检查"单机"
    const hasDj = safeIndexOf(rmkT, '单机') !== -1;
    if (ttl > 0 && hasDj) {
      addMarkAndStrike(rs[i], rmkC, '单机', true);
    }

    // 检查股道容量"压"
    const capacity = getTrackCapacity(track);
    const hasYa = safeIndexOf(rmkT, '压') !== -1;
    if (sgn === '+') {
      if (ttl > capacity && !hasYa && cnt > 0) {
        addMarkAndStrike(rs[i], rmkC, '压', false);
      }
    } else if (sgn === '-') {
      if ((ttl + cnt) > capacity && !hasYa && cnt > 0) {
        addMarkAndStrike(rs[i], rmkC, '压', false);
      } else if ((ttl + cnt + 2) < capacity && hasYa && cnt > 0 && hL) {
        addMarkAndStrike(rs[i], rmkC, '压', true);
      }
    }

    // 检查"有电"、"回站"、"方向"
    if (i > 6) {
      const pCs = rs[i - 1].cells;
      const pT = normTk(trim(getTextContent(pCs[2])));
      const pL = /[a-zA-Z]/.test(pT);
      const pR = pCs[6];
      const pRT = getTextContent(pR);

      if (pL && !hL) {
        if (cRT.indexOf('有电') === -1) {
          addMarkAndStrike(rs[i], cR, '有电', false);
        }
        if (pRT.indexOf('回站') === -1 && pT !== 'B1' && pT !== 'B2') {
          addMarkAndStrike(rs[i - 1], pR, '回站', false);
        }
        const has出北头 = cRT && cRT.indexOf('出北头') !== -1;
        const has出南头 = cRT && cRT.indexOf('出南头') !== -1;
        const has进 = cRT && cRT.indexOf('进') !== -1;
        const has顶 = cRT && cRT.indexOf('顶') !== -1;

        if (!has出北头 && !has出南头 && !has进 && !has顶 && i < rs.length - 7) {
          addStK(cR, '方向', false);
        }
      }
    }

    // 检查转场方向
    if (i > 6 - 1 && i < rs.length - 1) {
      const nCs = rs[i + 1].cells;
      const nT = normTk(trim(getTextContent(nCs[2])));
      const nL = /[a-zA-Z]/.test(nT);

      if (!hL && nL) {
        checkTransferDirection(cT, nT, cR, rs[i]);
        if (cRT && cRT.indexOf('出南头牵出线') !== -1) {
          addMarkAndStrike(rs[i], cR, '出南头牵出线', true);
        }
      }
    }

    // 检查"编组"、"编好"
    const has编好 = safeIndexOf(rmkT, '编好') !== -1;
    const has编好南头 = safeIndexOf(rmkT, '编好南头') !== -1;
    const has编好北头 = safeIndexOf(rmkT, '编好北头') !== -1;

    if (has编好 && !has编好南头 && !has编好北头) {
      if (opT === '') {
        addMarkAndStrike(rs[i], opC, '编组', false);
      }
    } else if (opT.indexOf('编组') !== -1) {
      addMarkAndStrike(rs[i], opC, '编组', true);
    } else if (/^\+/.test(opT)) {
      if (!has编好) {
        addMarkAndStrike(rs[i], rmkC, '编好', false);
      }
      if (has编好北头) {
        addPreciseMarkAndStrike(rs[i], rmkC, '北头', true, '编好');
      }
      if (has编好南头) {
        addPreciseMarkAndStrike(rs[i], rmkC, '南头', true, '编好');
      }
    }
  }

  // 特殊股道检查
  const tkDict = {
    "高站台": ["H2", "Y15", "Y16", "LZ", "ZL1", "ZL3"],
    "分": ["SH3", "CZ3", "CZ4", "GM1"],
    "压": [],
    "编": [],
    "电": [],
  };
  const prcNts = { "高站台": false, "分": false, "压": false, "编": false, "电": false };

  for (let i = 6; i < rs.length - 2; i++) {
    const cs = rs[i].cells;
    if (cs.length < 7) continue;
    const curTk = trim(getTextContent(cs[2]));
    const opC = cs[1];
    const opText = trim(getTextContent(opC));
    const rmkC = cs[6];
    const rmkText = getTextContent(rmkC);

    for (const m in tkDict) {
      if (m === "压" || m === "编" || m === "电") continue;
      if (inAry(curTk, tkDict[m])) {
        if (rmkText.indexOf(m) === -1) {
          addMarkAndStrike(rs[i], rmkC, m, false);
        }
        if (!prcNts[m]) procNoteR(rs, m, prcNts);
      } else if (rmkText.indexOf(m) !== -1) {
        addMarkAndStrike(rs[i], rmkC, m, true);
      }
    }

    if (rmkText.indexOf('压') !== -1 && !prcNts['压']) {
      procNoteR(rs, '压', prcNts);
    }
    if (rmkText.indexOf('电') !== -1 && !prcNts['电']) {
      procNoteR(rs, '电', prcNts);
    }

    const hasStrike = opC.innerHTML.indexOf('mark-complete-cancel') !== -1;
    if ((opText.indexOf('编组') !== -1 || /^\+\d+/.test(opText)) && !hasStrike && !prcNts['编']) {
      procNoteR(rs, '编', prcNts);
    }
  }

  // 处理备注行标记清理
  const nR = rs[rs.length - 2];
  const nC = nR ? nR.cells[1] : null;
  if (nC) {
    let nH = nC.innerHTML;
    let wasMdf = false;
    for (const m in tkDict) {
      if (!prcNts[m]) prcNts[m] = false;
      if (!prcNts[m] && nH && nH.indexOf && nH.indexOf(m) !== -1) {
        const ps = nH.split(';');
        for (let i = 0; i < ps.length; i++) {
          if (ps[i].indexOf(m) !== -1) {
            ps[i] = `<span class="mark-complete-cancel">${m}<span class="strike-line"></span></span>`;
          }
        }
        nH = ps.join(';');
        wasMdf = true;
      }
    }
    if (wasMdf) {
      nC.innerHTML = nH;
      addMrk(nR, true);
    }
  }

  // 检查甩挂车数
  if (ttl !== 0) {
    const wrnR = rs[rs.length - 5];
    const wrnC = wrnR ? wrnR.cells[1] : null;
    if (wrnC) {
      const wrnSp = document.createElement('span');
      wrnSp.style.cssText = 'color:red;font-weight:bold;width:300px;display:inline-block;text-align:center';
      wrnSp.innerHTML = '?甩挂车数不对！';
      wrnC.appendChild(wrnSp);
      pMdf = true;
    }
  }

  // 显示结果
  const td = rs[3].cells[1];
  if (td) {
    const auditSpan = document.createElement('span');
    auditSpan.id = 'auditResultSpan';
    auditSpan.style.cssText = 'color:' + (pMdf ? 'red' : 'green') + ';font-weight:bold;font-size:26px;width:200px;display:inline-block;text-align:center';
    auditSpan.innerHTML = ' ' + (pMdf ? '再次检查' : '初审通过');
    auditSpan.setAttribute('data-result', pMdf ? 'false' : 'true');
    td.appendChild(auditSpan);
  }

  return {
    success: true,
    message: pMdf ? '再次检查' : '初审通过',
    hasError: pMdf
  };
}

// 清除所有标记（支持嵌套 iframe）
function clearMarks(iframeIdx) {
  let targetDoc = null;

  if (iframeIdx !== undefined && iframeIdx !== null && iframeIdx >= 0) {
    const iframeInfo = getIframeDocByFlatIndex(iframeIdx);
    if (!iframeInfo) return { success: false };
    targetDoc = iframeInfo.doc;
  } else {
    // 递归查找包含表格或 auditResultSpan 的文档
    targetDoc = findElementDoc(document, 'auditResultSpan');
    if (!targetDoc) {
      const tableResult = findTableDoc(document);
      if (tableResult) targetDoc = tableResult.doc;
    }
  }

  if (!targetDoc) return { success: false };

  const tables = targetDoc.getElementsByTagName('table');
  if (!tables || tables.length === 0) return { success: false };
  
  const tbody = tables[0];
  const rs = tbody.rows;

  // 移除所有标记
  for (let i = 0; i < rs.length; i++) {
    const row = rs[i];
    row.removeAttribute('data-marked');
    
    // 移除标记符号
    const firstCell = row.cells[0];
    if (firstCell) {
      const spans = firstCell.querySelectorAll('span');
      spans.forEach(span => {
        if (span.innerHTML === '>') span.remove();
      });
    }
    
    // 移除红色标记和删除线
    const cells = row.cells;
    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      const markSpans = cell.querySelectorAll('.mark-complete-cancel, span[style*="color:red"]');
      markSpans.forEach(span => {
        const text = span.textContent || span.innerText;
        span.outerHTML = text;
      });
    }
  }

  // 移除审核结果
  const auditSpan = targetDoc.getElementById('auditResultSpan');
  if (auditSpan) auditSpan.remove();

  return { success: true };
}

// 监听来自popup和background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'scanIframes') {
      const iframes = scanIframes();
      sendResponse({ iframes });
    } else if (request.action === 'checkIframe') {
      const iframeIdx = request.args ? request.args.iframeIdx : undefined;
      const result = calcMark(iframeIdx);
      sendResponse(result);
    } else if (request.action === 'clearMarks') {
      const iframeIdx = request.args ? request.args.iframeIdx : 0;
      const result = clearMarks(iframeIdx);
      sendResponse(result);
    } else if (request.action === 'check') {
      // 兼容旧版 popup 直接调用
      const result = calcMark();
      sendResponse(result);
    } else if (request.action === 'clear') {
      // 兼容旧版 popup 直接调用
      const result = clearMarks();
      sendResponse(result);
    } else {
      sendResponse({ success: false, error: 'Unknown action: ' + request.action });
    }
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message,
      hasError: true
    });
  }
  return true; // 保持消息通道开放
});