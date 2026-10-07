interface EstadoBadgeProps {
  nombre: string;
  /** Color del estado (columna ColorFondo de la tabla Estados) */
  color?: string;
  /** Si se pasa, la etiqueta es un botón para cambiar el estado */
  onClick?: () => void;
}

// Etiqueta de estado: punto de color + nombre
const EstadoBadge = ({ nombre, color = "#c8898e", onClick }: EstadoBadgeProps) => {
  const contenido = (
    <>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {nombre}
      {onClick && <i className="pi pi-chevron-down text-[0.6rem] text-ink-400" />}
    </>
  );
  const clases =
    "inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-700 ring-1 ring-brand-100";

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      title="Cambiar estado"
      className={`${clases} cursor-pointer transition hover:ring-brand-300`}
    >
      {contenido}
    </button>
  ) : (
    <span className={clases}>{contenido}</span>
  );
};

export default EstadoBadge;
