import { useMemo } from "react";
import { SplitDrawerProps } from "../split-drawer.types";
import { convertAllValues, convertToObject, fixedNum } from "@/utils/validate";
import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { Checkbox } from "@/components/ui/checkbox";

const EqualSplit = ({
  currUserId,
  total = 0,
  users = [],
  equalSplit = {},
  onEqualSplitChange,
}: SplitDrawerProps) => {
  const handleEqualChange = (id: string, value: boolean) => {
    onEqualSplitChange && onEqualSplitChange({ ...equalSplit, [id]: value });
  };

  const handleAllChecked = (v: boolean) => {
    onEqualSplitChange &&
      onEqualSplitChange({ ...convertAllValues(equalSplit, v) });
  };

  const checkedPeople = useMemo(() => {
    return Object.values(equalSplit).filter((v) => v).length;
  }, [equalSplit]);

  const allChecked = useMemo(() => {
    return checkedPeople === users.length;
  }, [checkedPeople, users.length]);

  const equalShare = useMemo(
    () => (total === 0 ? 0 : fixedNum(total / checkedPeople, 2)),
    [checkedPeople, total],
  );

  return (
    <div className="w-full pt-3 pb-6">
      <div className="flex flex-col gap-6">
        {users?.map((d) => (
          <UserCard
            user={d}
            key={d.id}
            showMail={false}
            currUserId={currUserId}
            actions={
              <div>
                <Checkbox
                  checked={equalSplit[d.id]}
                  onCheckedChange={(e) => handleEqualChange(d.id, !!e)}
                />
              </div>
            }
          />
        ))}
        <hr />
        <div className="flex w-full gap-6 items-center justify-between">
          <div>All</div>
          <div>
            <Checkbox
              checked={allChecked}
              onCheckedChange={() => handleAllChecked(!allChecked)}
            />
          </div>
        </div>
      </div>
      <div className="text-center text-xs font-semibold pt-6">
        {checkedPeople === 0 ? (
          <div className="text-red-500">Please select at least 1 People</div>
        ) : (
          <>
            <div>₹{equalShare}/person</div>
            <div>{checkedPeople} people</div>
          </>
        )}
      </div>
    </div>
  );
};

export default EqualSplit;
