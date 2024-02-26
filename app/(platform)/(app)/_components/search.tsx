"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { urlEncode } from "@/utils/func";

export const Search = ({
  searchParams,
  path,
  queryText,
  queryKey = "text",
}: {
  path: string;
  queryKey?: string;
  queryText?: string;
} & Partial<ServerSideComponentProp>) => {
  const router = useRouter();
  const initialRender = useRef(true);

  const [text, setText] = useState(queryText);
  const [query] = useDebounce(text, 750);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (query !== undefined) {
      router.push(
        urlEncode({ path, query: { ...searchParams, [queryKey]: query } }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="relative rounded-md shadow-sm">
      <Input
        value={text}
        placeholder="Search groups..."
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
};
