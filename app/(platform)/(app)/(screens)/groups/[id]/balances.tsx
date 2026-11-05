"use client";

import {
  useGroupLedger,
  useGroupMembers,
  toUserModel,
} from "@/lib/data/groups";
import { BalancesList } from "./balances-list";
import { BalancesLoader } from "./balances-loader";
import { LoadError } from "./_components/group-states";

const Balances = ({ id, onlyList }: { id: string; onlyList?: boolean }) => {
  const ledger = useGroupLedger(id);
  const members = useGroupMembers(id);

  const error = ledger.error ?? members.error;
  if (error)
    return (
      <LoadError
        error={error}
        onRetry={() => {
          ledger.refetch();
          members.refetch();
        }}
      />
    );

  if (!ledger.data || !members.data)
    return <BalancesLoader onlyList={onlyList} />;

  return (
    <BalancesList
      groupId={id}
      expenses={ledger.data}
      users={members.data.map(toUserModel)}
      onlyList={onlyList}
    />
  );
};

export default Balances;
