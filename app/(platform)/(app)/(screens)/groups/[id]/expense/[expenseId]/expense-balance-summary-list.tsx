"use client";

import { replaceUserWithYou } from "@/app/(platform)/(app)/_utils/user";
import { RUPPEE_SYMBOL } from "@/constants/ui";
import { ExpenseWithPaymentWithSplit } from "@/types/shared";
import { getOwsKeyword, getVerbKeyword } from "@/utils/validate";
import { User, UserPayment, UserSplit } from "@prisma/client";
import { useMemo, useState } from "react";

const MAX_LIST_COUNT = 2;

const BalanceSummaryList = ({
  userId,
  payments,
  splits,
  users,
}: {
  userId: string | null;
  users: User[] | null;
  payments: UserPayment[] | null;
  splits: UserSplit[] | null;
  // expense: ExpenseWithPaymentWithSplit | null;
}) => {
  const [show, setShow] = useState(false);
  const summaryList = useMemo(() => {
    const list = users?.map((u) => {
      const paid = payments?.find((p) => p.userId === u.id)?.amount || 0;
      const owed = splits?.find((s) => s.userId === u.id)?.amount || 0;

      const name = replaceUserWithYou(userId, u?.id, u?.firstName || u?.name);

      if (!paid && !owed) {
        return `${name} ${getVerbKeyword(name)} not involved`;
      }

      return `${name} paid ${RUPPEE_SYMBOL}${paid} and ${getOwsKeyword(name)} ${RUPPEE_SYMBOL}${owed}`;
    });

    return (
      list?.sort((a) => (a.includes("not") || a.includes("₹0") ? 1 : -1)) || []
    );
  }, [payments, splits, users, userId]);

  const summary = useMemo(
    () => (!show ? summaryList?.slice(0, MAX_LIST_COUNT) : summaryList),
    [show, summaryList],
  );

  return !userId ? null : (
    <div className="flex flex-col gap-2">
      {summary?.map((s, i) => (
        <div key={i} className="text-xs">
          {s}
        </div>
      ))}
      {summaryList?.length > MAX_LIST_COUNT ? (
        <div
          className="text-xs underline cursor-pointer text-sparkle"
          onClick={() => setShow((s) => !s)}
        >
          {show ? "Show less" : "Show more"}
        </div>
      ) : null}
    </div>
  );
};

export default BalanceSummaryList;
