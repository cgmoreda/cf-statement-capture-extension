const MESSAGE = {
  PRINT_READY: "CF_CAPTURE_PRINT_READY",
  PRINT_FAILED: "CF_CAPTURE_PRINT_FAILED",
  PRINT_STATUS: "CF_CAPTURE_PRINT_STATUS",
  TRIGGER_PRINT: "CF_CAPTURE_TRIGGER_PRINT"
};

const params = new URLSearchParams(location.search);
const sessionId = params.get("sessionId");
const app = document.getElementById("app");
const renderState = {
  ready: false,
  error: "",
  problemCount: 0,
  imageCount: 0,
  incompleteImageCount: 0
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === MESSAGE.PRINT_STATUS) {
    sendResponse({
      ok: !renderState.error,
      ...renderState
    });
    return false;
  }

  if (message?.type === MESSAGE.TRIGGER_PRINT) {
    sendResponse({ ok: true });
    setTimeout(() => window.print(), 0);
    return false;
  }
  return false;
});

render().catch((error) => {
  renderState.error = error?.message || String(error);
  app.innerHTML = `
    <section class="loading">
      <h1>Could not render PDF</h1>
      <p>${escapeHtml(error?.message || String(error))}</p>
    </section>
  `;
  chrome.runtime.sendMessage({
    type: MESSAGE.PRINT_FAILED,
    sessionId,
    error: error?.message || String(error)
  }).catch(() => {});
});

async function render() {
  if (!sessionId) {
    throw new Error("Missing export session id");
  }

  const storageKey = `cfStatementCapture:${sessionId}`;
  const stored = await chromeCall(chrome.storage.local, "get", storageKey);
  const payload = stored?.[storageKey];
  if (!payload) {
    throw new Error("Export session data was not found");
  }

  document.title = payload.fileName || "Codeforces Statement Export";
  insertCapturedStyles(payload.styles || []);

  app.innerHTML = "";
  const toolbar = document.createElement("section");
  toolbar.className = "screen-toolbar";
  toolbar.innerHTML = `
    <div>
      <h1>${escapeHtml(payload.title || "Codeforces Problems")}</h1>
      <p>${payload.problems.length} problems from ${escapeHtml(payload.sourceUrl || "")}</p>
    </div>
    <button type="button">Print</button>
  `;
  toolbar.querySelector("button").addEventListener("click", () => window.print());

  const documentRoot = document.createElement("article");
  documentRoot.className = "export-document";
  documentRoot.dataset.includeCover = payload.options?.includeCover ? "true" : "false";

  if (payload.options?.includeCover) {
    const cover = document.createElement("section");
    cover.className = "cover";
    cover.innerHTML = `
      <h1>${escapeHtml(payload.title || "Codeforces Problems")}</h1>
      <dl>
        <dt>Source</dt>
        <dd>${escapeHtml(payload.sourceUrl || "")}</dd>
        <dt>Captured</dt>
        <dd>${escapeHtml(payload.capturedAt || "")}</dd>
        <dt>Problems</dt>
        <dd>${payload.problems.length}</dd>
      </dl>
    `;
    documentRoot.append(cover);
  }

  for (const problem of payload.problems) {
    const section = document.createElement("section");
    section.className = "problem-page";
    section.dataset.problemIndex = problem.index;
    section.innerHTML = problem.html;
    documentRoot.append(section);
  }

  markCompactSampleBlocks(documentRoot);
  app.append(toolbar, documentRoot);
  await waitForImages();

  renderState.ready = true;
  renderState.problemCount = payload.problems.length;
  renderState.imageCount = document.images.length;
  renderState.incompleteImageCount = getIncompleteImageCount();

  chrome.runtime.sendMessage({
    type: MESSAGE.PRINT_READY,
    sessionId,
    fileName: payload.fileName,
    problemCount: payload.problems.length
  }).catch(() => {});
}

function insertCapturedStyles(styles) {
  for (const text of styles) {
    if (!text.trim()) continue;
    const style = document.createElement("style");
    style.textContent = text;
    document.head.append(style);
  }
}

function markCompactSampleBlocks(root) {
  const blocks = root.querySelectorAll(".sample-tests .input, .sample-tests .output, .sample-test .input, .sample-test .output");
  for (const block of blocks) {
    const pre = block.querySelector("pre");
    if (!pre) continue;

    const lines = (pre.textContent || "").replace(/\r\n?/g, "\n").split("\n");
    const visualLineCount = lines.reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 95)), 0);
    if (visualLineCount <= 34) {
      block.classList.add("cf-capture-keep-together");
    }
  }
}

async function waitForImages() {
  const images = [...document.images];
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return;
    if (typeof image.decode === "function") {
      try {
        await Promise.race([
          image.decode(),
          new Promise((resolve) => setTimeout(resolve, 3000))
        ]);
        return;
      } catch {
        return;
      }
    }

    await new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
      setTimeout(resolve, 3000);
    });
  }));
}

function getIncompleteImageCount() {
  return [...document.images].filter((image) => !(image.complete && image.naturalWidth > 0)).length;
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
