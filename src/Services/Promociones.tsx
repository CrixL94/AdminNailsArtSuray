import { obtenerUrlPublica } from "./Funciones";

export const CARPETA_PROMOCIONES = "Promociones";

// Fecha local en formato YYYY-MM-DD (toISOString usa UTC y puede cambiar el día)
export const fechaISO = (fecha: Date) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// "2026-10-07" -> Date local (sin desfase de zona horaria)
export const fechaDesdeISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatearFechaCorta = (iso: string) =>
  fechaDesdeISO(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export type EstadoPromocion = "activa" | "programada" | "vencida" | "inactiva";

// Lo que ve la clienta en la landing depende del estado y de las fechas
export const estadoPromocion = (promo: any): EstadoPromocion => {
  const hoy = fechaISO(new Date());
  if (promo.id_estado !== 1) return "inactiva";
  if (promo.fecha_fin < hoy) return "vencida";
  if (promo.fecha_inicio > hoy) return "programada";
  return "activa";
};

export const ESTADOS_PROMOCION: Record<
  EstadoPromocion,
  { label: string; color: string; ayuda: string }
> = {
  activa: { label: "Visible", color: "#4CAF50", ayuda: "Se muestra en el sitio" },
  programada: { label: "Programada", color: "#c9a36b", ayuda: "Se mostrará desde su fecha de inicio" },
  vencida: { label: "Vencida", color: "#a08d86", ayuda: "Ya pasó su fecha de vencimiento" },
  inactiva: { label: "Desactivada", color: "#F44336", ayuda: "No se muestra en el sitio" },
};

// Días que faltan para el vencimiento (0 = vence hoy)
export const diasParaVencer = (fechaFin: string) => {
  const hoy = fechaDesdeISO(fechaISO(new Date()));
  return Math.round((fechaDesdeISO(fechaFin).getTime() - hoy.getTime()) / 86_400_000);
};

export const urlImagenPromocion = (nombre?: string | null) =>
  nombre ? obtenerUrlPublica("imagenes", `${CARPETA_PROMOCIONES}/${nombre}`) : null;

export const formatearPrecio = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined || valor === ""
    ? ""
    : `L. ${Number(valor).toLocaleString("es-HN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
