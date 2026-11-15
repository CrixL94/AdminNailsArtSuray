import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { InputMask } from "primereact/inputmask";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { supabase } from "../../../supabaseClient";
import Loading from "../../../Components/Loader";
import { toastShow } from "../../../Services/ToastService";
import { estadoPromocion, fechaDesdeISO, fechaISO } from "../../../Services/Promociones";

const PENDIENTE = 3;
const CONTACTADO = 6;

const ESTADOS = [
  { label: "Contactado (ya confirmada)", value: CONTACTADO },
  { label: "Pendiente (por contactar)", value: PENDIENTE },
];

// Horarios cada 30 minutos, de 8:00 AM a 7:00 PM (igual que en el sitio)
const HORAS = Array.from({ length: 23 }, (_, i) => {
  const minutos = 8 * 60 + i * 30;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return {
    label: `${h12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`,
    value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
  };
});

const aMinutos = (hora24: string) => {
  const [h, m] = hora24.split(":").map(Number);
  return h * 60 + m;
};

const minutosAhora = () => {
  const ahora = new Date();
  return ahora.getHours() * 60 + ahora.getMinutes();
};

const esHoy = (fecha: Date | null) => !!fecha && fechaISO(fecha) === fechaISO(new Date());

// Si el día es hoy, solo quedan las horas que aún no han pasado
const horasParaFecha = (fecha: Date | null) =>
  esHoy(fecha) ? HORAS.filter((h) => aMinutos(h.value) > minutosAhora()) : HORAS;

// Primer día disponible: hoy, o mañana si ya no quedan horas hoy
const fechaMinima = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (horasParaFecha(new Date()).length === 0) d.setDate(d.getDate() + 1);
  return d;
};

type Form = {
  nombre: string;
  celular: string;
  iddetalleservicio: number | null;
  fecha: Date | null;
  hora: string;
  idestado: number;
  idpromocion: number | null;
};

// Desde la vista de semana o día del calendario también llega la hora
const horaDe = (fecha: Date | null) => {
  if (!fecha) return "";
  const valor = `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
  return HORAS.some((h) => h.value === valor) ? valor : "";
};

const soloDia = (fecha: Date | null) =>
  fecha ? new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) : null;

const formInicial = (fechaElegida: Date | null = null): Form => {
  const dia = soloDia(fechaElegida);
  const fecha = dia && dia >= fechaMinima() ? dia : null;
  const hora = fecha ? horaDe(fechaElegida) : "";
  return {
    nombre: "",
    celular: "",
    iddetalleservicio: null,
    fecha,
    hora: horasParaFecha(fecha).some((h) => h.value === hora) ? hora : "",
    idestado: CONTACTADO,
    idpromocion: null,
  };
};

const CitaCRUD = ({
  visible,
  onHide,
  fechaInicial = null,
  citas,
  getInfo,
}: {
  visible: boolean;
  onHide: () => void;
  /** Día elegido al tocar el calendario */
  fechaInicial?: Date | null;
  /** Citas existentes, para avisar si el horario ya está ocupado */
  citas: any[];
  getInfo: () => void;
}) => {
  const toast = useRef<Toast>(null!);
  const [form, setForm] = useState<Form>(formInicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [servicios, setServicios] = useState<any[]>([]);
  const [promociones, setPromociones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof Form>(campo: K, valor: Form[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: "" }));
  };

  const cambiarFecha = (fecha: Date | null) => {
    setForm((prev) => ({
      ...prev,
      fecha,
      hora: horasParaFecha(fecha).some((h) => h.value === prev.hora) ? prev.hora : "",
    }));
    setErrores((prev) => ({ ...prev, fecha: "", hora: "" }));
  };

  const cargarOpciones = async () => {
    const [{ data: dataServicios }, { data: dataPromos }] = await Promise.all([
      supabase
        .from("vta_detalles_servicios")
        .select("id, nombre, servicio_principal")
        .eq("id_estado", 1)
        .order("servicio_principal"),
      supabase
        .from("promociones")
        .select("id, titulo, etiqueta, fecha_inicio, fecha_fin, id_estado, servicios:servicios_detalles!promociones_servicios(id)")
        .order("fecha_fin"),
    ]);
    setServicios(dataServicios || []);
    // Solo las que hoy se ven en el sitio
    setPromociones((dataPromos || []).filter((p: any) => estadoPromocion(p) === "activa"));
  };

  useEffect(() => {
    if (!visible) return;
    setErrores({});
    setForm(formInicial(fechaInicial));
    cargarOpciones();
  }, [visible]);

  const promoElegida = promociones.find((p) => p.id === form.idpromocion);
  const serviciosPromo: number[] = promoElegida?.servicios?.map((s: any) => s.id) ?? [];

  // Con promoción, solo sus servicios (si tiene)
  const opcionesServicio = servicios
    .filter((s) => serviciosPromo.length === 0 || serviciosPromo.includes(s.id))
    .map((s) => ({ label: s.nombre, value: s.id }));

  const opcionesPromo = promociones.map((p) => ({
    label: p.etiqueta ? `${p.titulo} (${p.etiqueta})` : p.titulo,
    value: p.id,
  }));

  const elegirPromo = (id: number | null) => {
    const promo = promociones.find((p) => p.id === id);
    const permitidos: number[] = promo?.servicios?.map((s: any) => s.id) ?? [];
    setForm((prev) => ({
      ...prev,
      idpromocion: id,
      // Si el servicio elegido no entra en la promoción, se borra
      iddetalleservicio:
        permitidos.length && prev.iddetalleservicio && !permitidos.includes(prev.iddetalleservicio)
          ? null
          : prev.iddetalleservicio,
    }));
  };

  // Aviso (no bloquea): otra cita a la misma hora ese día
  const ocupada =
    form.fecha && form.hora
      ? citas.find(
          (c) => c.dia === fechaISO(form.fecha!) && String(c.hora).slice(0, 5) === form.hora
        )
      : null;

  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "Escribe el nombre";
    if (!form.celular || form.celular.includes("_")) e.celular = "Escribe el celular completo";
    if (!form.iddetalleservicio) e.iddetalleservicio = "Elige un servicio";
    if (!form.fecha) e.fecha = "Elige el día";
    else if (form.fecha < fechaMinima()) e.fecha = "Ese día ya pasó";
    if (!form.hora) e.hora = "Elige la hora";
    // La hora pudo pasar mientras el formulario estaba abierto
    else if (esHoy(form.fecha) && aMinutos(form.hora) <= minutosAhora())
      e.hora = "Esa hora ya pasó, elige otra";
    if (promoElegida && form.fecha && form.fecha > fechaDesdeISO(promoElegida.fecha_fin))
      e.fecha = "La promoción vence antes de ese día";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) {
      toastShow(toast, "error", "Revisa el formulario", "Hay campos por completar", 3000);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("citas").insert([
      {
        nombrecompleto: form.nombre.trim(),
        celular: form.celular,
        dia: fechaISO(form.fecha!),
        hora: form.hora,
        iddetalleservicio: form.iddetalleservicio,
        idestado: form.idestado,
        idpromocion: form.idpromocion,
      },
    ]);
    setLoading(false);

    if (error) {
      toastShow(
        toast,
        "error",
        "No se pudo crear la cita",
        error.message.includes("PROMOCION_NO_DISPONIBLE")
          ? "La promoción no aplica para ese servicio o día"
          : error.message,
        4000
      );
      return;
    }

    toastShow(toast, "success", "Cita creada", `${form.nombre.trim()} quedó agendada`, 3000);
    getInfo();
    onHide();
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Nueva cita"
        visible={visible}
        className="w-[94vw] max-w-2xl"
        blockScroll
        draggable={false}
        modal
        onHide={onHide}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onHide}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={guardar} disabled={loading}>
              <i className="pi pi-check" />
              Guardar cita
            </button>
          </div>
        }
      >
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-cream/80 backdrop-blur-sm">
              <Loading loading={loading} />
            </div>
          )}

          <form className="mt-4 space-y-5" onSubmit={(e) => e.preventDefault()}>
            {/* Clienta */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cita-nombre" className="field-label">
                  Nombre completo
                </label>
                <InputText
                  id="cita-nombre"
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Nombre y apellido"
                  className="w-full"
                  invalid={!!errores.nombre}
                />
                {errores.nombre && <small className="field-error">{errores.nombre}</small>}
              </div>
              <div>
                <label htmlFor="cita-celular" className="field-label">
                  Celular
                </label>
                <InputMask
                  id="cita-celular"
                  mask="+504 9999-9999"
                  placeholder="+504 9999-9999"
                  value={form.celular}
                  onChange={(e) => set("celular", e.target.value ?? "")}
                  className="w-full"
                  invalid={!!errores.celular}
                />
                {errores.celular && <small className="field-error">{errores.celular}</small>}
              </div>
            </div>

            {/* Promoción y servicio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cita-promo" className="field-label">
                  Promoción <span className="font-normal text-ink-400">(opcional)</span>
                </label>
                <Dropdown
                  inputId="cita-promo"
                  value={form.idpromocion}
                  options={opcionesPromo}
                  onChange={(e) => elegirPromo(e.value ?? null)}
                  placeholder={opcionesPromo.length ? "Sin promoción" : "No hay promociones vigentes"}
                  disabled={opcionesPromo.length === 0}
                  showClear
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="cita-servicio" className="field-label">
                  Servicio
                </label>
                <Dropdown
                  inputId="cita-servicio"
                  value={form.iddetalleservicio}
                  options={opcionesServicio}
                  onChange={(e) => set("iddetalleservicio", e.value)}
                  placeholder="Selecciona un servicio"
                  filter
                  filterPlaceholder="Buscar servicio"
                  emptyMessage="Cargando servicios…"
                  emptyFilterMessage="Sin resultados"
                  className="w-full"
                  invalid={!!errores.iddetalleservicio}
                />
                {errores.iddetalleservicio ? (
                  <small className="field-error">{errores.iddetalleservicio}</small>
                ) : (
                  serviciosPromo.length > 0 && (
                    <small className="mt-1 block text-xs text-ink-400">
                      Solo los servicios incluidos en la promoción.
                    </small>
                  )
                )}
              </div>
            </div>

            {/* Día, hora y estado */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="cita-fecha" className="field-label">
                  Día
                </label>
                <Calendar
                  inputId="cita-fecha"
                  value={form.fecha}
                  onChange={(e) => cambiarFecha((e.value as Date) ?? null)}
                  minDate={fechaMinima()}
                  dateFormat="dd/mm/yy"
                  locale="es"
                  showIcon
                  readOnlyInput
                  placeholder="Elige un día"
                  maxDate={promoElegida ? fechaDesdeISO(promoElegida.fecha_fin) : undefined}
                  className="w-full"
                  invalid={!!errores.fecha}
                />
                {errores.fecha && <small className="field-error">{errores.fecha}</small>}
              </div>
              <div>
                <label htmlFor="cita-hora" className="field-label">
                  Hora
                </label>
                <Dropdown
                  inputId="cita-hora"
                  value={form.hora}
                  options={horasParaFecha(form.fecha)}
                  onChange={(e) => set("hora", e.value)}
                  placeholder={form.fecha ? "Elige una hora" : "Elige primero el día"}
                  disabled={!form.fecha}
                  emptyMessage="No quedan horarios para este día"
                  scrollHeight="240px"
                  className="w-full"
                  invalid={!!errores.hora}
                />
                {errores.hora && <small className="field-error">{errores.hora}</small>}
              </div>
              <div>
                <label htmlFor="cita-estado" className="field-label">
                  Estado
                </label>
                <Dropdown
                  inputId="cita-estado"
                  value={form.idestado}
                  options={ESTADOS}
                  onChange={(e) => set("idestado", e.value)}
                  className="w-full"
                />
              </div>
            </div>

            {ocupada && (
              <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
                <i className="pi pi-exclamation-triangle mt-0.5" />
                <span>
                  Ya hay una cita a esa hora: <strong>{ocupada.nombrecompleto}</strong> ({ocupada.servicio}).
                  Puedes guardarla igual si atiendes a las dos.
                </span>
              </p>
            )}
          </form>
        </div>
      </Dialog>
    </>
  );
};

export default CitaCRUD;
