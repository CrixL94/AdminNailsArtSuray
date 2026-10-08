import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { InputSwitch } from "primereact/inputswitch";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { supabase } from "../../../supabaseClient";
import Loading from "../../../Components/Loader";
import PageHeader from "../../../Components/PageHeader";
import EmptyState from "../../../Components/EmptyState";
import EstadoBadge from "../../../Components/EstadoBadge";
import { toastShow } from "../../../Services/ToastService";
import {
  CARPETA_PROMOCIONES,
  ESTADOS_PROMOCION,
  diasParaVencer,
  estadoPromocion,
  formatearFechaCorta,
  formatearPrecio,
  urlImagenPromocion,
} from "../../../Services/Promociones";
import PromocionesCRUD from "./PromocionesCRUD";

// Las visibles primero, luego las programadas, desactivadas y vencidas
const ORDEN = { activa: 0, programada: 1, inactiva: 2, vencida: 3 };

const textoVencimiento = (promo: any) => {
  const dias = diasParaVencer(promo.fecha_fin);
  if (dias < 0) return `Venció el ${formatearFechaCorta(promo.fecha_fin)}`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `Vence en ${dias} días · ${formatearFechaCorta(promo.fecha_fin)}`;
};

const PromocionesScreen = () => {
  const toast = useRef<Toast>(null!);
  const menuRef = useRef<Menu[]>([]);

  const [promociones, setPromociones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editar, setEditar] = useState<any>(null);
  const [cambiando, setCambiando] = useState<number | null>(null);

  const getInfo = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promociones")
      // Servicios incluidos, a través de la tabla promociones_servicios
      .select("*, servicios:servicios_detalles!promociones_servicios(id, nombre, precio)")
      .order("fecha_fin", { ascending: true });

    if (error) {
      toastShow(toast, "error", "Error", "No se pudieron cargar las promociones", 3000);
      setPromociones([]);
    } else {
      setPromociones(
        (data || []).sort(
          (a, b) => ORDEN[estadoPromocion(a)] - ORDEN[estadoPromocion(b)]
        )
      );
    }
    setLoading(false);
  };

  const abrirDialog = (promo?: any) => {
    setEditar(promo ?? null);
    setDialogVisible(true);
  };

  const cambiarActiva = async (promo: any, activa: boolean) => {
    setCambiando(promo.id);
    const id_estado = activa ? 1 : 2;
    const { error } = await supabase
      .from("promociones")
      .update({ id_estado })
      .eq("id", promo.id);
    setCambiando(null);

    if (error) {
      toastShow(toast, "error", "Error", "No se pudo cambiar el estado", 3000);
      return;
    }
    setPromociones((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, id_estado } : p))
    );
    toastShow(
      toast,
      activa ? "success" : "warn",
      activa ? "Promoción activada" : "Promoción desactivada",
      activa ? "Se mostrará en el sitio mientras esté vigente" : "Ya no se muestra en el sitio",
      2500
    );
  };

  const eliminarPromocion = (promo: any) => {
    confirmDialog({
      message: `¿Deseas eliminar la promoción "${promo.titulo}"? Las citas ya agendadas se conservan, pero sin la promoción. Si solo quieres ocultarla, desactívala.`,
      header: "Eliminar promoción",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        const { error } = await supabase.from("promociones").delete().eq("id", promo.id);
        if (error) {
          toastShow(toast, "error", "Error", "No se pudo eliminar la promoción", 3000);
          return;
        }
        if (promo.imagen_url) {
          await supabase.storage
            .from("imagenes")
            .remove([`${CARPETA_PROMOCIONES}/${promo.imagen_url}`]);
        }
        toastShow(toast, "warn", "Promoción eliminada", `${promo.titulo} se eliminó`, 3000);
        getInfo();
      },
    });
  };

  const getActionItems = (promo: any) => [
    { label: "Editar", icon: "pi pi-pencil", command: () => abrirDialog(promo) },
    { label: "Eliminar", icon: "pi pi-trash", command: () => eliminarPromocion(promo) },
  ];

  useEffect(() => {
    getInfo();
  }, []);

  const visibles = promociones.filter((p) => estadoPromocion(p) === "activa").length;

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <PageHeader
        eyebrow="Sitio web"
        title="Promociones"
        subtitle={
          promociones.length === 0
            ? "Descuentos que aparecen en una ventana al abrir el sitio."
            : `${visibles} ${visibles === 1 ? "visible" : "visibles"} en el sitio ahora · ${promociones.length} en total`
        }
        actions={
          <>
            <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={() => getInfo()}>
              <i className="pi pi-sync" />
            </button>
            <button type="button" className="btn-primary" onClick={() => abrirDialog()}>
              <i className="pi pi-plus" />
              Nueva promoción
            </button>
          </>
        }
      />

      {loading ? (
        <div className="card-soft">
          <Loading loading={loading} />
        </div>
      ) : promociones.length === 0 ? (
        <div className="card-soft">
          <EmptyState
            icon="pi pi-tag"
            title="Sin promociones"
            text="Crea una promoción con fecha de vencimiento y se mostrará al abrir el sitio."
            action={
              <button type="button" className="btn-primary" onClick={() => abrirDialog()}>
                <i className="pi pi-plus" />
                Nueva promoción
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {promociones.map((promo, index) => {
            const estado = estadoPromocion(promo);
            const info = ESTADOS_PROMOCION[estado];
            const imagen = urlImagenPromocion(promo.imagen_url);
            const vencida = estado === "vencida";

            return (
              <article
                key={promo.id}
                className={`card-soft flex flex-col overflow-hidden ${vencida ? "opacity-70" : ""}`}
              >
                <div className="relative aspect-[16/9] bg-gradient-to-br from-brand-100 via-brand-50 to-sand">
                  {imagen ? (
                    <img src={imagen} alt={promo.titulo} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center">
                      <span className="font-display text-4xl font-semibold text-brand-600 [font-variant-numeric:lining-nums]">
                        {promo.etiqueta || promo.titulo}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                    <span title={info.ayuda}>
                      <EstadoBadge nombre={info.label} color={info.color} />
                    </span>
                    <button
                      type="button"
                      aria-label="Acciones"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-soft transition hover:bg-white"
                      onClick={(e) => menuRef.current[index]?.toggle(e)}
                    >
                      <i className="pi pi-ellipsis-v" />
                    </button>
                    <Menu
                      model={getActionItems(promo)}
                      popup
                      ref={(el) => {
                        menuRef.current[index] = el!;
                      }}
                    />
                  </div>
                  {imagen && promo.etiqueta && (
                    <span className="absolute bottom-3 left-3 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-soft">
                      {promo.etiqueta}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="heading-md">{promo.titulo}</h2>
                  {promo.descripcion && (
                    <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line text-ink-500">
                      {promo.descripcion}
                    </p>
                  )}

                  <dl className="mt-4 grid flex-1 grid-cols-2 content-start gap-3">
                    <div className="col-span-2">
                      <dt className="dato-label">
                        {promo.servicios?.length > 1 ? "Servicios" : "Servicio"}
                      </dt>
                      <dd className="dato-valor">
                        {promo.servicios?.length ? (
                          <ul className="mt-1 flex flex-wrap gap-1.5">
                            {promo.servicios.map((s: any) => (
                              <li key={s.id} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-ink-700 ring-1 ring-brand-100">
                                {s.nombre}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "Cualquier servicio"
                        )}
                      </dd>
                    </div>
                    {promo.precio_promocion !== null && (
                      <div className="col-span-2">
                        <dt className="dato-label">Precio de promoción</dt>
                        <dd className="dato-valor">
                          <span className="font-medium text-brand-700">
                            {formatearPrecio(promo.precio_promocion)}
                          </span>
                          {promo.servicios?.length === 1 && promo.servicios[0].precio && (
                            <span className="ml-2 text-ink-400 line-through">
                              {formatearPrecio(promo.servicios[0].precio)}
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="dato-label">Desde</dt>
                      <dd className="dato-valor">{formatearFechaCorta(promo.fecha_inicio)}</dd>
                    </div>
                    <div>
                      <dt className="dato-label">Hasta</dt>
                      <dd className="dato-valor">{formatearFechaCorta(promo.fecha_fin)}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-brand-100 pt-4">
                    <p className={`text-xs ${vencida ? "text-ink-400" : diasParaVencer(promo.fecha_fin) <= 3 ? "font-medium text-amber-700" : "text-ink-500"}`}>
                      <i className="pi pi-clock mr-1.5 text-[0.7rem]" />
                      {textoVencimiento(promo)}
                    </p>
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-ink-600">
                      {promo.id_estado === 1 ? "Activa" : "Inactiva"}
                      <InputSwitch
                        checked={promo.id_estado === 1}
                        disabled={cambiando === promo.id}
                        onChange={(e) => cambiarActiva(promo, !!e.value)}
                        aria-label="Activar o desactivar"
                      />
                    </label>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PromocionesCRUD
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        editar={editar}
        getInfo={getInfo}
      />
    </>
  );
};

export default PromocionesScreen;
