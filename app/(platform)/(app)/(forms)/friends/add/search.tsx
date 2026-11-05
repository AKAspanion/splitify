"use client";

import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Action } from "./action";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toUserMessage } from "@/lib/data/errors";
import {
  normaliseEmail,
  peopleHref,
  toCardUser,
  useFriends,
  useSearchUser,
  validateContact,
} from "@/lib/data/people";

const Search = ({
  backTo,
  groupId,
  mail: mailProp,
}: {
  backTo?: string;
  groupId?: string;
  mail?: string;
}) => {
  const { user } = useAuth();
  const [mail, setMail] = useState(mailProp || "");
  // The email that is searched: set when the form is sent, or from the link's `email`.
  const [submitted, setSubmitted] = useState(mailProp || "");
  const [fieldError, setFieldError] = useState<string | undefined>();

  const search = useSearchUser(submitted);
  const friends = useFriends();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const check = validateContact({ name: "valid name", email: mail });
    if (!check.ok && check.errors.email) {
      setFieldError("Search keyword must be an email");
      return;
    }
    setFieldError(undefined);
    setSubmitted(mail);
  };

  const found = search.data;
  const searching = submitted.trim() !== "" && search.isFetching;
  const isFriend =
    !!found && !!friends.data?.some((friend) => friend.id === found.id);

  const notFoundLink = peopleHref("/friends/add/contact", {
    groupId,
    back: backTo,
    email: normaliseEmail(submitted),
  });

  return (
    <div className="flex w-full justify-between items-center">
      <div className="w-full font-semibold text-lg">
        <form onSubmit={onSubmit}>
          <div className="flex items-start gap-4">
            <Link href={backTo ? backTo : "/friends"}>
              <Button type="button" variant={"ghost"} size={"icon"}>
                <ArrowLeftIcon />
              </Button>
            </Link>
            <FormInput
              id="email"
              name="email"
              type="email"
              aria-label="Friend's email"
              placeholder="Enter your friend's full email to find"
              errors={fieldError ? [fieldError] : undefined}
              onChange={(e) => setMail(e.target.value)}
              value={mail}
            />
            <div className="flex justify-end items-center">
              <Button type="submit" loading={searching} disabled={searching}>
                Find
              </Button>
            </div>
          </div>
        </form>
        {searching ? (
          <div className="p-16 flex items-center justify-center">
            <Spinner />
          </div>
        ) : search.error ? (
          <div className="py-6 flex flex-col items-center gap-3 text-sm font-normal text-center">
            <div>{toUserMessage(search.error)}</div>
            <Button
              type="button"
              variant="outline"
              onClick={() => search.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : submitted.trim() === "" ? null : found ? (
          <div className="py-6 flex flex-col gap-6">
            <UserCard
              user={toCardUser(found)}
              currUserId={user?.uid}
              actions={
                found.id === user?.uid ? null : (
                  <Action id={found.id} groupId={groupId} isFriend={isFriend} />
                )
              }
            />
          </div>
        ) : search.isSuccess ? (
          <div className="py-6 text-center text-sm font-normal">
            <div className="flex flex-col gap-3">
              <div>No search results found</div>
              <Link className="text-sparkle underline" href={notFoundLink}>
                Add as a contact
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Search;
