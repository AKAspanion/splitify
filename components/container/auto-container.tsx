import { cn } from "@/lib/utils";

type AutoContainerProps = {
  header?: React.ReactNode;
  children: React.ReactNode;
};

export const AutoContainer = ({ header, children }: AutoContainerProps) => {
  return (
    <div className="h-full">
      {header ? (
        <div className="py-6 px-8 h-[88px] w-full flex items-center">
          {header}
        </div>
      ) : null}
      <div
        className={cn(
          "pb-8 px-8 h-[calc(100%)] sm:h-[calc(100%)] overflow-y-auto",
          header ? "h-[calc(100%-88px)] sm:h-[calc(100%-88px)]" : "pt-6"
        )}
      >
        {children}
      </div>
    </div>
  );
};
