/** Next passes a page its params and searchParams as promises; the components under it take them resolved. */
export const resolvePageProps = async ({
  params,
  searchParams,
}: ServerSidePageProp): Promise<ServerSideComponentProp> => ({
  params: await params,
  searchParams: await searchParams,
});
