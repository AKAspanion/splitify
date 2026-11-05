import { FormInputLoading } from "@/components/form/form-input-loading";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toUserMessage } from "@/lib/data/errors";
import Link from "next/link";

const ExpenseFormLoading = ({ add }: { add?: boolean }) => {
  return (
    <div className="flex flex-col gap-4 py-6 px-8">
      <div className="flex justify-between items-center gap-4 mb-3">
        <Skeleton className="w-10 h-10 rounded-md" />
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormInputLoading />
        {add ? (
          <>
            <FormInputLoading />
            <FormInputLoading />
            <FormInputLoading />
          </>
        ) : null}
      </div>
      {add ? (
        <div className="flex justify-between items-center gap-4">
          <Skeleton className="w-[100px] h-10 rounded-md" />
          <Skeleton className="w-10 h-5 rounded-md" />
          <Skeleton className="w-[100px] h-10 rounded-md" />
        </div>
      ) : null}
      <div className="flex justify-end items-center gap-4">
        <Skeleton className="w-[50px] h-10 rounded-md" />
      </div>
    </div>
  );
};

export default ExpenseFormLoading;

export const NOT_FOUND_TEXT =
  "We couldn't find that. It may have been deleted, or you may not be a member.";

/** What an expense screen shows when its record came back `null`. */
export const ExpenseNotFound = () => (
  <NoData
    title={NOT_FOUND_TEXT}
    action={
      <Link href="/groups">
        <Button variant="secondary">Go to groups</Button>
      </Link>
    }
  />
);

/** What an expense screen shows when its read failed. */
export const ExpenseLoadError = ({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) => (
  <NoData
    title={toUserMessage(error)}
    action={
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    }
  />
);
