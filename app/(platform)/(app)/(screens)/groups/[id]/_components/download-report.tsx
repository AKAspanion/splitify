"use client";

// The report download is hidden until reports move to a function (spec 2c): it called route handlers
// (`/api/generate/...`) that the hosting build doesn't have. The group page still renders this in its header, so
// the button comes back by restoring this component from git history.
export const DownloadReport = (_props: { groupId: string }) => null;
