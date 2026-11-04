import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { resolvePageProps } from "@/utils/page";

const ExpenseDetails = dynamic(() => import("./expense-details"), {
  loading: () => (
    <div className="flex flex-col gap-6 py-6 px-8">
      <div className="flex justify-between items-center gap-4">
        <Skeleton className="w-[100px] h-8 rounded-md" />
        <div className="flex justify-between gap-4">
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="w-10 h-10 rounded-md" />
        </div>
      </div>
      <Skeleton className="w-[60px] h-6 mb-1" />
    </div>
  ),
});

const ExpenseDetailsPage = async (pageProps: ServerSidePageProp) => {
  const props = await resolvePageProps(pageProps);
  const keyString = `balance=${props?.searchParams?.["balance"]}`;
  return (
    <Suspense key={keyString}>
      <ExpenseDetails {...props} />
    </Suspense>
  );
};

export default ExpenseDetailsPage;
