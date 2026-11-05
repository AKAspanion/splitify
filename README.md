This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:2140](http://localhost:2140) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

To run against the emulators, generate the emulator Hosting config with `node scripts/emulator-firebase-config.mjs`, then
start them with `npx --yes firebase-tools@15.34.2 emulators:start --config firebase.emulators.json --project demo-splitify`.
It is `firebase.json` with the emulators' addresses added to the CSP's `connect-src`; `yarn check:hosting` regenerates it
itself, and it is never deployed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## CI and deploy

| Workflow         | When                                           | What                                                                                                                                                       |
| ---------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`         | Every pull request, and called by `deploy.yml` | Install, lint, type-check, tests, audits, and the hosting build checked on the Hosting emulator                                                            |
| `deploy.yml`     | Push to `main`                                 | Runs CI, then deploys the site to Firebase Hosting. Run it by hand with **deploy_dataconnect** ticked to also deploy the SQL Connect schema and connectors |
| `codeql.yml`     | PRs, pushes, weekly                            | CodeQL security analysis of the code and the workflows                                                                                                     |
| `dependabot.yml` | Weekly                                         | Grouped dependency and GitHub Actions updates                                                                                                              |

Actions are pinned to commit SHAs; Dependabot keeps them current. The Firebase CLI always runs as
`npx --yes firebase-tools@15.34.2`. The whole site is one static export (`yarn build`, written to `out/`), and a page that stops exporting fails the CI build.

The Cloud Functions in `functions/` are not deployed by CI either. Deploy them by hand from your machine, signed in to the
Firebase CLI as a project owner: `yarn deploy:functions`.

`deploy.yml` reads these repository settings (Settings > Secrets and variables > Actions) and fails with a message
naming what is missing, before anything installs:

- **Secret** `FIREBASE_SERVICE_ACCOUNT`: JSON key of `github-deploy@splitify-416321.iam.gserviceaccount.com`.
- **Variable** `FIREBASE_PROJECT_ID`: `splitify-416321`.
- **Variables** `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`, `NEXT_PUBLIC_ONE_SIGNAL_APP_ID` and
  `NEXT_PUBLIC_ONE_SIGNAL_SAFARI_WEB_ID` (all optional): public values the hosting build reads when set.
- **Variable** `APP_URL` (optional): the address shown on deploys; defaults to `https://splitify.spanion.in`.

### One-time setup

Run these once, signed in as the project owner.

1. **Enable the APIs:**

   ```bash
   gcloud services enable --project splitify-416321 \
     cloudfunctions.googleapis.com run.googleapis.com cloudbuild.googleapis.com \
     artifactregistry.googleapis.com eventarc.googleapis.com pubsub.googleapis.com \
     firebasedataconnect.googleapis.com sqladmin.googleapis.com cloudbilling.googleapis.com \
     serviceusage.googleapis.com cloudresourcemanager.googleapis.com iam.googleapis.com
   ```

2. **Create the deploy account:** IAM & Admin > Service accounts > create `github-deploy` and give it these roles:
   Cloud Functions Admin, Cloud Run Admin, Service Account User, Artifact Registry Administrator, Cloud Build
   Editor, Eventarc Admin, Pub/Sub Editor, Firebase Data Connect Admin (`roles/firebasedataconnect.admin`),
   Cloud SQL Admin, Service Usage Consumer, Firebase Viewer and Firebase Hosting Admin (for the hosting deploy).

   Where the list came from: it is the list the CI/CD spec set, checked against Firebase's and Google Cloud's
   documentation. Those documents state only some of it: Cloud Functions Admin plus Service Account User to
   deploy functions (Firebase IAM permissions page), Service Account User on the runtime and Cloud Build
   accounts, and the Cloud Build service account's own role (Cloud Functions IAM roles page, which also notes
   Cloud Functions Admin already carries Eventarc, Cloud Run, Artifact Registry and Cloud Build permissions),
   and the SQL Connect roles (Google Cloud IAM roles reference). They don't list the remainder (Pub/Sub Editor,
   Cloud SQL Admin, Artifact Registry Administrator, Firebase Viewer, Service Usage Consumer), which are kept so
   the CLI can create the Eventarc triggers' topics, the Cloud SQL instance and the function image repository
   and read the project. If a deploy fails with a permission error, the log names the missing permission.

3. **Add the key to GitHub:** create a JSON key for `github-deploy`, save its contents as the secret
   `FIREBASE_SERVICE_ACCOUNT`, then delete the downloaded file. Add the variable `FIREBASE_PROJECT_ID` and,
   if wanted, `APP_URL` and the optional Variables above.
4. **First SQL Connect deploy, by hand:** run `yarn deploy:dataconnect` from a machine signed in with `firebase login`.
   It creates the free-trial Cloud SQL instance `splitify-fdc`, which takes several minutes. After that, the
   **deploy_dataconnect** option of `deploy.yml` deploys schema changes.
5. **Custom domain:** Firebase console > Hosting > **Add custom domain** > `splitify.spanion.in`. Add the DNS
   records it shows at the `spanion.in` DNS provider, replacing any old `splitify` record. The certificate can take
   a few hours to issue.
6. **Authorized domain:** Firebase console > Authentication > Settings > **Authorized domains** > add
   `splitify.spanion.in`.

### Budget kill switch

`functions/` holds `billingKillSwitch`, a Cloud Function in `asia-south1` that listens on the Pub/Sub topic
`budget-alerts`, receives the monthly budget's notifications and **unlinks the billing account** once actual spend
reaches the budget. Without billing the project falls back to the free Spark limits, and anything beyond them
stops instead of being charged. Forecast alerts don't trigger it. Cloud Billing reports spend several hours late,
so the final bill can end up a little over the budget.

Setup in the Google Cloud console for `splitify-416321`, signed in as the project owner:

1. **Service account:** IAM & Admin > Service accounts > create `billing-kill-switch` with the **Project Billing
   Manager** role. That role is all it needs to turn billing off for this project.
2. **API:** enable the Cloud Billing API (`cloudbilling.googleapis.com`; step 1 above already does).
3. **Deploy:** `yarn deploy:functions`. This creates the function and its topic `budget-alerts`.
4. **Let the trigger call the function:** Cloud Run > `billingkillswitch` > Permissions > add principal
   `billing-kill-switch@splitify-416321.iam.gserviceaccount.com` with the **Cloud Run Invoker** role. Pub/Sub
   delivers as that account, and the Firebase CLI only grants invoke rights for HTTP and scheduled functions. Without
   it, the logs show `lacks {run.routes.invoke}`.
5. **Connect the budget:** Billing > Budgets & alerts > the monthly budget > Edit > Actions > **Connect a Pub/Sub
   topic to this budget** > project `splitify-416321`, topic `budget-alerts` > Save.
6. **Check the wiring:** Pub/Sub > Topics > `budget-alerts` > Messages > **Publish message** with the body
   `{"costAmount": 0.5, "budgetAmount": 5, "currencyCode": "USD"}`. The function's logs should show
   `Budget check: under-budget`. Never publish a `costAmount` at or above `budgetAmount`: that really turns billing
   off.

To turn billing back on after it fires, raise the budget first, then link the billing account again in Billing >
Account management.
