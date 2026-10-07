import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Botones a la derecha del título */
  actions?: ReactNode;
  /** Contenido extra bajo el título (filtros, etc.) */
  children?: ReactNode;
}

// Encabezado común de las pantallas del panel
const PageHeader = ({ eyebrow, title, subtitle, actions, children }: PageHeaderProps) => (
  <header className="mb-6 sm:mb-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="heading-xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink-500 sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children && <div className="mt-5">{children}</div>}
  </header>
);

export default PageHeader;
