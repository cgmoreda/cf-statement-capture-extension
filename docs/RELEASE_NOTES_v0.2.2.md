# CF Gyms Statement Exporter v0.2.2

Chrome Web Store submission-prep release.

## Highlights

- Adds explicit Chrome Web Store Limited Use language to the privacy policy.
- Documents final Chrome Web Store listing text, privacy answers, permission justifications, screenshot paths, promo image paths, and dashboard-only remaining steps.
- Keeps the extension behavior unchanged from `v0.2.1`.

## Package

Release ZIP:

```text
cf-gyms-statement-exporter-v0.2.2.zip
```

The ZIP is built from an explicit allowlist and includes source, icons, privacy policy, security policy, AGPL license text, attribution terms, trademark policy, and notice file.

## Store Assets

Local store assets are kept in `store-assets/` and intentionally excluded from git:

- five 1280x800 screenshots
- one 440x280 small promo tile
- one optional 1400x560 marquee promo tile

## Validation

- `npm run check`
- `npm run package`
- ZIP inspection for required legal and privacy files
