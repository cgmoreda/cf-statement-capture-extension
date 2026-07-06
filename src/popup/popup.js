const MESSAGE = {
  GET_STATUS: "CF_CAPTURE_GET_STATUS",
  START_EXPORT: "CF_CAPTURE_START_EXPORT"
};

const statusEl = document.getElementById("status");
const detailsEl = document.getElementById("details");
const messageEl = document.getElementById("message");
const exportButton = document.getElementById("export");
const printButton = document.getElementById("print");
const includeCoverInput = document.getElementById("include-cover");

let currentStatus = null;

init();

exportButton.addEventListener("click", () => startExport("pdf"));
printButton.addEventListener("click", () => startExport("print"));

async function init() {
  try {
    const [tab] = await chromeCall(chrome.tabs, "query", { active: true, currentWindow: true });
    if (!tab?.id) {
      renderUnsupported("No active tab found");
      return;
    }

    const response = await chromeCall(chrome.tabs, "sendMessage", tab.id, { type: MESSAGE.GET_STATUS });
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
    <dt>Route</dt><dd>${escapeHtml(status.route || "")}</dd>
    <dt>Type</dt><dd>${escapeHtml(status.kind || "")}</dd>
    <dt>Title</dt><dd>${escapeHtml(status.title || "")}</dd>
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
