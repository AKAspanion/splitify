import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertAllValues, convertToObject, fixedNum } from "@/utils/validate";
import { ExpenseType, User } from "@prisma/client";
import { ArrowLeftIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { boolean } from "zod";

type SplitDrawerProps = {
  users?: User[];
  total?: number;
  currUserId?: string;
  split: Record<ExpenseType, Record<string, number>>;
  onChange: (type: ExpenseType, value: Record<string, number>) => void;
};

export const SplitDrawer = (props: SplitDrawerProps) => {
  const { users = [] } = props;
  return (
    <Drawer>
      <DrawerTrigger>
        <Button
          type="button"
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
          defaultValue={ExpenseType.EQUAL}
          className="w-full pt-3 pb-6 px-8"
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

const EqualSplit = (props: SplitDrawerProps) => {
  const handleChange = () => {};
  return (
    <SplitUsers {...props} type={ExpenseType.EQUAL} onChange={handleChange} />
  );
};

const SplitUsers = ({
  type,
  currUserId,
  split,
  total = 0,
  users = [],
  onChange,
}: SplitDrawerProps & {
  type: ExpenseType;
  onChange?: (value: Record<string, number>) => void;
}) => {
  const [checkedUsers, setCheckedUsers] = useState<Record<string, boolean>>(
    convertToObject(users || [], "id", true)
  );

  const handleEqualChange = (id: string, value: boolean) => {
    setCheckedUsers((c) => ({ ...c, [id]: value }));
  };

  const handleAllChecked = (v: boolean) => {
    setCheckedUsers((s) => ({ ...convertAllValues(s, v) }));
  };

  const checkedPeople = useMemo(() => {
    return Object.values(checkedUsers).filter((v) => v).length;
  }, [checkedUsers]);

  const allChecked = useMemo(() => {
    return checkedPeople === users.length;
  }, [checkedPeople, users.length]);

  const equalShare = useMemo(
    () => (total === 0 ? 0 : fixedNum(total / checkedPeople, 2)),
    [checkedPeople, total]
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
              type === "EQUAL" ? (
                <div>
                  <Checkbox
                    checked={checkedUsers[d.id]}
                    onCheckedChange={(e) => handleEqualChange(d.id, !!e)}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex gap-3 items-center">
                    <div className="text-md">₹</div>
                    <div className="max-w-[120px]">
                      <Input
                        type="number"
                        name="amount"
                        // value={split[d.id] === 0 ? "" : split[d.id]}
                        // onChange={(e) => onChange(d.id, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )
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
