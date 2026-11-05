import { getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import { guard } from "../http/guard";
import { buildCsv, type LedgerExpense } from "./csv";
import { buildExcel } from "./excel";
import { buildText } from "./text";

const REGION = "asia-south1";
const SERVICE = "splitify";
const ADMIN_APP = "reports";

const FORMATS = ["excel", "csv", "text"] as const;
type Format = (typeof FORMATS)[number];

const UUID =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

function adminApp(): App {
  return getApps().some((a) => a.name === ADMIN_APP)
    ? getApp(ADMIN_APP)
    : initializeApp({}, ADMIN_APP);
}

// Only `admin` connector operations run here: `NO_ACCESS` operations that no signed-in person can call.
function adminConnector() {
  return getDataConnect(
    { serviceId: SERVICE, location: REGION, connector: "admin" },
    adminApp(),
  );
}

/** The class of an error, for logs: never its message, which can hold a query or a name. */
const causeClass = (error: unknown): string =>
  error instanceof Error ? error.constructor.name : typeof error;

/** A file name safe in a header: no control characters, quotes or path separators, and not empty. */
const fileStem = (title: string): string =>
  title.replace(/[\u0000-\u001f\u007f"\\/;:*?<>|%]/g, " ").trim() || "Group";

const contentDisposition = (title: string, extension: string): string => {
  const stem = fileStem(title);
  const ascii = stem.replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}.${extension}"; filename*=UTF-8''${encodeURIComponent(`${stem}.${extension}`)}`;
};

type Ledger = {
  group: { title: string } | null;
  expenses: LedgerExpense[];
};

/**
 * `POST /api/reports/expenses` with `{ groupId, format }`: the group's expenses as a workbook, a CSV or a text
 * file, for the group's members only. A group that does not exist and a group the caller is not in answer the same.
 */
export const reports = onRequest({ region: REGION }, async (req, res) => {
  const caller = await guard(req, res);
  if (!caller) return;

  if (req.method !== "POST") {
    res.status(405).json({ message: "Use POST." });
    return;
  }

  const { groupId, format } = (caller.body ?? {}) as {
    groupId?: unknown;
    format?: unknown;
  };
  if (
    typeof groupId !== "string" ||
    groupId === "" ||
    typeof format !== "string" ||
    !FORMATS.includes(format as Format)
  ) {
    res.status(400).json({ message: "Choose a report format." });
    return;
  }
  const notFound = () => res.status(404).json({ message: "Not found" });
  // An id that is not a UUID names no group, and the connector would refuse it.
  if (!UUID.test(groupId)) {
    notFound();
    return;
  }

  let operation = "IsGroupMember";
  try {
    const connector = adminConnector();
    const member = await connector.executeQuery<
      { groupMember: { userId: string } | null },
      { groupId: string; userId: string }
    >("IsGroupMember", { groupId, userId: caller.uid });
    if (!member.data.groupMember) {
      notFound();
      return;
    }

    operation = "GetGroupLedgerAdmin";
    const { data } = await connector.executeQuery<Ledger, { groupId: string }>(
      "GetGroupLedgerAdmin",
      { groupId },
    );
    if (!data.group) {
      notFound();
      return;
    }
    if (data.expenses.length === 0) {
      res.status(404).json({ message: "No expenses found" });
      return;
    }

    const title = data.group.title;
    const kind = format as Format;
    let file: Buffer | string;
    let extension: string;
    let contentType: string;
    if (kind === "excel") {
      file = await buildExcel(title, data.expenses);
      extension = "xlsx";
      contentType = "application/vnd.ms-excel";
    } else if (kind === "csv") {
      file = buildCsv(data.expenses);
      extension = "csv";
      contentType = "text/csv; charset=utf-8";
    } else {
      file = buildText(title, data.expenses);
      extension = "txt";
      contentType = "text/plain; charset=utf-8";
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", contentDisposition(title, extension));
    res.status(200).send(file);
  } catch (error) {
    logger.error("reports failed", { operation, cause: causeClass(error) });
    res.status(500).json({ message: "Something went wrong" });
  }
});
