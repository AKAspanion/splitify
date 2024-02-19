import { Split } from "./split";

export class PercentSplit extends Split {
  percent: number;
  constructor(user: string, percent: number, amount?: number) {
    super(user, amount);
    this.percent = percent;
  }

  public getPercent(): number {
    return this.percent;
  }

  public setPercent(percent: number): void {
    this.percent = percent;
  }
}
