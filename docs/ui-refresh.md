# Gardenist UI refresh — September 2026

The landing page, authentication dialog, and dashboard share a warm botanical palette, restrained typography, and responsive layouts. The public dashboard preview uses explicitly labelled illustrative data; its pump switch only changes local display state.

## Authentication

- Google account selection opens directly from the button gesture, avoiding an asynchronous import before opening the popup.
- Email login uses native form validation, Enter submission, an in-progress state, and localized errors.
- Password reset uses Firebase Auth and a neutral response that does not reveal whether an account exists.
- The native dialog supports keyboard focus containment, Escape, backdrop dismissal, focus restoration, and password clearing.
- Firebase's auth observer owns dashboard entry and exit. Signing out removes database subscriptions, timers, and charts.
- Existing Firebase Auth providers, project configuration, and database authorization rules remain in place.

## Deployment and caching

Run `npm run build`, then `npm run deploy` with an authenticated Firebase CLI account that can deploy to `webdashboard-gardenist`.

The service worker uses network-first navigation so subsequent page loads receive new deployments. It excludes Firebase authentication handlers and external traffic, and removes the old Gardenist cache on activation. The manifest and favicon use the Gardenist identity.

## Verification performed

- Production Vite build and `git diff --check` passed.
- Chrome desktop and 320, 390, and 768 px responsive layouts checked.
- Form validation, Enter submission, password visibility, Escape dismissal, password clearing, and theme persistence checked.
- Invalid email credentials and password reset responses checked with intercepted API responses; no test credentials were submitted to Firebase.
- Blocked Google popup checked and the login button recovered correctly.
- All five dashboard views checked on desktop and mobile using a local fixture with database listeners and writes disabled.
- No page-level JavaScript errors occurred during these checks.

Actual Google account consent, a real authenticated session, and physical device control require verification with the project owner's account and devices. Local fixture testing does not validate these integrations.

The deployment attempt on September 16 was blocked by a missing Firebase CLI session (`Failed to authenticate, have you run firebase login?`). No successful deployment is claimed.

## Visual asset

The bundled plant photograph is sourced from [Unsplash](https://images.unsplash.com/photo-1459156212016-c812468e2115). It is stored locally in `apps/web/public/garden-photo.jpg`; the landing page does not require an external image request.
