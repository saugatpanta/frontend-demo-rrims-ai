# RRIMS Frontend Production Readiness

## Must Pass Before Production

- `npm run build`
- `npm run lint`
- `npm run test:e2e`
- `npm run test:e2e:mobile`
- Backend readiness check from `RRIMS-Backend`: `npm run readiness:check`
- Backend security tests from `RRIMS-Backend`: `npm run test:security`

## Manual QA

- Login with each active demo role and verify role navigation.
- Complete MFA enrollment with QR scan and verify recovery code display.
- Upload, view, and remove a profile picture.
- Open an assigned work-order client channel as engineer and citizen.
- Send text, upload attachment, record voice note, and start/end a call.
- Confirm live chat updates in two browser sessions.
- Confirm notification badge updates from the dashboard stream.
- Approve browser notifications and confirm desktop notification display.
- Test layouts at 390px, 768px, 1280px, and 1440px widths.

## Deployment Checks

- `VITE_API_BASE_URL` points to the production API origin.
- HTTPS is enabled for microphone, camera, notifications, cookies, and service worker.
- CSP allows the API origin, Twilio media endpoints, and no unexpected script origins.
- Cookies use secure/same-site settings expected by the backend environment.
- Twilio video is enabled only when `TWILIO_VIDEO_ENABLED=true` and API credentials are configured.
- Source maps are intentionally enabled or disabled according to release policy.
