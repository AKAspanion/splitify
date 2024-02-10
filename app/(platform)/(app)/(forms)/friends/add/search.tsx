"use client";

import { searchUser } from "@/actions/search-user";
import { FormInput } from "@/components/form/form-input";
import { FormLoaded } from "@/components/form/form-loaded";
import { FormLoading } from "@/components/form/form-loading";
import { FormSubmit } from "@/components/form/form-submit";
import Spinner from "@/components/ui/spinner";
import { useAction } from "@/hooks/use-action";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Action } from "./action";
import { useUser } from "@clerk/nextjs";

const Search = ({ backTo }: { backTo: string }) => {
  const { user } = useUser();
  const { execute, data, fieldErrors } = useAction(searchUser);

  const onSubmit = (formData: FormData) => {
    const email = formData.get("email") as string;

    execute({ email });
  };

  return (
    <>
      <div className="flex w-full justify-between items-center">
        <div className="w-full font-semibold text-lg">
          <form action={onSubmit}>
            <div className="flex items-center gap-4">
              <Link href={backTo ? backTo : "/friends"}>
                <Button type="button" variant={"ghost"} size={"icon"}>
                  <ArrowLeftIcon />
                </Button>
              </Link>
              <FormInput
                id="email"
                name="email"
                placeholder="Enter your friend's full email to find"
                errors={fieldErrors?.email}
              />
              <FormSubmit>Find</FormSubmit>
            </div>
            <FormLoading>
              <div className="p-16 flex items-center justify-center">
                <Spinner />
              </div>
            </FormLoading>
            <FormLoaded>
              <div className="py-6 flex flex-col gap-6">
                {data?.map((d) => (
                  <UserCard
                    user={d}
                    key={d.id}
                    actions={
                      <Action
                        id={d.id}
                        isFriend={!!d?.friends?.find((u) => u.id === user?.id)}
                      />
                    }
                  />
                ))}
              </div>
              <div className="text-center text-sm">
                {data !== undefined && data.length === 0
                  ? "No search results found"
                  : null}
              </div>
            </FormLoaded>
          </form>
        </div>
      </div>
    </>
  );
};

export default Search;
