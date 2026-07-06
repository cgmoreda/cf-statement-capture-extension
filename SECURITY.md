# Security Policy

## Supported Versions

This project is pre-release. Security fixes are made on `main` until the first stable release is tagged.

## Reporting a Vulnerability

Please report security issues privately through the repository owner or by emailing `support@icpcassiut.org`.

Do not open a public issue for vulnerabilities involving:

- data exposure
- unsafe HTML rendering
- extension permission abuse
- PDF export bypasses
- Codeforces account or session leakage

## Security Model

The extension is designed to run entirely in the user's browser. It does not use a backend service and does not transmit problem statements or user session data to ICPC Assiut.

The extension sanitizes cloned statement HTML before rendering it in the internal print page, removes scripts and interactive elements, strips event-handler attributes, and uses Chrome's `Page.printToPDF` API for local PDF generation.
