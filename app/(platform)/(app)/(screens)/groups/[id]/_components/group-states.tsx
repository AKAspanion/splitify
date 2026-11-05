"use client";

import Link from "next/link";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import { toUserMessage } from "@/lib/data/errors";

/** What a group screen shows when the group is missing, deleted, or the person isn't a member. */
export const GroupNotFound = () => (
  <NoData
    title="We couldn't find that. It may have been deleted, or you may not be a member."
    action={
      <Link href="/groups">
        <Button type="button" variant="outline">
          Back to groups
        </Button>
      </Link>
    }
  />
);

/** What a list or screen shows when its read failed: the person-facing message and a way to try again. */
export const LoadError = ({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) => (
  <NoData
    title={toUserMessage(error)}
    action={
      <Button type="button" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    }
  />
);
