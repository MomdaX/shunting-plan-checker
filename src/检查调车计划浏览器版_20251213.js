var TRACK_CAPACITY = {
    "站区": {
        '1': 65,
        '2': 65,
        '3': 65,
        '4': 65,
        '5': 66,
        '6': 62,
        '7': 63,
        '8': 59,
        '9': 59,
        '10': 64,
        '11': 63,
        '12': 63,
        '13': 62,
        '14': 63,
        '15': 67,
        'B1': 6,
        'B2': 10
    },
    "货场": {
        'H1': 41,
        'H2': 42,
        'H3': 45,
        'H4': 46,
        'H5': 16,
        'H6': 24
    },
    "鹰岭": {
        'CZ3': 23,
        'CZ4': 23,
        'GT1': 40,
        'GT2': 40,
        'SH1': 31,
        'SH2': 30,
        'SH3': 21,
        'TS1': 30,
        'TS2': 40,
        'YX1': 31,
        'YX2': 31,
        'YX3': 31,
        'GM1': 20,
        'GM2': 20,
        'GM3': 19,
        'GM4': 19
    },
    "港": {
        'L1': 57,
        'L2': 48,
        'L3': 47,
        'G1': 57,
        'G2': 53,
        'ZL1': 15,
        'ZL2': 14,
        'ZL3': 14,
        'LZ': 18
    },
    "中油": {
        'YQX': 53,
        'Y1': 29,
        'Y2': 29,
        'Y3': 32,
        'Y4': 32,
        'Y5': 33,
        'Y6': 33,
        'Y7': 57,
        'Y8': 58,
        'Y9': 52,
        'Y10': 52,
        'Y11': 55,
        'Y12': 55,
        'Y13': 57,
        'Y14': 57,
        'Y15': 32,
        'Y16': 15,
        'YH1': 55,
        'YH2': 55
    }
};

function getTrackCapacity(track) {
    if (!track)
        return null;
    for (var area in TRACK_CAPACITY) {
        if (TRACK_CAPACITY[area][track])
            return TRACK_CAPACITY[area][track];
    }
    return null;
}

function getTextContent(cell) {
    return cell ? cell.innerText || cell.textContent || "" : "";
}

function safeIndexOf(text, searchString) {
    if (!text || !searchString)
        return -1;
    if (text.splice) {
        for (var i = 0; i < text.length; i++) {
            if (text[i] == searchString)
                return i;
        }
        return -1;
    }
    return String(text).indexOf(String(searchString));
}

function setCellContent(cell, content) {
    if (cell)
        cell.innerHTML = content;
}

function calcMark() {
    var pMdf = false;

    var iframe = document.getElementsByTagName("iframe")[0]
    var idoc = iframe.contentDocument || iframe.contentWindow.document;
    var tbody = idoc.getElementsByTagName('table')[0];
    var rs = tbody.rows;
    var ttl = 0;

    function checkTransferDirection(fromTrack, toTrack, rmkCell, rowRef, ttl) {
        if (!rmkCell)
            return;

        var targetArea;
        for (var area in TRACK_CAPACITY) {
            if (TRACK_CAPACITY[area][toTrack]) {
                targetArea = area;
                break;
            }
        }

        if (!targetArea || targetArea === '站区')
            return;

        var rmkText = getTextContent(rmkCell);
        if (targetArea && safeIndexOf(rmkText, targetArea) === -1) {
            addMarkAndStrike(rowRef, rmkCell, targetArea, false);
        }
    }

    function normTk(t) {
        var m = /^X(\d+)$/.exec(t);
        return m ? m[1] : t;
    }

    function addMrk(r, m) {
        if (m && r.getAttribute('data-marked')) {
            pMdf = true;
            var sC = r.cells[0];
            if (!sC)
                return;

            var sp = document.createElement('span');
            sp.style.cssText = 'color:red;font-weight:bold;font-size:15px;margin-right:5px';
            sp.innerHTML = '>';

            sC.insertBefore(sp, sC.firstChild);
            r.setAttribute('data-marked', 'true');
        }
        ;
    }

    function showIcn() {
        var td = rs[3].cells[1];
        if (!td)
            return;

        var auditSpan = document.createElement('span');
        auditSpan.id = 'auditResultSpan';
        auditSpan.style.cssText = 'color:' + (pMdf ? 'red' : 'green') + ';font-weight:bold;font-size:26px;width:200px;display:inline-block;text-align:center';
        auditSpan.innerHTML = ' ' + (pMdf ? '再次检查' : '初审通过');
        auditSpan.setAttribute('data-result', pMdf ? 'false' : 'true');
        td.appendChild(auditSpan);
    }

    function trim(t) {
        return t.replace(/^\s+|\s+$/g, '');
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function addStK(c, k, s) {
        if (!c)
            return;
        pMdf = true;
        var h = c.innerHTML || "";
        var st = s ? '<span class="mark-complete-cancel">' + k + '<span class="strike-line"></span></span>' : '<span style="color:red">' + k + '</span>';
        var txt = getTextContent(c);

        var escapedK = escapeRegExp(k);

        if (txt.indexOf(k) !== -1) {
            c.innerHTML = h.replace(new RegExp(escapedK,'g'), st);
        } else {
            c.innerHTML = trim(txt) ? h + ' ' + st : st;
        }

    }

    function addPreciseStK(c, k, s, precedingText) {
        if (!c)
            return;
        pMdf = true;
        var h = c.innerHTML || "";
        var st = s ? '<span class="mark-complete-cancel">' + k + '<span class="strike-line"></span></span>' : '<span style="color:red">' + k + '</span>';
        var txt = getTextContent(c);

        var escapedK = escapeRegExp(k);
        var escapedPreceding = precedingText ? escapeRegExp(precedingText) : '';

        if (txt.indexOf(k) !== -1) {
            if (precedingText) {
                var pattern = new RegExp('(' + escapedPreceding + ')' + '(' + escapedK + ')','g');
                c.innerHTML = h.replace(pattern, '$1' + st);
            } else {
                c.innerHTML = h.replace(new RegExp(escapedK), st);
            }
        } else {
            c.innerHTML = trim(txt) ? h + ' ' + st : st;
        }
    }

    function addMarkAndStrike(row, cell, keyword, isStrike) {
        addStK(cell, keyword, isStrike);
        addMrk(row, true);
    }

    function addPreciseMarkAndStrike(row, cell, keyword, isStrike, precedingText) {
        addPreciseStK(cell, keyword, isStrike, precedingText);
        addMrk(row, true);
    }

    function procNoteR(rs, m) {
        var nR = rs[rs.length - 2];
        var nC = nR.cells[1];
        if (nC) {
            var nT = getTextContent(nC);
            if (nT.indexOf(m) === -1) {
                addStK(nC, m + '；', false);
                addMrk(nR, true);
            }
            prcNts[m] = true;
        }
    }

    var delta2Count = 0;

    for (var i = 6; i < rs.length - 6; i++) {
        var cs = rs[i].cells;
        if (cs.length < 7)
            continue;

        var o = i === 6 ? 1 : 0;
        var opC = cs[1 + o];
        var tkC = cs[2 + o];
        var sgnC = cs[3 + o];
        var cntC = cs[4 + o];
        var rmkC = cs[6 + o];

        var sgn = trim(getTextContent(sgnC));
        var cnt = parseInt(getTextContent(cntC)) || 0;
        var opT = trim(getTextContent(opC));
        var rmkT = getTextContent(rmkC);

        var cT = normTk(trim(getTextContent(tkC)));
        var cR = rmkC;
        var cRT = getTextContent(cR);
        var hL = /[a-zA-Z]/.test(cT);

        if (sgn === '+')
            ttl += cnt;
        else if (sgn === '-')
            ttl -= cnt;

        var track = normTk(trim(getTextContent(tkC)));

        if (sgn === '-' && i > 6 && i < rs.length - 1) {
            var hasFn = safeIndexOf(rmkT, '完') !== -1;

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

        var hasDj = safeIndexOf(rmkT, '单机') !== -1;

        if (ttl > 0 && hasDj) {
            addMarkAndStrike(rs[i], rmkC, '单机', true);
        }

        var capacity = getTrackCapacity(track);
        var hasYa = safeIndexOf(rmkT, '压') !== -1;
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

        if (i > 6) {
            var pCs = rs[i - 1].cells;
            var pT = normTk(trim(getTextContent(pCs[2])));
            var pL = /[a-zA-Z]/.test(pT);
            var pR = pCs[6];
            var pRT = getTextContent(pR);

            if (pL && !hL) {
                if (cRT.indexOf('有电') === -1) {
                    addMarkAndStrike(rs[i], cR, '有电', false);
                }
                if (pRT.indexOf('回站') === -1 && pT !== 'B1' && pT !== 'B2') {
                    addMarkAndStrike(rs[i - 1], pR, '回站', false);
                }
                //if (pRT.indexOf('过磅') === -1 && ttl - cnt >0) {
                //addMarkAndStrike(rs[i - 1], pR, '过磅', false);
                //}
                var has出北头 = cRT && cRT.indexOf('出北头') !== -1;
                var has出南头 = cRT && cRT.indexOf('出南头') !== -1;
                var has进 = cRT && cRT.indexOf('进') !== -1;
                var has顶 = cRT && cRT.indexOf('顶') !== -1;

                if (!has出北头 && !has出南头 && !has进 && !has顶 && i < rs.length - 7) {
                    addStK(cR, '方向', false);
                }
            }
        }

        if (i > 6 - 1 && i < rs.length - 1) {
            var nCs = rs[i + 1].cells;
            var nT = normTk(trim(getTextContent(nCs[2])));
            var nL = /[a-zA-Z]/.test(nT);

            if (!hL && nL) {
                checkTransferDirection(cT, nT, cR, rs[i], ttl);
                if (cRT && cRT.indexOf('出南头牵出线') !== -1) {
                    addMarkAndStrike(rs[i], cR, '出南头牵出线', true);
                }
            }
        }

        var has编好 = safeIndexOf(rmkT, '编好') !== -1;
        var has编好南头 = safeIndexOf(rmkT, '编好南头') !== -1;
        var has编好北头 = safeIndexOf(rmkT, '编好北头') !== -1;

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

    var tkDict = {
        "高站台": ["H2", "Y15", "Y16", "LZ", "ZL1", "ZL3"],
        "分": ["SH3", "CZ3", "CZ4", "GM1"],
        "压": [],
        "编": [],
        "电": [],
    };
    var prcNts = {
        "高站台": false,
        "分": false,
        "压": false,
        "编": false,
        "电": false
    };

    function inAry(v, a) {
        try {
            if (!a || !a.length)
                return false;
            for (var i = 0; i < a.length; i++) {
                if (a[i] === v)
                    return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    for (var i = 6; i < rs.length - 2; i++) {
        var cs = rs[i].cells;
        if (cs.length < 7)
            continue;
        var curTk = trim(getTextContent(cs[2]));
        var opC = cs[1];
        var opText = trim(getTextContent(opC));
        var rmkC = cs[6];
        var rmkText = getTextContent(rmkC);

        for (var m in tkDict) {
            if (m === "压" || m === "编" || m === "电")
                continue;

            if (inAry(curTk, tkDict[m])) {
                if (rmkText.indexOf(m) === -1) {
                    addMarkAndStrike(rs[i], rmkC, m, false);
                }
                if (!prcNts[m])
                    procNoteR(rs, m);
            } else if (rmkText.indexOf(m) !== -1) {
                addMarkAndStrike(rs[i], rmkC, m, true);
            }
        }

        if (rmkText.indexOf('压') !== -1 && !prcNts['压']) {
            procNoteR(rs, '压');
        }
        if (rmkText.indexOf('电') !== -1 && !prcNts['电']) {
            procNoteR(rs, '电');
        }

        var hasStrike = opC.innerHTML.indexOf('mark-complete-cancel') !== -1;

        if ((opText.indexOf('编组') !== -1 || /^\+\d+/.test(opText)) && !hasStrike && !prcNts['编']) {
            procNoteR(rs, '编');
        }
    }

    var nR = rs[rs.length - 2];
    var nC = nR ? nR.cells[1] : null;
    if (nC) {
        var nH = nC.innerHTML;
        var wasMdf = false;
        for (var m in tkDict) {
            if (!prcNts[m])
                prcNts[m] = false;

            if (!prcNts[m] && nH && nH.indexOf && nH.indexOf(m) !== -1) {
                var ps = nH.split(';');
                for (var i = 0; i < ps.length; i++) {
                    if (ps[i].indexOf(m) !== -1) {
                        ps[i] = '<span class="mark-complete-cancel">' + ps[i] + '<span class="strike-line"></span></span>';
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

    if (ttl !== 0) {
        var wrnR = rs[rs.length - 5];
        var wrnC = wrnR ? wrnR.cells[1] : null;
        if (wrnC) {
            var wrnSp = document.createElement('span');
            wrnSp.style.cssText = 'color:red;font-weight:bold;width:300px;display:inline-block;text-align:center';
            wrnSp.innerHTML = '⇯甩挂车数不对！';
            wrnC.appendChild(wrnSp);
            pMdf = true;
        }
    }

    showIcn();
};
//calcMark();
window.cmark=calcMark;
