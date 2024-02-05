"use client";

import { UserButton } from "@clerk/nextjs";

const ProfilePage = () => {
  return (
    <div className="p-4">
      <UserButton afterSignOutUrl="/" />
    </div>
  );
};

export default ProfilePage;
