import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseType } from "@prisma/client";
import { ArrowLeftIcon } from "lucide-react";
import { SplitDrawerProps } from "./split-drawer.types";
import dynamic from "next/dynamic";
import { EqualLoader } from "./_splits/equal-loader";
import { ExactLoader } from "./_splits/exact-loader";
import { useFormStatus } from "react-dom";

const EqualSplit = dynamic(() => import("./_splits/equal"), {
  loading: () => <EqualLoader />,
});

const ExactSplit = dynamic(() => import("./_splits/exact"), {
  loading: () => <ExactLoader />,
});

const PercentSplit = dynamic(() => import("./_splits/percent"), {
  loading: () => <ExactLoader />,
});

export const SplitDrawer = (props: SplitDrawerProps) => {
  const { splitType, disabled: disabledProp, onSplitTypeChange } = props;
  const { pending } = useFormStatus();

  const disabled = pending || disabledProp;

  const splitName =
    splitType === "EXACT"
      ? "Exactly"
      : splitType === "PERCENT"
        ? "By Percentage"
        : "Equally";

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
          <div>{splitName}</div>
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
            <ExactSplit {...props} />
          </TabsContent>
          <TabsContent value={ExpenseType.PERCENT}>
            <PercentSplit {...props} />
          </TabsContent>
          <div className="flex items-center justify-end">
            <DrawerClose>
              <Button variant={"outline"}>Done</Button>
            </DrawerClose>
          </div>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};
