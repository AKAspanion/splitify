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
import { useEffect, useState } from "react";
import { urlEncode } from "@/utils/func";

const Search = ({
  backTo,
  groupId,
  mail: mailProp,
}: {
  backTo: string;
  groupId?: string;
  mail?: string;
}) => {
  const { user } = useUser();
  const [mail, setMail] = useState(mailProp || "");
  const { execute, data, fieldErrors } = useAction(searchUser);

  const onSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;

    await execute({ email });
  };

  const getNotFoundLink = () => {
    return urlEncode({
      path: "/friends/add/contact",
      query: { groupId: groupId || "", back: backTo, email: mail },
    });
  };

  useEffect(() => {
    if (mailProp) {
      execute({ email: mailProp });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                onChange={(e) => setMail(e.target.value)}
                defaultValue={mailProp}
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
                        groupId={groupId}
                        isFriend={!!d?.friends?.find((u) => u.id === user?.id)}
                      />
                    }
                  />
                ))}
              </div>
              <div className="text-center text-sm">
                {data !== undefined && data.length === 0 ? (
                  <div className="flex flex-col gap-3">
                    <div>No search results found</div>
                    <Link
                      className="text-sparkle underline"
                      href={getNotFoundLink()}
                    >
                      Add {mail} to splitify?
                    </Link>
                  </div>
                ) : null}
              </div>
            </FormLoaded>
          </form>
        </div>
      </div>
    </>
  );
};

export default Search;
