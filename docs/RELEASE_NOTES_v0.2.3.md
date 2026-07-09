# Release Notes v0.2.3

## Chrome Web Store Resubmission

- Added clearer popup guidance for the common Chrome extension install case where a Codeforces problemset tab was already open before the extension was installed or reloaded.
- Documented reviewer test steps with an exact public Codeforces problemset URL, expected action, and expected PDF download result.
- No permission changes.
- No privacy behavior changes.
- No remote code added.

## Verification

- Clean-profile Chrome export from `https://codeforces.com/contest/1999/problems` produced `contest-1999-Codeforces Round 964 (Div. 4).pdf`.
- `npm run check`
- `npm run package`
