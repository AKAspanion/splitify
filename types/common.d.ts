// declare interface ServerSideComponentProp<Params, SearchParams = undefined> {
//   params: Params;
//   searchParams: SearchParams;
// }

type ServerSideComponentProp = {
  params: Params;
  searchParams?: SearchParams;
};
