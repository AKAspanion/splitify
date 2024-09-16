import { UserCard } from "@/app/(platform)/(app)/_components/user-card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { fixedNum } from "@/utils/validate";
import { User } from "@prisma/client";
import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { useFormStatus } from "react-dom";

type PaymentDrawerProps = {
  users?: User[];
  total?: number;
  disabled?: boolean;
  currUserId?: string;
  symbol?: string;
  payment: Record<string, number>;
  onChange: (value: string, userId: string) => void;
};

export const PaymentDrawer = (props: PaymentDrawerProps) => {
  const { pending } = useFormStatus();

  const {
    currUserId,
    disabled: disabledProp,
    users = [],
    total = 0,
    payment = {},
    symbol,
    onChange,
  } = props;

  const disabled = pending || disabledProp;

  const used = useMemo(() => {
    return fixedNum(
      Object.values(payment).reduce((sum, a) => sum + (isNaN(a) ? 0 : a), 0) ||
        0,
    );
  }, [payment]);

  const paidBy = useMemo(() => {
    const res = { text: "Someone", img: "" };

    const values = Object.entries(payment)
      .map(([key, value]) => ({
        key,
        value,
      }))
      .filter((a) => !!a.value);

    if (values.length === 1) {
      const u = users.find((u) => u.id === values[0]?.key);
      if (values[0]?.key === currUserId) {
        res.text = "You";
        res.img = u?.profile_image_url || res.img;
      } else {
        res.text = u?.firstName || u?.name || res.text;
        res.img = u?.profile_image_url || res.img;
      }
    } else {
      res.text = `${values.length} People`;
      res.img = "";
    }

    return res;
  }, [currUserId, payment, users]);

  const balance = fixedNum(total - used);
  const balanceText = balance >= 0 ? "left" : "over";

  return (
    <Drawer>
      <DrawerTrigger disabled={disabled}>
        <Button
          type="button"
          disabled={disabled}
          className="flex items-center gap-3"
          variant={"outline"}
        >
          {paidBy?.img ? (
            <div className="flex gap-2 items-center">
              <Image
                alt="profile"
                className="rounded-full"
                src={paidBy.img}
                width={24}
                height={24}
              />
              <div className="text-sm line-clamp-1">{paidBy.text}</div>
            </div>
          ) : (
            paidBy.text
          )}
          <div className="font-bold">Paid</div>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="px-4 flex gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <DrawerClose>
                <Button type="button" variant="outline" size="icon">
                  <ArrowLeftIcon />
                </Button>
              </DrawerClose>
              <div>Paid amount</div>
            </div>
          </DrawerTitle>
        </DrawerHeader>
        <div className="w-full pt-3 pb-6 px-8">
          <div className="flex flex-col gap-6 max-h-[calc(100vh-380px)] overflow-y-auto">
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
                        value={payment[d.id]}
                        onChange={(e) => onChange(d.id, e.target.value)}
                      />
                    </div>
                  </div>
                }
              />
            ))}
          </div>
          <div className="text-center text-xs font-semibold pt-6">
            <div>
              {symbol}
              {used} of {symbol}
              {total}
            </div>
            <div className={balance !== 0 ? "text-red-500" : ""}>
              {symbol}
              {Math.abs(balance)} {balanceText}
            </div>
          </div>
          <div className="flex items-center justify-end mt-6">
            <DrawerClose>
              <Button variant={"outline"}>Done</Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
