const MESSAGE = {
  GET_STATUS: "CF_CAPTURE_GET_STATUS",
  START_EXPORT: "CF_CAPTURE_START_EXPORT"
};

const SETTINGS_KEY = "cfStatementCaptureSettings";
const DEFAULT_SETTINGS = {
  showPageButton: true
};

const statusEl = document.getElementById("status");
const detailsEl = document.getElementById("details");
const messageEl = document.getElementById("message");
const exportButton = document.getElementById("export");
const printButton = document.getElementById("print");
const includeCoverInput = document.getElementById("include-cover");
const showPageButtonInput = document.getElementById("show-page-button");

let currentStatus = null;
let settings = { ...DEFAULT_SETTINGS };

init();

exportButton.addEventListener("click", () => startExport("pdf"));
printButton.addEventListener("click", () => startExport("print"));
showPageButtonInput.addEventListener("change", () => updateSettings({
  showPageButton: showPageButtonInput.checked
}));

async function init() {
  try {
    settings = await loadSettings();
    showPageButtonInput.checked = settings.showPageButton;

    const [tab] = await chromeCall(chrome.tabs, "query", { active: true, currentWindow: true });
    if (!tab?.id) {
      renderUnsupported("No active tab found");
      return;
    }

    const response = await requestPageStatus(tab.id, tab.url);
    if (!response?.ok) {
      renderUnsupported(response?.error || "Could not inspect this tab");
      return;
    }

    renderStatus(response.status);
  } catch (error) {
    renderUnsupported(error?.message || String(error));
  }
}

async function startExport(mode) {
  setBusy(true, mode === "pdf" ? "Downloading PDF..." : "Opening print page...");
  try {
    const response = await chromeCall(chrome.runtime, "sendMessage", {
      type: MESSAGE.START_EXPORT,
      mode,
      includeCover: includeCoverInput.checked
    });
    if (!response?.ok) {
      throw new Error(response?.error || "Export failed");
    }
    messageEl.textContent = mode === "pdf"
      ? `Saved ${response.fileName || "PDF"}`
      : "Print page opened";
  } catch (error) {
    messageEl.textContent = error?.message || "Export failed";
  } finally {
    setBusy(false);
  }
}

function renderStatus(status) {
  currentStatus = status;
  if (!status?.supported) {
    renderUnsupported(status?.reason || "Open a complete Codeforces problemset page");
    return;
  }

  statusEl.textContent = status.ready
    ? `${status.statementCount} statements detected`
    : "Waiting for statements";
  detailsEl.hidden = false;
  detailsEl.innerHTML = `
    <dt>Type</dt><dd>${escapeHtml(status.kind || "")}</dd>
    <dt>Statements</dt><dd>${status.statementCount || 0}</dd>
    <dt>Title</dt><dd>${escapeHtml(status.title || "")}</dd>
    <dt>Page</dt><dd>${escapeHtml(status.route || "")}</dd>
  `;
  exportButton.disabled = !status.ready;
  printButton.disabled = !status.ready;
}

function renderUnsupported(reason) {
  currentStatus = null;
  statusEl.textContent = reason;
  detailsEl.hidden = true;
  detailsEl.textContent = "";
  exportButton.disabled = true;
  printButton.disabled = true;
}

function setBusy(isBusy, text = "") {
  exportButton.disabled = isBusy || !currentStatus?.ready;
  printButton.disabled = isBusy || !currentStatus?.ready;
  if (text) messageEl.textContent = text;
}

async function requestPageStatus(tabId, tabUrl) {
  try {
    return await chromeCall(chrome.tabs, "sendMessage", tabId, { type: MESSAGE.GET_STATUS });
  } catch (error) {
    const message = error?.message || String(error);
    if (message.includes("Receiving end does not exist") || message.includes("Could not establish connection")) {
      return {
        ok: true,
        status: {
          supported: false,
          reason: getMissingContentScriptReason(tabUrl)
        }
      };
    }
    throw error;
  }
}

function getMissingContentScriptReason(tabUrl) {
  const route = parseSupportedRoute(tabUrl);
  if (route.supported) {
    return "Reload this Codeforces page to activate the exporter, then click Download PDF.";
  }

  return "Open a Codeforces contest, Gym, group problemset, or individual problem page.";
}

function parseSupportedRoute(rawUrl = "") {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { supported: false };
  }

  if (url.hostname !== "codeforces.com") {
    return { supported: false };
  }

  const path = url.pathname.replace(/\/+$/, "");
  return {
    supported: /^\/contest\/\d+\/problems$/.test(path)
      || /^\/gym\/\d+\/problems$/.test(path)
      || /^\/group\/[^/]+\/contest\/\d+\/problems$/.test(path)
      || /^\/contest\/\d+\/problem\/[^/]+$/.test(path)
      || /^\/gym\/\d+\/problem\/[^/]+$/.test(path)
      || /^\/group\/[^/]+\/contest\/\d+\/problem\/[^/]+$/.test(path)
      || /^\/problemset\/problem\/\d+\/[^/]+$/.test(path)
  };
}

async function loadSettings() {
  const stored = await chromeCall(chrome.storage.local, "get", SETTINGS_KEY).catch(() => null);
  return normalizeSettings(stored?.[SETTINGS_KEY]);
}

async function updateSettings(patch) {
  settings = normalizeSettings({ ...settings, ...patch });
  showPageButtonInput.disabled = true;
  try {
    await chromeCall(chrome.storage.local, "set", { [SETTINGS_KEY]: settings });
    messageEl.textContent = settings.showPageButton
      ? "Page button will show automatically"
      : "Page button hidden. Toolbar export still works.";
  } catch (error) {
    messageEl.textContent = error?.message || "Could not save setting";
    settings = await loadSettings();
    showPageButtonInput.checked = settings.showPageButton;
  } finally {
    showPageButtonInput.disabled = false;
  }
}

function normalizeSettings(value) {
  return {
    ...DEFAULT_SETTINGS,
    ...(value && typeof value === "object" ? value : {})
  };
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
      reject(new Error(`${method}: ${error?.message || String(error)}`));
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
