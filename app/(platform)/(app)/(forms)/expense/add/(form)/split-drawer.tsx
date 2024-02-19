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
import { ExpenseType, User } from "@prisma/client";
import { ArrowLeftIcon } from "lucide-react";
import { SplitDrawerProps } from "./split-drawer.types";
import dynamic from "next/dynamic";
import { UISpinner } from "@/components/ui-spinner";

const EqualSplit = dynamic(() => import("./_splits/equal"), {
  loading: () => <UISpinner />,
});

const ExactSplit = dynamic(() => import("./_splits/exact"), {
  loading: () => <UISpinner />,
});

export const SplitDrawer = (props: SplitDrawerProps) => {
  const { splitType, disabled, onSplitTypeChange } = props;

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
            {/* <SplitUsers {...props} /> */}
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};
