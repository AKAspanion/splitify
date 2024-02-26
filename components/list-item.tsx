import { cn } from "@/lib/utils";

type ListItemProps = {
  title: string;
  disabled?: boolean;
  subtitle?: string;
  prefix?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
};

export const ListItem = (props: ListItemProps) => {
  const { title, subtitle, disabled, prefix, icon, actions } = props;
  return (
    <div
      className={cn("flex justify-between items-center gap-4", {
        "opacity-65": disabled,
      })}
    >
      <div className="flex items-center gap-4">
        {prefix}
        {icon ? (
          <div className="w-10 h-10 flex items-center justify-center">
            {icon}
          </div>
        ) : null}
        <div className="flex items-center">
          <div className="flex flex-col">
            <div className="font-normal text-sm truncate">{title}</div>
            {subtitle ? (
              <div className="text-xs font-light truncate">{subtitle}</div>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? actions : null}
    </div>
  );
};
