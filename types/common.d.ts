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

type OweBalanceResult = {
  user1Id: string;
  user1Name: string;
  user2Id: string;
  user2Name: string;
  owes: number;
};

type OweBalanceResultIndex = {
  user1Index: number;
  user2Index: number;
  owes: number;
};
