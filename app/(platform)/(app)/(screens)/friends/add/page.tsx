"use client";

import { useState } from "react";
import { AutoContainer } from "@/components/container/auto-container";
import { Input } from "@/components/ui/input";

const FriendsAddPage = () => {
  const [email, setEmail] = useState("");
  return (
    <AutoContainer
      header={
        <div className="flex w-full justify-between items-center">
          <div className="w-full font-semibold text-lg">
            <Input
              placeholder="Enter full email to search"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      }
    >
      <></>
    </AutoContainer>
  );
};

export default FriendsAddPage;
