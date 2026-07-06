# Chrome Web Store Preparation

This document tracks the store listing and submission details for Codeforces PDF Exporter.

## Listing Draft

### Name

Codeforces PDF Exporter

### Short Description

Export Codeforces contest, Gym, and group contest statements to clean printable PDFs.

### Detailed Description

Codeforces PDF Exporter helps competitive programming teams create printable problem sets directly from the browser.

Open a supported Codeforces problemset page, click Export PDF, and the extension generates a clean A4 PDF using your current browser session. This avoids server-side scraping, login duplication, and Cloudflare issues.

Supported pages:

- Codeforces contest problemsets
- Codeforces Gym problemsets
- Codeforces group contest problemsets

Privacy:

- Runs locally in Chrome or Brave
- Does not send statement content, cookies, handles, or PDFs to a backend
- Temporarily stores extracted statement HTML only inside `chrome.storage.local` during export
- Removes temporary export data after successful PDF generation

Built by ICPC Assiut for competitive programming education and team training.

### Category

Productivity

### Language

English

## Permission Justification

### `activeTab`

Used to inspect and export the currently active Codeforces problemset page from the popup.

### `debugger`

Used only to call Chrome DevTools `Page.printToPDF` for the internal extension print page. This is required for reliable client-side PDF generation.

### `downloads`

Used to save the generated PDF to the user's downloads folder.

### `storage`

Used to temporarily pass extracted statement HTML from the Codeforces page to the internal print renderer. Temporary export data is removed after export, and stale sessions are purged on startup/install.

### Host Access

`https://codeforces.com/*` is used to read visible statement pages.

`https://espresso.codeforces.com/*` is used to render Codeforces-hosted statement images inside generated PDFs.

## Privacy Disclosure

The extension does not collect or transmit personal data.

It does not use analytics, telemetry, tracking, ads, or remote code.

It does not send Codeforces cookies, account data, handles, problem statements, or generated PDFs to `icpcassiut.org` or any other server.

## Required Screenshots

Prepare screenshots for:

- Extension popup on a supported Codeforces problemset page
- In-page export overlay
- Generated PDF first page
- Generated PDF page with image or MathJax-heavy statement
- Unsupported-page message

## Submission Checklist

- [ ] Confirm public repo visibility and license files are final.
- [ ] Build release ZIP with `npm run package`.
- [ ] Verify ZIP contains legal and privacy files.
- [ ] Load ZIP contents as unpacked extension in Chrome.
- [ ] Export one contest PDF from live Codeforces.
- [ ] Export one Gym PDF from live Codeforces.
- [ ] Export one group contest PDF from live Codeforces.
- [ ] Confirm no `Copy`, `standard input`, or `standard output` metadata artifacts in exported PDFs.
- [ ] Capture listing screenshots.
- [ ] Submit privacy practices matching `PRIVACY.md`.
