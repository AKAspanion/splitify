# Integrations

<!-- GA-GENERATED:index -->

- [Clerk (removed)](clerk.md) - Clerk, the old sign-in provider, and its webhook are removed; Firebase Auth replaced them.
- [Google AdSense](google-adsense.md) - The AdSense script is loaded only on the privacy and delete-account pages, only for signed-out visitors, in production when a publisher id is set, and never in a document that started on the one-time-code page.
- [OneSignal (removed)](onesignal.md) - OneSignal is removed; pushes go through Firebase Cloud Messaging, sent by Cloud Functions.
- [UploadThing (removed)](uploadthing.md) - UploadThing is removed: no screen uploaded images, so its route and components went with the server.
- [Vercel Analytics and Speed Insights (removed)](vercel-analytics.md) - Vercel analytics is removed: the app is served by Firebase Hosting, which has no Vercel insights endpoint.

<!-- GA-GENERATED:END -->
