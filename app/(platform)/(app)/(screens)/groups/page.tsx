"use client";

import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";
import GroupList from "./group-list";

const GroupsPage = () => (
  <>
    <VerifyEmailBanner dismissable />
    <GroupList />
  </>
);

export default GroupsPage;
