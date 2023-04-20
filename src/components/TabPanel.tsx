/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

interface TabPanelProps<T> {
  children?: React.ReactNode;
  index: T;
  value: T;
  className?: string;
}

export default function TabPanel<T = number>(props: TabPanelProps<T>) {
  const { children, value, index, ...other } = props;

  return (
    <div hidden={value !== index} {...other}>
      {children}
    </div>
  );
}
