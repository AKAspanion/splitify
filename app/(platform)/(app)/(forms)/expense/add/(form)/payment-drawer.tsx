import { Button } from "@/components/ui/button";
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

export const PaymentDrawer = () => {
  return (
    <Drawer>
      <DrawerTrigger>
        <Button type="button" variant={"outline"}>
          you
        </Button>
        {"  "}paid
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="px-4">Paid amount</DrawerTitle>
        </DrawerHeader>
        <div className="w-full pt-3 pb-6 px-8">hey</div>
        {/* <DrawerFooter>
          <DrawerClose>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
};
