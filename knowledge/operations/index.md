# Operations

<!-- GA-GENERATED:index -->

- [CI and deploy workflows](ci-cd.md) - What the GitHub Actions workflows check on pull requests and deploy on push to main, and which repository settings the deploy reads.
- [Deploy setup, done once](deploy-setup.md) - The one-time Google Cloud and GitHub steps before the deploy workflow and the budget kill switch work, and what is still unconfirmed about the deploy account's roles.
- [Environment](environment.md) - Every environment variable the app reads, listed in .env.sample, and where each is read.
- [Logging](logging.md) - Cloud Functions write structured logs to Cloud Logging; the browser logs to its console; there is no Log table or logging switch.
- [Run locally](run-locally.md) - Install with pnpm, start the web app and every emulator with pnpm dev on the demo project, run the rule tests, and check the static build on the Hosting emulator.
- [The service worker](service-worker.md) - One worker, public/sw.js, caches the app shell for offline use and also handles push; how it is built, how it routes requests, how it updates, and what it cannot be tested with.

<!-- GA-GENERATED:END -->
