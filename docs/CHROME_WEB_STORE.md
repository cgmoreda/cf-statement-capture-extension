# Chrome Web Store Preparation

This document tracks the store listing and submission details for CF Gyms Statement Exporter.

## Current Submission Packet

Status: ready for Chrome Web Store dashboard entry.

Release ZIP:

- `dist/cf-gyms-statement-exporter-v0.2.2.zip`

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

- [ ] Sign in to the Chrome Web Store Developer Dashboard.
- [ ] Upload `dist/cf-gyms-statement-exporter-v0.2.2.zip`.
- [ ] Enter listing text, screenshots, icon, and promo tile.
- [ ] Enter privacy fields using this document.
- [ ] Enter distribution settings.
- [ ] Submit for review, preferably with deferred publishing if available.
