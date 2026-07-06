# CF Gyms Statement Exporter v0.2.1

Production-prep release for private testing.

## Highlights

- Exports complete Codeforces contest, Gym, and group contest problemset pages to PDF.
- Uses the current browser session, avoiding server-side scraping and Cloudflare login issues.
- Generates clean A4 PDFs with compact metadata, no default cover page, and an `icpcassiut.org` footer.
- Supports image-heavy, MathJax-heavy, table-heavy, interactive, and long-sample statements tested during development.
- Runs locally and does not send problem statements, cookies, handles, or generated PDFs to a backend.

## Supported Pages

- `https://codeforces.com/contest/:contestId/problems`
- `https://codeforces.com/gym/:gymId/problems`
- `https://codeforces.com/group/:groupId/contest/:contestId/problems`

## Package

Release ZIP:

```text
cf-gyms-statement-exporter-v0.2.1.zip
```

The ZIP is built from an explicit allowlist and includes source, icons, privacy policy, security policy, AGPL license text, attribution terms, trademark policy, and notice file.

## Validation

- `npm run check`
- `npm run package`
- Browser E2E against live Codeforces pages during development
- `no-mistakes` validation with browser-level fixture export, ZIP inspection, PDF text extraction, and PDF render check

## Licensing

Licensed under `AGPL-3.0-only` with attribution-preserving additional terms. See:

- `LICENSE`
- `ADDITIONAL_TERMS.md`
- `NOTICE`
- `TRADEMARKS.md`
