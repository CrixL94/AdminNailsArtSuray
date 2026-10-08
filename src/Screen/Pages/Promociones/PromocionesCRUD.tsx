import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { InputSwitch } from "primereact/inputswitch";
import { supabase } from "../../../supabaseClient";
import Loading from "../../../Components/Loader";
import { prepararImagen } from "../../../Services/Funciones";
import { toastShow } from "../../../Services/ToastService";
import {
  CARPETA_PROMOCIONES,
  fechaDesdeISO,
  fechaISO,
  formatearPrecio,
  urlImagenPromocion,
} from "../../../Services/Promociones";

const ETIQUETAS_SUGERIDAS = ["10% OFF", "20% OFF", "2x1", "Precio especial"];

type Form = {
  titulo: string;
  etiqueta: string;
  descripcion: string;
  servicios: number[];
  precio_promocion: number | null;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  activa: boolean;
};

const hoy = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formInicial = (): Form => ({
  titulo: "",
  etiqueta: "",
  descripcion: "",
  servicios: [],
  precio_promocion: null,
  fecha_inicio: hoy(),
  fecha_fin: null,
  activa: true,
});

const PromocionesCRUD = ({
  visible,
  onHide,
  editar = null,
  getInfo,
}: {
  visible: boolean;
  onHide: () => void;
  editar?: any;
  getInfo: () => void;
}) => {
  const toast = useRef<Toast>(null!);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editando = !!editar;

  const [form, setForm] = useState<Form>(formInicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [servicios, setServicios] = useState<any[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof Form>(campo: K, valor: Form[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: "" }));
  };

  const fetchServicios = async () => {
    const { data } = await supabase
      .from("vta_detalles_servicios")
      .select("id, nombre, precio, servicio_principal, id_estado")
      .order("servicio_principal");
    setServicios(data || []);
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  useEffect(() => {
    if (!visible) return;
    setErrores({});
    setArchivo(null);
    setQuitarImagen(false);
    setForm(
      editar
        ? {
            titulo: editar.titulo ?? "",
            etiqueta: editar.etiqueta ?? "",
            descripcion: editar.descripcion ?? "",
            servicios: (editar.servicios ?? []).map((s: any) => s.id),
            precio_promocion:
              editar.precio_promocion === null ? null : Number(editar.precio_promocion),
            fecha_inicio: fechaDesdeISO(editar.fecha_inicio),
            fecha_fin: fechaDesdeISO(editar.fecha_fin),
            activa: editar.id_estado === 1,
          }
        : formInicial()
    );
  }, [visible]);

  const previa = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo]);
  useEffect(() => () => {
    if (previa) URL.revokeObjectURL(previa);
  }, [previa]);

  const imagenActual = !quitarImagen ? urlImagenPromocion(editar?.imagen_url) : null;
  const imagenMostrada = previa ?? imagenActual;

  // Referencia de precio normal de los servicios elegidos
  const preciosElegidos = servicios
    .filter((s) => form.servicios.includes(s.id) && s.precio !== null)
    .map((s) => Number(s.precio));
  const precioNormal =
    preciosElegidos.length === 0
      ? ""
      : Math.min(...preciosElegidos) === Math.max(...preciosElegidos)
        ? `Precio normal: ${formatearPrecio(preciosElegidos[0])}`
        : `Precios normales: ${formatearPrecio(Math.min(...preciosElegidos))} – ${formatearPrecio(Math.max(...preciosElegidos))}`;

  const opcionesServicio = servicios.map((s) => ({
    label: s.id_estado === 1 ? s.nombre : `${s.nombre} (inactivo)`,
    value: s.id,
  }));

  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.titulo.trim()) e.titulo = "Escribe un título";
    if (!form.fecha_inicio) e.fecha_inicio = "Elige desde cuándo aplica";
    if (!form.fecha_fin) e.fecha_fin = "Elige la fecha de vencimiento";
    if (form.fecha_inicio && form.fecha_fin && form.fecha_fin < form.fecha_inicio)
      e.fecha_fin = "Debe ser igual o posterior a la fecha de inicio";
    if (!editando && form.fecha_fin && form.fecha_fin < hoy())
      e.fecha_fin = "La fecha de vencimiento ya pasó";
    if (form.precio_promocion !== null && form.precio_promocion < 0)
      e.precio_promocion = "El precio no puede ser negativo";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) {
      toastShow(toast, "error", "Revisa el formulario", "Hay campos por completar", 3000);
      return;
    }

    setLoading(true);
    try {
      let imagen_url: string | null = quitarImagen ? null : editar?.imagen_url ?? null;
      const anterior: string | null = editar?.imagen_url ?? null;

      if (archivo) {
        const { archivo: listo, nombre } = await prepararImagen(archivo);
        const { error: uploadError } = await supabase.storage
          .from("imagenes")
          .upload(`${CARPETA_PROMOCIONES}/${nombre}`, listo, {
            cacheControl: "31536000",
            upsert: false,
          });
        if (uploadError) {
          toastShow(toast, "error", "Error al subir la imagen", uploadError.message, 4000);
          setLoading(false);
          return;
        }
        imagen_url = nombre;
      }

      const datos = {
        titulo: form.titulo.trim(),
        etiqueta: form.etiqueta.trim() || null,
        descripcion: form.descripcion.trim() || null,
        precio_promocion: form.precio_promocion,
        fecha_inicio: fechaISO(form.fecha_inicio!),
        fecha_fin: fechaISO(form.fecha_fin!),
        id_estado: form.activa ? 1 : 2,
        imagen_url,
      };

      const { data: guardada, error } = editando
        ? await supabase.from("promociones").update(datos).eq("id", editar.id).select("id").single()
        : await supabase.from("promociones").insert([datos]).select("id").single();

      if (error || !guardada) {
        toastShow(toast, "error", editando ? "Error al actualizar" : "Error al crear", error?.message ?? "", 4000);
        setLoading(false);
        return;
      }

      // Servicios incluidos: se reemplazan por los elegidos
      const { error: borrarError } = await supabase
        .from("promociones_servicios")
        .delete()
        .eq("idpromocion", guardada.id);
      const { error: serviciosError } = borrarError
        ? { error: borrarError }
        : form.servicios.length
          ? await supabase.from("promociones_servicios").insert(
              form.servicios.map((iddetalleservicio) => ({ idpromocion: guardada.id, iddetalleservicio }))
            )
          : { error: null };

      if (serviciosError) {
        toastShow(toast, "warn", "Promoción guardada sin servicios", serviciosError.message, 5000);
        setLoading(false);
        getInfo();
        return;
      }

      // La imagen anterior ya no se usa
      if (anterior && anterior !== imagen_url) {
        await supabase.storage.from("imagenes").remove([`${CARPETA_PROMOCIONES}/${anterior}`]);
      }

      toastShow(
        toast,
        "success",
        editando ? "Promoción actualizada" : "Promoción creada",
        form.activa ? "Se mostrará en el sitio mientras esté vigente" : "Quedó guardada como inactiva",
        3000
      );
      setLoading(false);
      setTimeout(() => {
        getInfo();
        onHide();
      }, 800);
    } catch (err: any) {
      toastShow(toast, "error", "Error inesperado", err.message, 4000);
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={editando ? "Editar promoción" : "Nueva promoción"}
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
              {editando ? "Actualizar" : "Guardar"}
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
            {/* Título y etiqueta */}
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <div>
                <label htmlFor="titulo" className="field-label">
                  Título
                </label>
                <InputText
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => set("titulo", e.target.value)}
                  placeholder="Ej.: Octubre rosa"
                  className="w-full"
                  invalid={!!errores.titulo}
                />
                {errores.titulo && <small className="field-error">{errores.titulo}</small>}
              </div>
              <div>
                <label htmlFor="etiqueta" className="field-label">
                  Etiqueta <span className="font-normal text-ink-400">(opcional)</span>
                </label>
                <InputText
                  id="etiqueta"
                  value={form.etiqueta}
                  onChange={(e) => set("etiqueta", e.target.value)}
                  placeholder="20% OFF"
                  maxLength={20}
                  className="w-full"
                />
              </div>
            </div>
            <div className="-mt-2 flex flex-wrap gap-2">
              {ETIQUETAS_SUGERIDAS.map((et) => (
                <button
                  key={et}
                  type="button"
                  onClick={() => set("etiqueta", et)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs ring-1 transition ${
                    form.etiqueta === et
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-ink-600 ring-brand-200 hover:ring-brand-400"
                  }`}
                >
                  {et}
                </button>
              ))}
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="field-label">
                Descripción <span className="font-normal text-ink-400">(opcional)</span>
              </label>
              <InputTextarea
                id="descripcion"
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                rows={3}
                autoResize
                placeholder="Qué incluye, condiciones, etc."
                className="w-full"
              />
            </div>

            {/* Servicios y precio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="servicio" className="field-label">
                  Servicios <span className="font-normal text-ink-400">(opcional)</span>
                </label>
                <MultiSelect
                  inputId="servicio"
                  value={form.servicios}
                  options={opcionesServicio}
                  onChange={(e) => set("servicios", e.value ?? [])}
                  placeholder="Cualquier servicio"
                  display="chip"
                  filter
                  filterPlaceholder="Buscar servicio"
                  showClear
                  emptyMessage="Sin servicios"
                  emptyFilterMessage="Sin resultados"
                  className="w-full"
                />
                <small className="mt-1 block text-xs text-ink-400">
                  La clienta elige entre estos al agendar. Vacío: aplica a todos.
                </small>
              </div>
              <div>
                <label htmlFor="precio" className="field-label">
                  Precio de promoción <span className="font-normal text-ink-400">(opcional)</span>
                </label>
                {/* "L." va fuera del valor: como prefijo, su punto se confunde con el decimal */}
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-ink-500">
                    L.
                  </span>
                  <InputNumber
                    inputId="precio"
                    value={form.precio_promocion}
                    onValueChange={(e) => set("precio_promocion", e.value ?? null)}
                    min={0}
                    minFractionDigits={0}
                    maxFractionDigits={2}
                    placeholder="0"
                    className="w-full"
                    inputClassName="w-full"
                    inputStyle={{ paddingLeft: "2.5rem" }}
                    invalid={!!errores.precio_promocion}
                  />
                </div>
                {errores.precio_promocion ? (
                  <small className="field-error">{errores.precio_promocion}</small>
                ) : (
                  precioNormal && (
                    <small className="mt-1 block text-xs text-ink-400">{precioNormal}</small>
                  )
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fecha_inicio" className="field-label">
                  Desde
                </label>
                <Calendar
                  inputId="fecha_inicio"
                  value={form.fecha_inicio}
                  onChange={(e) => set("fecha_inicio", (e.value as Date) ?? null)}
                  dateFormat="dd/mm/yy"
                  locale="es"
                  showIcon
                  readOnlyInput
                  className="w-full"
                  invalid={!!errores.fecha_inicio}
                />
                {errores.fecha_inicio && <small className="field-error">{errores.fecha_inicio}</small>}
              </div>
              <div>
                <label htmlFor="fecha_fin" className="field-label">
                  Vence el
                </label>
                <Calendar
                  inputId="fecha_fin"
                  value={form.fecha_fin}
                  onChange={(e) => set("fecha_fin", (e.value as Date) ?? null)}
                  dateFormat="dd/mm/yy"
                  locale="es"
                  showIcon
                  readOnlyInput
                  minDate={form.fecha_inicio ?? undefined}
                  placeholder="Último día válido"
                  className="w-full"
                  invalid={!!errores.fecha_fin}
                />
                {errores.fecha_fin ? (
                  <small className="field-error">{errores.fecha_fin}</small>
                ) : (
                  <small className="mt-1 block text-xs text-ink-400">
                    Las citas con esta promoción deben ser hasta este día.
                  </small>
                )}
              </div>
            </div>

            {/* Imagen */}
            <div>
              <span className="field-label">
                Imagen <span className="font-normal text-ink-400">(opcional)</span>
              </span>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setArchivo(file);
                    setQuitarImagen(false);
                  }
                  e.target.value = "";
                }}
              />
              {imagenMostrada ? (
                <div className="relative mt-1">
                  <img
                    src={imagenMostrada}
                    alt="Imagen de la promoción"
                    onClick={() => fileInputRef.current?.click()}
                    className="max-h-64 w-full cursor-pointer rounded-2xl object-cover ring-1 ring-brand-100 transition hover:opacity-90"
                  />
                  <button
                    type="button"
                    aria-label="Quitar imagen"
                    title="Quitar imagen"
                    onClick={() => {
                      setArchivo(null);
                      setQuitarImagen(true);
                    }}
                    className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-red-600 shadow-soft transition hover:bg-white"
                  >
                    <i className="pi pi-trash" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-200 bg-white text-brand-400 transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <i className="pi pi-image text-3xl" />
                  <span className="text-sm">Sin imagen se muestra la etiqueta en grande</span>
                </button>
              )}
            </div>

            {/* Activa */}
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
              <span>
                <span className="block text-sm font-medium text-ink-800">Mostrar en el sitio</span>
                <span className="block text-xs text-ink-500">
                  Solo se ve entre la fecha de inicio y la de vencimiento.
                </span>
              </span>
              <InputSwitch checked={form.activa} onChange={(e) => set("activa", !!e.value)} />
            </label>
          </form>
        </div>
      </Dialog>
    </>
  );
};

export default PromocionesCRUD;
