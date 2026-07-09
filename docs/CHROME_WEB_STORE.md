# Chrome Web Store Preparation

This document tracks the store listing and submission details for CF Gyms Statement Exporter.

## Current Submission Packet

Status: v0.2.3 submitted for review on 2026-07-09 after one reviewer reproducibility rejection.

Release ZIP:

- `dist/cf-gyms-statement-exporter-v0.2.3.zip`

Graphics:

- Store icon: `assets/icons/icon-128.png`
- Screenshot 1: `store-assets/store/01-open-problemset.png`
- Screenshot 2: `store-assets/store/02-export-controls.png`
- Screenshot 3: `store-assets/store/03-compact-pdf.png`
- Screenshot 4: `store-assets/store/04-visual-statements.png`
- Screenshot 5: `store-assets/store/05-guided-empty-state.png`
- Small promo tile: `store-assets/store/small-promo-tile-440x280.png`
- Optional marquee promo tile: `store-assets/store/marquee-promo-tile-1400x560.png`

Notes:

- `store-assets/` is intentionally local-only and excluded through `.git/info/exclude`.
- Screenshots are generated from the packaged extension UI and a live Codeforces contest export.
- Upload requires the owner Chrome Web Store publisher account.

Official references checked on 2026-07-06:

- Listing assets and screenshots: <https://developer.chrome.com/docs/webstore/cws-dashboard-listing>
- Privacy fields and permission justifications: <https://developer.chrome.com/docs/webstore/cws-dashboard-privacy>
- First publish flow: <https://developer.chrome.com/docs/webstore/publish>

## Listing Draft

### Name

CF Gyms Statement Exporter

### Short Description

Export Codeforces contest, Gym, and group contest statements to clean printable PDFs.

### Detailed Description

CF Gyms Statement Exporter helps competitive programming teams create printable problem sets directly from the browser.

Open a supported Codeforces problemset page, such as `https://codeforces.com/contest/1999/problems`, click Export PDF, and the extension generates a clean A4 PDF using your current browser session. This avoids server-side scraping, login duplication, and Cloudflare issues.

Supported pages:

- Codeforces contest problemsets
- Codeforces Gym problemsets
- Codeforces group contest problemsets

Supported URL formats:

- `https://codeforces.com/contest/:contestId/problems`
- `https://codeforces.com/gym/:gymId/problems`
- `https://codeforces.com/group/:groupId/contest/:contestId/problems`

If a Codeforces tab was already open before installing or reloading the extension, reload that tab once so Chrome activates the extension on the page.

Privacy:

- Runs locally in Chrome or Brave
- Does not send statement content, cookies, handles, or PDFs to a backend
- Temporarily stores extracted statement HTML only inside `chrome.storage.local` during export
- Removes temporary export data after successful PDF generation

Built by ICPC Assiut for competitive programming education and team training. This extension is not affiliated with Codeforces.

### Category

Productivity

### Language

English

### Publisher

Personal Chrome Web Store publisher account.

### Launch Visibility

Public.

### Support Contact

`support@icpcassiut.org`

### Privacy Policy URL

`https://github.com/cgmoreda/cf-statement-capture-extension/blob/main/PRIVACY.md`

### Homepage URL

`https://icpcassiut.org`

### Support URL

Use one of:

- `mailto:support@icpcassiut.org`
- `https://github.com/cgmoreda/cf-statement-capture-extension/issues`

Use the GitHub issues URL if the dashboard rejects `mailto:` URLs.

### Distribution

- Visibility: Public
- Regions: all regions, unless a specific region restriction is needed later
- Pricing: free
- In-app purchases: none

## Reviewer Test Instructions

Use this text in `Access > Test instructions`.

```text
No credentials are required for the public test case.

Primary test:

1. Install the extension.
2. Open https://codeforces.com/contest/1999/problems in a normal Chrome tab.
3. If the tab was already open before installing the extension, reload the tab once.
4. Wait for the bottom-right "CF Statements" panel to show "8 statements detected".
5. Click "Export PDF" in that panel.
6. Expected result: Chrome downloads a PDF named similar to "contest-1999-Codeforces Round 964 (Div. 4).pdf".

Popup test:

1. Open https://codeforces.com/contest/1999/problems.
2. Click the extension toolbar icon.
3. Expected result: the popup shows the contest type, 8 statements, and a "Download PDF" button.
4. Click "Download PDF".
5. Expected result: the same PDF is saved to Chrome's downloads folder.

Supported page formats:

- https://codeforces.com/contest/:contestId/problems
- https://codeforces.com/gym/:gymId/problems
- https://codeforces.com/group/:groupId/contest/:contestId/problems

The extension intentionally does not export individual problem pages such as /contest/:id/problem/A. It exports complete problemset pages.

If Codeforces or Cloudflare shows a browser check, complete it in the same browser tab and reload the problemset page. The extension uses the current browser session and does not use a backend.
```

## Rejection Follow-Up

### 2026-07-09 v0.2.3 Resubmission

Dashboard state after submission:

- Version: `0.2.3`
- Last updated: `9 Jul 2026`
- Status: `Pending review`
- Automatic publishing after approval: enabled

Dashboard listing changes:

- Added exact public test URL: `https://codeforces.com/contest/1999/problems`
- Added supported URL formats.
- Added reload note for Codeforces tabs that were already open before extension installation or reload.
- Added Codeforces non-affiliation note.

Reviewer instructions entered in the 500-character dashboard field:

```text
No credentials required. Install extension, open https://codeforces.com/contest/1999/problems, reload the tab if it was open before install, wait for the bottom-right CF Statements panel to show 8 statements detected, then click Export PDF. Expected: Chrome downloads contest-1999-Codeforces Round 964 (Div. 4).pdf. Popup also works on the same page via toolbar icon > Download PDF. Only complete problemset pages are supported.
```

### 2026-07-09 Red Potassium

Chrome Web Store rejected v0.2.2 with:

> Inaccurate Description - Non functional

The cited statement was:

> Export complete Codeforces contest, Gym, and group contest problemset pages into a clean printable PDF in the browser.

Local clean-profile reproduction after the rejection:

- Browser: Chrome for Testing 150
- Extension source: unpacked v0.2.2 repository
- URL: `https://codeforces.com/contest/1999/problems`
- Action: clicked the injected `Export PDF` panel button
- Result: Chrome downloaded `contest-1999-Codeforces Round 964 (Div. 4).pdf`

Likely reviewer gap: the reviewer may have installed/reloaded the extension while a Codeforces tab was already open, in which case Chrome does not inject manifest content scripts into that existing tab until reload. v0.2.3 adds explicit popup guidance for that case and this document now includes exact test instructions.

Appeal/resubmission note:

```text
The export functionality is reproducible on a public Codeforces page with no credentials:

1. Install the extension.
2. Open https://codeforces.com/contest/1999/problems.
3. If the page was already open before installation, reload it once.
4. Click the bottom-right "Export PDF" button.
5. Chrome downloads "contest-1999-Codeforces Round 964 (Div. 4).pdf".

I reproduced this in a clean Chrome profile after receiving the rejection. The extension intentionally supports complete problemset pages only, not individual /problem/ pages. I have also added reviewer test instructions and popup guidance clarifying that an already-open Codeforces tab must be reloaded after installation so the content script can run.
```

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

The extension does not transmit personal data.

It does not use analytics, telemetry, tracking, ads, or remote code.

It does not send Codeforces cookies, account data, handles, problem statements, or generated PDFs to `icpcassiut.org` or any other server.

### Single Purpose

Export complete Codeforces contest, Gym, and group contest problemset pages into a clean printable PDF in the user's browser.

### Remote Code

No remote code is used. All JavaScript, CSS, icons, legal files, and extension pages are packaged in the ZIP.

### Data Usage Declaration

Recommended dashboard selection:

- Website content: yes
- All other data categories: no

Website content explanation:

The extension reads the visible Codeforces problem statements on the active problemset page only after the user opens the popup or starts an export. The extracted statement HTML is used locally to render the requested PDF, temporarily stored in `chrome.storage.local` for the internal print page, and removed after export. It is not transmitted to ICPC Assiut, Codeforces, analytics services, advertising services, or any other backend.

Certification text:

The extension's use of Codeforces page content is limited to its single user-facing PDF export purpose. The extension does not sell, transfer, share, profile, advertise with, or allow humans to read the page content or generated PDFs.

## Required Screenshots

Prepared local screenshots:

- `store-assets/store/01-open-problemset.png`: supported Codeforces problemset page
- `store-assets/store/02-export-controls.png`: extension popup with export controls
- `store-assets/store/03-compact-pdf.png`: generated PDF first page
- `store-assets/store/04-visual-statements.png`: generated PDF with visual statement content
- `store-assets/store/05-guided-empty-state.png`: unsupported-page message

Prepared promo images:

- `store-assets/store/small-promo-tile-440x280.png`: required small promo tile
- `store-assets/store/marquee-promo-tile-1400x560.png`: optional marquee promo tile

## Submission Checklist

- [x] Confirm GitHub repository is public.
- [x] Build release ZIP with `npm run package`.
- [x] Verify ZIP contains legal and privacy files.
- [x] Load ZIP contents as unpacked extension in Chrome.
- [x] Export one contest PDF from live Codeforces.
- [ ] Export one Gym PDF from live Codeforces.
- [ ] Export one group contest PDF from live Codeforces.
- [x] Confirm no `Copy`, `standard input`, or `standard output` metadata artifacts in exported PDFs.
- [x] Capture listing screenshots.
- [x] Prepare required small promo tile.
- [x] Prepare optional marquee promo tile.
- [x] Prepare privacy practices matching `PRIVACY.md`.

Dashboard-only remaining steps:

- [x] Sign in to the Chrome Web Store Developer Dashboard.
- [x] Upload `dist/cf-gyms-statement-exporter-v0.2.3.zip`.
- [x] Enter listing text, screenshots, icon, and promo tile.
- [x] Enter reviewer test instructions from this document.
- [x] Enter privacy fields using this document.
- [x] Enter distribution settings.
- [x] Submit for review with automatic publishing after approval enabled.
