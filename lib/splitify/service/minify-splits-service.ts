import { RUPPEE_SYMBOL } from "@/constants/ui";
import { fixedNum, getOwsKeyword } from "@/utils/validate";

export class MinifySplitsService {
  N: number;
  solved: boolean;
  balances: OweBalanceResultIndex[];
  users: string[];
  counter: number;

  constructor(users: string[]) {
    this.balances = [];
    this.solved = false;
    this.users = users;
    this.N = users.length;
    this.counter = 0;
  }

  getMin(arr: number[]) {
    var minInd = 0;
    for (let i = 1; i < this.N; i++) if (arr[i] < arr[minInd]) minInd = i;
    return minInd;
  }

  getMax(arr: number[]) {
    var maxInd = 0;
    for (let i = 1; i < this.N; i++) if (arr[i] > arr[maxInd]) maxInd = i;
    return maxInd;
  }

  minOf2(x: number, y: number) {
    return x < y ? x : y;
  }

  // amount[p] indicates the net amount
  // to be credited/debited to/from person 'p'
  // If amount[p] is positive, then
  // i'th person will amount[i]
  // If amount[p] is negative, then
  // i'th person will give -amount[i]
  minCashFlowRec(amount: number[]) {
    // Find the indexes of minimum and
    // maximum values in amount
    // amount[mxCredit] indicates the maximum amount
    // to be given (or credited) to any person .
    // And amount[mxDebit] indicates the maximum amount
    // to be taken(or debited) from any person.
    // So if there is a positive value in amount,
    // then there must be a negative value
    var mxCredit = this.getMax(amount),
      mxDebit = this.getMin(amount);

    // If both amounts are 0, then
    // all amounts are settled
    if (amount[mxCredit] == 0 && amount[mxDebit] == 0) return;

    // Find the minimum of two amounts
    var min = fixedNum(this.minOf2(-amount[mxDebit], amount[mxCredit]));
    amount[mxCredit] -= min;
    amount[mxDebit] += min;

    // this.balances.push(`Person ${mxDebit} pays ${min} to Person ${mxCredit}`);
    this.balances.push({
      user1Index: mxDebit,
      user2Index: mxCredit,
      owes: min,
    });
    // Recur for the amount array.
    // Note that it is guaranteed that
    // the recursion would terminate
    // as either amount[mxCredit] or
    // amount[mxDebit] becomes 0
    this.minCashFlowRec(amount);
  }

  // Given a set of persons as graph
  // where graph[i][j] indicates
  // the amount that person i needs to
  // pay person j, this function
  // finds and prints the minimum
  // cash flow to settle all debts.
  minCashFlow(graph: number[][]) {
    // Create an array amount,
    // initialize all value in it as 0.
    var amount = Array.from({ length: this.N }, (_, i) => 0);

    // Calculate the net amount to
    // be paid to person 'p', and
    // stores it in amount[p]. The
    // value of amount[p] can be
    // calculated by subtracting
    // debts of 'p' from credits of 'p'
    for (let p = 0; p < this.N; p++)
      for (let i = 0; i < this.N; i++) amount[p] += graph[i][p] - graph[p][i];

    this.minCashFlowRec(amount.map((a) => fixedNum(a)));
  }

  getBalancesTable() {
    return this.balances;
  }

  getBalancesList() {
    const balances: string[] = [];
    this.balances.forEach((b) => {
      const user1 = this.users[b.user1Index];
      balances.push(
        `${user1} ${getOwsKeyword(user1)} ${this.users[b.user2Index]} ${RUPPEE_SYMBOL}${fixedNum(b.owes)}`,
      );
    });

    return balances;
  }

  // create graph from balance list
  static createGraph(
    N: number,
    userIdsArr: string[],
    baseBalances: OweBalanceResult[],
  ) {
    const graph: number[][] = [];
    for (let i = 0; i < N; i++) {
      graph[i] = [];
      for (let j = 0; j < N; j++) {
        graph[i][j] = 0;
      }
    }

    for (let rowIndex = 0; rowIndex < N; rowIndex++) {
      const userId = userIdsArr[rowIndex];
      baseBalances
        .filter((b) => b.user1Id === userId)
        .forEach((b) => {
          const columnIndex = userIdsArr.findIndex((x) => x === b.user2Id);
          if (columnIndex >= 0) {
            graph[rowIndex][columnIndex] = fixedNum(b.owes);
          }
        });
    }

    return graph;
  }

  execute(graph: number[][]) {
    if (this.solved) return;
    this.solved = true;
    this.minCashFlow(graph);
  }
}
