import { useMemo } from "react";
import { SplitDrawerProps } from "../split-drawer.types";
import { fixedNum } from "@/utils/validate";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { Input } from "@/components/ui/input";

const ExactSplit = ({
  currUserId,
  users = [],
  percentSplit = {},
  symbol,
  onPercentSplitChange,
}: SplitDrawerProps) => {
  const total = 100;
  const handleExactChange = (id: string, value: string) => {
    onPercentSplitChange &&
      onPercentSplitChange({ ...percentSplit, [id]: parseFloat(value || "") });
  };

  const used = useMemo(() => {
    return fixedNum(
      Object.values(percentSplit).reduce(
        (sum, a) => sum + (isNaN(a) ? 0 : a),
        0,
      ) || 0,
    );
  }, [percentSplit]);

  const balance = fixedNum(total - used);
  const balanceText = balance >= 0 ? "% left" : "% over";

  return (
    <div className="w-full pt-3 pb-6">
      <div className="flex flex-col gap-6 max-h-[calc(100vh-420px)] overflow-y-auto">
        {users?.map((d) => (
          <UserCard
            user={d}
            key={d.id}
            showMail={false}
            currUserId={currUserId}
            actions={
              <div className="flex gap-3 items-center">
                <div className="text-md">{symbol}</div>
                <div className="max-w-[120px] p-1">
                  <Input
                    type="number"
                    name="amount"
                    value={percentSplit[d.id]}
                    onChange={(e) => handleExactChange(d.id, e.target.value)}
                  />
                </div>
              </div>
            }
          />
        ))}
        <div className="h-[49px]" />
      </div>
      <div className="text-center text-xs font-semibold pt-6">
        <div>
          {used}% of {total}%
        </div>
        <div className={balance !== 0 ? "text-red-500" : ""}>
          {Math.abs(balance)}
          {balanceText}
        </div>
      </div>
    </div>
  );
};

export default ExactSplit;
