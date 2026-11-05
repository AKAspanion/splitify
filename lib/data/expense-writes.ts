import {
  connectDataConnectEmulator,
  executeMutation,
  getDataConnect,
  mutationRef,
  type ConnectorConfig,
  type DataConnect,
} from "firebase/data-connect";
import { getFirebaseApp, getFirebaseAuth } from "@/lib/firebase/app";
import { EMULATOR_HOST, EMULATOR_PORTS } from "@/lib/firebase/emulators";

// The `expense` connector has no generated SDK (its lists don't fit the generated web SDK), so its mutations are
// called by name through mutationRef. The config is dataconnect/expense/connector.yaml.
const expenseConfig: ConnectorConfig = {
  connector: "expense",
  service: "splitify",
  location: "asia-south1",
};

export type CreateExpenseVars = {
  id: string;
  groupId: string;
  amount: number;
  description: string;
  category?: string | null;
  type: "EQUAL" | "EXACT" | "PERCENT";
  payments: { id: string; userId: string; amount: number }[];
  splits: {
    id: string;
    userId: string;
    amount: number;
    percent?: number | null;
  }[];
  activityId: string;
};

export type CreateSettlementVars = {
  id: string;
  groupId: string;
  amount: number;
  fromUserId: string;
  toUserId: string;
  paymentId: string;
  splitId: string;
  activityId: string;
};

let expenseClient: DataConnect | undefined;

function expenseConnector(): DataConnect {
  if (expenseClient) return expenseClient;
  // Auth first, so the connector reads the same signed-in person as the rest of the app.
  getFirebaseAuth();
  const client = getDataConnect(getFirebaseApp(), expenseConfig);
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true")
    connectDataConnectEmulator(
      client,
      EMULATOR_HOST,
      EMULATOR_PORTS.dataconnect,
    );
  expenseClient = client;
  return client;
}

// The caller makes every UUID, so a retry of the same write fails on its key and changes nothing.
const idOnly = (id: string) => ({ id });

export async function createExpense(
  vars: CreateExpenseVars,
): Promise<{ id: string }> {
  // The connector's @auth requires every row to name the expense it belongs to, so it is set here from vars.id.
  const rows = {
    ...vars,
    payments: vars.payments.map((p) => ({ ...p, expenseId: vars.id })),
    splits: vars.splits.map((s) => ({ ...s, expenseId: vars.id })),
  };
  await executeMutation(
    mutationRef(expenseConnector(), "CreateExpense", rows as never),
  );
  return idOnly(vars.id);
}

export async function createSettlement(
  vars: CreateSettlementVars,
): Promise<{ id: string }> {
  await executeMutation(
    mutationRef(expenseConnector(), "CreateSettlement", vars as never),
  );
  return idOnly(vars.id);
}
