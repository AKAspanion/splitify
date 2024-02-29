import { NoData } from "@/components/no-data";
import { Suspense } from "react";

const FormComp = () => {
  return (
    <div>
      <NoData title="Coming Soon..." />
    </div>
  );
};

export default function Form() {
  return (
    <Suspense>
      <FormComp />
    </Suspense>
  );
}
