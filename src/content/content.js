(() => {
  const ROOT_ID = "cf-statement-capture-root";
  let exportInFlight = false;
  const MESSAGE = {
    GET_STATUS: "CF_CAPTURE_GET_STATUS",
    EXTRACT: "CF_CAPTURE_EXTRACT",
    START_EXPORT_FROM_PAGE: "CF_CAPTURE_START_EXPORT_FROM_PAGE",
    PAGE_STATUS: "CF_CAPTURE_PAGE_STATUS"
  };

  function parseCodeforcesProblemsetUrl(rawUrl = location.href) {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      return { supported: false, reason: "Invalid URL" };
    }

    if (url.hostname !== "codeforces.com") {
      return { supported: false, reason: "Not a Codeforces page" };
    }

    const path = url.pathname.replace(/\/+$/, "");
    let match = path.match(/^\/contest\/(\d+)\/problems$/);
    if (match) {
      return {
        supported: true,
        kind: "contest",
        contestId: match[1],
        route: `/contest/${match[1]}/problems`
      };
    }

    match = path.match(/^\/gym\/(\d+)\/problems$/);
    if (match) {
      return {
        supported: true,
        kind: "gym",
        contestId: match[1],
        route: `/gym/${match[1]}/problems`
      };
    }

    match = path.match(/^\/group\/([^/]+)\/contest\/(\d+)\/problems$/);
    if (match) {
      return {
        supported: true,
        kind: "group-contest",
        groupId: match[1],
        contestId: match[2],
        route: `/group/${match[1]}/contest/${match[2]}/problems`
      };
    }

    return { supported: false, reason: "Open a complete contest, gym, or group contest problemset page" };
  }

  function getStatements() {
    return [...document.querySelectorAll(".problem-statement")];
  }

  function getContestTitle() {
    const candidates = [
      ".contest-name",
      ".caption",
      ".rtable .caption",
      ".roundbox .caption"
    ];

    for (const selector of candidates) {
      const text = document.querySelector(selector)?.textContent?.trim();
      if (text) return normalizeText(text);
    }

    const firstStatement = getStatements()[0];
    const previousText = firstStatement?.previousSibling?.textContent?.trim();
    if (previousText) return normalizeText(previousText);

    return document.title.replace(/\s*-\s*Codeforces\s*$/i, "").trim() || "Codeforces Problems";
  }

  function getStatus() {
    const route = parseCodeforcesProblemsetUrl();
    const statements = getStatements();
    return {
      ...route,
      url: location.href,
      title: getContestTitle(),
      documentTitle: document.title,
      statementCount: statements.length,
      ready: route.supported && statements.length > 0
    };
  }

  function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function safeFilePart(text) {
    return normalizeText(text)
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 120)
      .trim() || "codeforces-problems";
  }

  function absoluteUrl(value) {
    if (!value) return "";
    try {
      return new URL(value, location.href).href;
    } catch {
      return value;
    }
  }

  function stripUnsafeAttributes(element) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
      if (name === "srcdoc") {
        element.removeAttribute(attribute.name);
      }
    }
  }

  function sanitizeStatementClone(statement, index) {
    const clone = statement.cloneNode(true);
    clone.querySelectorAll("script, iframe, object, embed, link, form, input, button").forEach((node) => node.remove());

    clone.querySelectorAll("*").forEach((node) => {
      stripUnsafeAttributes(node);
      node.removeAttribute("id");

      if (node instanceof HTMLImageElement) {
        const src = node.currentSrc || node.getAttribute("src");
        node.src = absoluteUrl(src);
        node.removeAttribute("srcset");
        node.loading = "eager";
        node.decoding = "sync";
      }

      if (node instanceof HTMLAnchorElement) {
        node.href = absoluteUrl(node.getAttribute("href"));
        node.target = "_blank";
        node.rel = "noreferrer noopener";
      }
    });

    removeCopyArtifacts(clone);
    removeStandardIoMetadata(clone);
    clone.dataset.cfCaptureProblemIndex = String(index + 1);
    return clone.outerHTML;
  }

  function removeCopyArtifacts(root) {
    root.querySelectorAll("*").forEach((node) => {
      if (!node.closest("pre, code") && normalizeText(node.textContent || "") === "Copy") {
        node.remove();
      }
    });

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (const textNode of textNodes) {
      const parent = textNode.parentElement;
      if (parent && !parent.closest("pre, code") && normalizeText(textNode.textContent || "") === "Copy") {
        textNode.remove();
      }
    }
  }

  function removeStandardIoMetadata(root) {
    const inputFile = root.querySelector(".input-file");
    const outputFile = root.querySelector(".output-file");
    if (inputFile && normalizeText(inputFile.textContent || "").toLowerCase().endsWith("standard input")) {
      inputFile.remove();
    }
    if (outputFile && normalizeText(outputFile.textContent || "").toLowerCase().endsWith("standard output")) {
      outputFile.remove();
    }
  }

  function collectInlineStyles() {
    return [...document.querySelectorAll("style")]
      .map((style) => style.textContent || "")
      .filter((text) => text.includes("MathJax") || text.includes("MJX") || text.includes("problem-statement"))
      .slice(0, 16);
  }

  async function waitForMathJax() {
    const mathJax = window.MathJax;
    if (!mathJax) return;

    if (mathJax.startup?.promise) {
      await mathJax.startup.promise;
      return;
    }

    if (mathJax.Hub?.Queue) {
      await new Promise((resolve) => mathJax.Hub.Queue(resolve));
    }
  }

  async function waitForImages() {
    const images = [...document.querySelectorAll(".problem-statement img")];
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

  async function waitForReady() {
    if (document.readyState === "loading") {
      await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    }

    await waitForMathJax();

    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 2500))]);
    }

    await waitForImages();
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  async function extractStatements() {
    const status = getStatus();
    if (!status.supported) {
      throw new Error(status.reason);
    }

    await waitForReady();

    const statements = getStatements();
    if (statements.length === 0) {
      throw new Error("No .problem-statement nodes were found on this page");
    }

    const problems = statements.map((statement, index) => {
      const title = normalizeText(statement.querySelector(".header .title, .title")?.textContent || `Problem ${index + 1}`);
      return {
        index: index + 1,
        title,
        html: sanitizeStatementClone(statement, index),
        imageCount: statement.querySelectorAll("img").length,
        mathCount: statement.querySelectorAll(".MathJax, mjx-container").length,
        sampleCount: statement.querySelectorAll(".sample-test, .sample-tests").length
      };
    });

    const routeLabel = status.kind === "group-contest"
      ? `group-${status.groupId}-contest-${status.contestId}`
      : `${status.kind}-${status.contestId}`;

    return {
      capturedAt: new Date().toISOString(),
      sourceUrl: location.href,
      route: status,
      title: getContestTitle(),
      fileName: `${safeFilePart(routeLabel)}-${safeFilePart(getContestTitle())}.pdf`,
      styles: collectInlineStyles(),
      problems
    };
  }

  function setOverlayState(root, state, detail = "") {
    const button = root.shadowRoot.querySelector("button");
    const status = root.shadowRoot.querySelector("[data-status]");
    root.dataset.state = state;
    button.disabled = state === "running";
    status.textContent = detail;
  }

  function ensureOverlay() {
    const status = getStatus();
    const existing = document.getElementById(ROOT_ID);
    if (!status.supported) {
      existing?.remove();
      return;
    }

    if (existing) return;

    const root = document.createElement("div");
    root.id = ROOT_ID;
    const shadow = root.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 2147483647;
          font-family: Arial, sans-serif;
        }
        .panel {
          display: grid;
          gap: 8px;
          min-width: 190px;
          padding: 11px;
          border: 1px solid rgba(30, 41, 59, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.18);
          color: #111827;
        }
        .brand {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 11px;
          line-height: 1.2;
          color: #4b5563;
        }
        .brand strong {
          color: #111827;
          font-size: 12px;
        }
        .brand span {
          white-space: nowrap;
        }
        button {
          border: 0;
          border-radius: 6px;
          padding: 8px 10px;
          background: #0f766e;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        button:hover:not(:disabled) {
          background: #115e59;
        }
        button:disabled {
          cursor: progress;
          opacity: 0.72;
        }
        [data-status] {
          min-height: 14px;
          max-width: 230px;
          font-size: 11px;
          line-height: 1.25;
          color: #4b5563;
        }
        label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #374151;
        }
        input {
          width: 13px;
          height: 13px;
          margin: 0;
        }
      </style>
      <div class="panel">
        <div class="brand">
          <strong>Codeforces PDF</strong>
          <span>icpcassiut.org</span>
        </div>
        <button type="button">Export PDF</button>
        <label><input type="checkbox" data-include-cover> Cover page</label>
        <div data-status>${status.statementCount || 0} statements detected</div>
      </div>
    `;

    shadow.querySelector("button").addEventListener("click", async () => {
      if (exportInFlight) return;

      try {
        exportInFlight = true;
        setOverlayState(root, "running", "Preparing PDF...");
        const response = await chrome.runtime.sendMessage({
          type: MESSAGE.START_EXPORT_FROM_PAGE,
          mode: "pdf",
          includeCover: shadow.querySelector("[data-include-cover]")?.checked === true
        });
        if (!response?.ok) {
          throw new Error(response?.error || "Export failed");
        }
        setOverlayState(root, "done", `Saved ${response.fileName || "PDF"}`);
      } catch (error) {
        setOverlayState(root, "error", error?.message || "Export failed");
      } finally {
        exportInFlight = false;
      }
    });

    document.documentElement.append(root);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === MESSAGE.GET_STATUS) {
      sendResponse({ ok: true, status: getStatus() });
      return false;
    }

    if (message?.type === MESSAGE.EXTRACT) {
      extractStatements()
        .then((payload) => sendResponse({ ok: true, payload }))
        .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
      return true;
    }

    return false;
  });

  ensureOverlay();
  chrome.runtime.sendMessage({ type: MESSAGE.PAGE_STATUS, status: getStatus() }).catch(() => {});
})();
