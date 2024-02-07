type ListItemProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
};

export const ListItem = (props: ListItemProps) => {
  const { title, subtitle, icon, actions } = props;
  return (
    <div className="flex justify-between items-center gap-4">
      <div className="flex items-center gap-4">
        {icon ? (
          <div className="w-10 h-10 flex items-center justify-center">
            {icon}
          </div>
        ) : null}
        <div className="flex items-center">
          <div className="flex flex-col">
            <div className="font-normal text-sm">{title}</div>
            {subtitle ? (
              <div className="text-xs font-light">{subtitle}</div>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
};
