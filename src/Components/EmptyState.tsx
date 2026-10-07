import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  text?: string;
  action?: ReactNode;
}

// Mensaje cuando una lista no tiene registros
const EmptyState = ({ icon = "pi pi-inbox", title, text, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
      <i className={`${icon} text-xl`} />
    </span>
    <h3 className="heading-md">{title}</h3>
    {text && <p className="mt-1 max-w-sm text-sm text-ink-500">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
