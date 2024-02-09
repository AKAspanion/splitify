import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertAllValues, convertToObject, fixedNum } from "@/utils/validate";
import { ExpenseType, User } from "@prisma/client";
import { ArrowLeftIcon } from "lucide-react";
import { useMemo, useState } from "react";

type SplitDrawerProps = {
  users?: User[];
  total?: number;
  disabled?: boolean;
  currUserId?: string;
  equalSplit: Record<string, boolean>;
  onEqualSplitChange: (value: Record<string, boolean>) => void;
  splitType: ExpenseType;
  onSplitTypeChange: (value: ExpenseType) => void;
};

export const SplitDrawer = (props: SplitDrawerProps) => {
  const { splitType, disabled, onSplitTypeChange } = props;
  return (
    <Drawer>
      <DrawerTrigger disabled={disabled}>
        <Button
          type="button"
          disabled={disabled}
          className="flex items-center gap-3"
          variant={"outline"}
        >
          <div className="font-bold">Split</div>
          <div>Equally</div>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="px-4 flex gap-4 items-center">
            <DrawerClose>
              <Button type="button" variant="outline" size="icon">
                <ArrowLeftIcon />
              </Button>
            </DrawerClose>
            <div>Split amount</div>
          </DrawerTitle>
        </DrawerHeader>
        <Tabs
          value={splitType}
          className="w-full pt-3 pb-6 px-8"
          onValueChange={(v) => onSplitTypeChange(v as ExpenseType)}
        >
          <TabsList className="w-full">
            <TabsTrigger value={ExpenseType.EQUAL} className="w-full">
              Equal
            </TabsTrigger>
            <TabsTrigger value={ExpenseType.EXACT} className="w-full">
              Exact
            </TabsTrigger>
            <TabsTrigger value={ExpenseType.PERCENT} className="w-full">
              Percentage
            </TabsTrigger>
          </TabsList>
          <TabsContent value={ExpenseType.EQUAL}>
            <EqualSplit {...props} />
          </TabsContent>
          <TabsContent value={ExpenseType.EXACT}>
            {/* <SplitUsers {...props} /> */}
          </TabsContent>
          <TabsContent value={ExpenseType.PERCENT}>
            {/* <SplitUsers {...props} /> */}
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};

const EqualSplit = ({
  currUserId,
  total = 0,
  users = [],
  equalSplit,
  onEqualSplitChange,
}: SplitDrawerProps) => {
  const handleEqualChange = (id: string, value: boolean) => {
    onEqualSplitChange({ ...equalSplit, [id]: value });
  };

  const handleAllChecked = (v: boolean) => {
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
