"use client";

import { searchUser } from "@/actions/search-user";
import { FormInput } from "@/components/form/form-input";
import { FormLoaded } from "@/components/form/form-loaded";
import { FormLoading } from "@/components/form/form-loading";
import { FormSubmit } from "@/components/form/form-submit";
import Spinner from "@/components/ui/spinner";
import { useAction } from "@/hooks/use-action";
import { UserCard } from "../../../_components/user-card";

const Search = () => {
  const { execute, data, fieldErrors } = useAction(searchUser, {
    onSuccess: (data) => {
      //   console.log("data", data);
    },
    onError: () => {},
  });

  const onSubmit = (formData: FormData) => {
    const email = formData.get("email") as string;

    execute({ email });
  };

  return (
    <>
      <div className="flex w-full justify-between items-center">
        <div className="w-full font-semibold text-lg">
          <form action={onSubmit}>
            <div className="flex gap-4">
              <FormInput
                id="email"
                name="email"
                placeholder="Enter full email to search"
                errors={fieldErrors?.email}
              />
              <FormSubmit>Search</FormSubmit>
            </div>
            <FormLoading>
              <div className="p-16 flex items-center justify-center">
                <Spinner />
              </div>
            </FormLoading>
            <FormLoaded>
              {data?.map((d) => (
                <UserCard user={d} key={d.id} />
              ))}
            </FormLoaded>
          </form>
        </div>
      </div>
    </>
  );
};

export default Search;
