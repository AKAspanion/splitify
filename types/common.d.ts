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

type FormatedBalanceResult = {
  message: string;
  user1Id: string;
  user1Name: string;
  user2Id: string;
  user2Name: string;
  owes: number;
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

type SendNotificationUserbody = {
  heading: string;
  content: string;
  external_id: string[];
  options?: SendNotificationOptions;
};

type SendNotificationOptions = {
  url?: string;
};
