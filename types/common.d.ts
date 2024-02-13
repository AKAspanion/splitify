// declare interface ServerSideComponentProp<Params, SearchParams = undefined> {
//   params: Params;
//   searchParams: SearchParams;
// }

declare global {
  interface Window {}
}


type ServerSideComponentProp = {
  params: Params;
  searchParams?: SearchParams;
};
