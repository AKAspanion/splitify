// Cloud Functions for Splitify. Each function is added by the task that needs it.
import { CloudBillingClient } from "@google-cloud/billing";
import * as logger from "firebase-functions/logger";
import { projectID } from "firebase-functions/params";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { enforceBudget, parseNotification } from "./kill-switch";

export { deleteMyAccount } from "./account/delete-my-account";
export { mergeContactOnSignUp } from "./merge-contact";
export { reports } from "./reports";
export { webauthn } from "./webauthn";
export {
  sendActivityPushApp,
  sendActivityPushExpense,
  sendGroupDeletedPush,
} from "./push-activity";

let billing: CloudBillingClient | undefined;

// Runs on every notification from the budget connected to the "budget-alerts" topic
// (Cloud Billing sends several a day). See README > Budget kill switch.
export const billingKillSwitch = onMessagePublished(
  {
    topic: "budget-alerts",
    region: "asia-south1",
    // Dedicated account holding only Project Billing Manager on this project.
    serviceAccount: "billing-kill-switch@",
    maxInstances: 1,
  },
  async (event) => {
    const notification = parseNotification(event.data.message.data);
    if (!notification) {
      logger.warn("Ignoring a message that is not a budget notification", {
        messageId: event.data.message.messageId,
      });
      return;
    }

    billing ??= new CloudBillingClient();
    const projectId = projectID.value() || process.env.GCLOUD_PROJECT;
    if (!projectId)
      throw new Error(
        "Cannot tell which project to protect: FIREBASE_CONFIG and GCLOUD_PROJECT are unset",
      );
    const outcome = await enforceBudget(notification, projectId, billing);
    const details = { projectId, ...notification };
    if (outcome === "disabled")
      logger.error(
        "Budget exceeded: billing disabled for the project",
        details,
      );
    else logger.info(`Budget check: ${outcome}`, details);
  },
);
