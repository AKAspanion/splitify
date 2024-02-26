type NoDataProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
};

export const NoData = (props: NoDataProps) => {
  const { title, subtitle, action } = props;
  return (
    <div className="flex flex-col gap-4 justify-center items-center py-24 px-12 text-center">
      <div className="flex flex-col gap-1 justify-center items-center text-center">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle ? (
          <div className="text-sm font-normal">{subtitle}</div>
        ) : null}
      </div>
      {action}
    </div>
  );
};
