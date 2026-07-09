const MESSAGE = {
  GET_STATUS: "CF_CAPTURE_GET_STATUS",
  EXTRACT: "CF_CAPTURE_EXTRACT",
  START_EXPORT: "CF_CAPTURE_START_EXPORT",
  START_EXPORT_FROM_PAGE: "CF_CAPTURE_START_EXPORT_FROM_PAGE",
  PAGE_STATUS: "CF_CAPTURE_PAGE_STATUS",
  PRINT_READY: "CF_CAPTURE_PRINT_READY",
  PRINT_FAILED: "CF_CAPTURE_PRINT_FAILED",
  PRINT_STATUS: "CF_CAPTURE_PRINT_STATUS",
  TRIGGER_PRINT: "CF_CAPTURE_TRIGGER_PRINT"
};

const activePrintSessions = new Map();
const completedPrintMessages = new Map();
const runningExports = new Map();
const EXPORT_STORAGE_PREFIX = "cfStatementCapture:";
const EXPORT_SESSION_TTL_MS = 6 * 60 * 60 * 1000;

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#1f2937" });
  cleanupStaleExportSessions().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  cleanupStaleExportSessions().catch(() => {});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === MESSAGE.PAGE_STATUS && sender.tab?.id) {
    updateActionBadge(sender.tab.id, message.status);
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === MESSAGE.START_EXPORT) {
    startExportForActiveTab(message.mode || "pdf", getExportOptions(message))
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: getErrorMessage(error) }));
    return true;
  }

  if (message?.type === MESSAGE.START_EXPORT_FROM_PAGE && sender.tab?.id) {
    startExportWithLock(sender.tab.id, message.mode || "pdf", getExportOptions(message))
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: getErrorMessage(error) }));
    return true;
  }

  if (message?.type === MESSAGE.PRINT_READY) {
    if (message.sessionId) {
      completedPrintMessages.set(message.sessionId, {
        ok: true,
        message
      });
    }
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === MESSAGE.PRINT_FAILED) {
    if (message.sessionId) {
      completedPrintMessages.set(message.sessionId, {
        ok: false,
        error: message.error || "Print page failed"
      });
    }
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  for (const [sessionId, active] of activePrintSessions.entries()) {
    if (active.tabId === tabId) {
      completedPrintMessages.set(sessionId, {
        ok: false,
        error: "Print tab was closed before it became ready"
      });
      activePrintSessions.delete(sessionId);
    }
  }
});

async function startExportForActiveTab(mode, options) {
  const [tab] = await chromeCall(chrome.tabs, "query", { active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab found");
  }
  return startExportWithLock(tab.id, mode, options);
}

function startExportWithLock(sourceTabId, mode, options) {
  const key = `${sourceTabId}:${mode}:${options.includeCover ? "cover" : "no-cover"}`;
  const existing = runningExports.get(key);
  if (existing) {
    return existing;
  }

  const job = startExport(sourceTabId, mode, options).finally(() => {
    runningExports.delete(key);
  });
  runningExports.set(key, job);
  return job;
}

async function startExport(sourceTabId, mode, options) {
  const extracted = await requestExtraction(sourceTabId);
  if (!extracted?.ok) {
    throw new Error(extracted?.error || "Could not extract Codeforces statements");
  }

  const payload = extracted.payload;
  const sessionId = createSessionId();
  const storageKey = getStorageKey(sessionId);
  const fileName = safeFileName(payload.fileName || "codeforces-problems.pdf");

  await chromeCall(chrome.storage.local, "set", {
    [storageKey]: {
      ...payload,
      sessionId,
      fileName,
      options
    }
  });

  const printTab = await chromeCall(chrome.tabs, "create", {
    url: chrome.runtime.getURL(`src/print/print.html?sessionId=${encodeURIComponent(sessionId)}`),
    active: mode !== "pdf"
  });

  if (!printTab?.id) {
    await chromeCall(chrome.storage.local, "remove", storageKey);
    throw new Error("Could not create print tab");
  }

  try {
    await waitForPrintReady(sessionId, printTab.id);

    if (mode === "print") {
      await sendTabMessage(printTab.id, { type: MESSAGE.TRIGGER_PRINT });
      return { mode: "print", fileName, printTabId: printTab.id };
    }

    const dataUrl = await printTabToPdfDataUrl(printTab.id, payload);
    const downloadId = await chromeCall(chrome.downloads, "download", {
      url: dataUrl,
      filename: fileName,
      saveAs: false,
      conflictAction: "uniquify"
    });

    await chromeCall(chrome.tabs, "remove", printTab.id).catch(() => {});
    await chromeCall(chrome.storage.local, "remove", storageKey).catch(() => {});

    return { mode: "pdf", fileName, downloadId };
  } catch (error) {
    await chromeCall(chrome.storage.local, "remove", storageKey).catch(() => {});

    if (mode === "pdf") {
      await chromeCall(chrome.tabs, "update", printTab.id, { active: true }).catch(() => {});
      sendTabMessage(printTab.id, { type: MESSAGE.TRIGGER_PRINT }).catch(() => {});
      throw new Error(`${getErrorMessage(error)}. Opened the print page as a fallback.`);
    }

    throw error;
  }
}

async function waitForPrintReady(sessionId, tabId) {
  const timeoutAt = Date.now() + 30000;
  activePrintSessions.set(sessionId, { tabId });

  try {
    while (Date.now() < timeoutAt) {
      const completed = takeCompletedPrintMessage(sessionId);
      if (completed) {
        return completed;
      }

      const status = await sendTabMessage(tabId, { type: MESSAGE.PRINT_STATUS, sessionId }).catch(() => null);
      if (status?.ok && status.ready) {
        return status;
      }
      if (status?.ok === false || status?.error) {
        throw new Error(status.error || "Print page failed");
      }

      await delay(250);
    }

    throw new Error("Print page did not finish rendering");
  } finally {
    activePrintSessions.delete(sessionId);
    completedPrintMessages.delete(sessionId);
  }
}

function takeCompletedPrintMessage(sessionId) {
  const completed = completedPrintMessages.get(sessionId);
  if (!completed) {
    return null;
  }

  completedPrintMessages.delete(sessionId);
  if (!completed.ok) {
    throw new Error(completed.error);
  }
  return completed.message;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function printTabToPdfDataUrl(tabId, payload) {
  const target = { tabId };
  let attached = false;
  const title = payload?.title || "Codeforces Problems";

  try {
    await chromeCall(chrome.debugger, "attach", target, "1.3");
    attached = true;
    await chromeCall(chrome.debugger, "sendCommand", target, "Page.enable");
    await chromeCall(chrome.debugger, "sendCommand", target, "Emulation.setEmulatedMedia", { media: "print" });
    const result = await chromeCall(chrome.debugger, "sendCommand", target, "Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: getHeaderTemplate(title),
      footerTemplate: getFooterTemplate(),
      marginTop: 0.28,
      marginBottom: 0.32,
      marginLeft: 0.32,
      marginRight: 0.32
    });

    if (!result?.data) {
      throw new Error("Chrome did not return PDF data");
    }

    return `data:application/pdf;base64,${result.data}`;
  } finally {
    if (attached) {
      await chromeCall(chrome.debugger, "detach", target).catch(() => {});
    }
  }
}

function getExportOptions(message) {
  return {
    includeCover: message?.includeCover === true
  };
}

function getHeaderTemplate(title) {
  return `
    <div style="width:100%; margin:0 10mm; font-family:Arial,sans-serif; font-size:8px; color:#4b5563; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
      ${escapeTemplateHtml(title)}
    </div>
  `;
}

function getFooterTemplate() {
  return `
    <div style="width:100%; margin:0 10mm; display:flex; justify-content:space-between; gap:12px; font-family:Arial,sans-serif; font-size:9px; color:#6b7280;">
      <span>Generated by icpcassiut.org</span>
      <span><span class="pageNumber"></span>/<span class="totalPages"></span></span>
    </div>
  `;
}

function escapeTemplateHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function updateActionBadge(tabId, status) {
  const text = status?.ready ? "PDF" : "";
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setTitle({
    tabId,
    title: status?.ready
      ? `Export ${status.statementCount} Codeforces statements`
      : "Export Codeforces statements"
  });
}

function createSessionId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getStorageKey(sessionId) {
  return `${EXPORT_STORAGE_PREFIX}${sessionId}`;
}

function safeFileName(fileName) {
  const cleaned = fileName
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

function sendTabMessage(tabId, message) {
  return chromeCall(chrome.tabs, "sendMessage", tabId, message);
}

async function requestExtraction(tabId) {
  try {
    return await sendTabMessage(tabId, { type: MESSAGE.EXTRACT });
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.includes("Receiving end does not exist") || message.includes("Could not establish connection")) {
      throw new Error("Open a Codeforces problemset page or individual problem page before exporting. If the tab was already open, reload it once.");
    }
    throw error;
  }
}

async function cleanupStaleExportSessions() {
  const stored = await chromeCall(chrome.storage.local, "get", null);
  const expiredKeys = [];
  const now = Date.now();

  for (const [key, value] of Object.entries(stored || {})) {
    if (!key.startsWith(EXPORT_STORAGE_PREFIX)) continue;

    const capturedAt = Date.parse(value?.capturedAt || "");
    if (!Number.isFinite(capturedAt) || now - capturedAt > EXPORT_SESSION_TTL_MS) {
      expiredKeys.push(key);
    }
  }

  if (expiredKeys.length > 0) {
    await chromeCall(chrome.storage.local, "remove", expiredKeys);
  }
}

function chromeCall(target, method, ...args) {
  return new Promise((resolve, reject) => {
    try {
      target[method].call(target, ...args, (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(`${method}: ${error.message}`));
          return;
        }
        resolve(result);
      });
    } catch (error) {
      reject(new Error(`${method}: ${getErrorMessage(error)}`));
    }
  });
}

function getErrorMessage(error) {
  return error?.message || String(error);
}
