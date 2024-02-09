import { cn } from "@/lib/utils";

type AutoContainerProps = {
  header?: React.ReactNode;
  children: React.ReactNode;
};

export const AutoContainer = ({ header, children }: AutoContainerProps) => {
  return (
    <>
      {header ? (
        <div className="py-6 px-8 h-[88px] w-full flex items-center">
          {header}
        </div>
      ) : null}
      <div
        className={cn(
          "pb-8 px-8 h-[calc(100vh-73px)] sm:h-[calc(100vh-64px)] overflow-y-auto",
          header
            ? "h-[calc(100vh-88px-73px)] sm:h-[calc(100vh-88px-64px)] overflow-y-auto"
            : "pt-6",
        )}
      >
        {children}
      </div>
    </>
  );
};
