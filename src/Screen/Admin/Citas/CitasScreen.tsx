import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import Loading from "../../../Components/Loader";
import PageHeader from "../../../Components/PageHeader";
import EmptyState from "../../../Components/EmptyState";
import { supabase } from "../../../supabaseClient";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import {
  formatearDiaMesAno,
  formatearHoraAMPM,
  sumarUnaHora,
} from "../../../Services/Funciones";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { toastShow } from "../../../Services/ToastService";

const CitasScreen = () => {
  const toast = useRef<Toast>(null!);
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState<any[]>([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const getInfo = async () => {
    setLoading(true);

    const { data } = await supabase.from("vw_citas").select("*");
    setCitas(data || []);

    setLoading(false);
  };

  //Enviar mensaje por WhatsApp
  const contactarWhatsApp = async (info: any) => {
    if (!info?.celular) return;
    setLoading(true);
    await supabase
      .from("citas")
      .update({ idestado: 6 })
      .eq("idcita", info.idcita)
      .select();

    const numero = info.celular.replace(/\D/g, "");

    const horaFormateada = formatearHoraAMPM(info.hora);
    const fechaString = formatearDiaMesAno(info.dia);

    // Crea el mensaje de WhatsApp
    const mensaje = `*Hola ${info.nombrecompleto}!*

    Has reservado una cita en *Nail's Art Suray*

    *Día:* ${fechaString}
    *Hora:* ${horaFormateada}
    *Servicio:* ${info.servicio}

    ¡Estamos emocionadas por atenderte!
    Recuerda llegar 10 minutos antes para tu comodidad.

    Si necesitas reprogramar, no dudes en escribirme.
    ¡Te esperamos con mucho cariño!

    Saludos,  
    *Nail's Art Suray*`;

    const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

    const a = document.createElement("a");
    a.href = link;
    a.target = "_self";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const eliminarCita = (idcita: number) => {
    confirmDialog({
      message: "¿Estás seguro de que deseas eliminar esta cita?",
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      acceptClassName: "p-button-danger",
      accept: async () => {
        setLoading(true);
        await supabase.from("citas").delete().eq("idcita", idcita);
        toastShow(
          toast,
          "success",
          "Cita eliminada",
          "La cita se ha eliminado correctamente",
          3000
        );
        await getInfo();
        setDialogVisible(false);
        setLoading(false);
      },
    });
  };

  const formatearCitasParaCalendario = (citas: any[]) => {
    return citas.map((cita) => ({
      id: cita.idcita,
      title: cita.nombrecompleto,
      start: `${cita.dia}T${cita.hora}`,
      end: `${cita.dia}T${sumarUnaHora(cita.hora)}`,
      extendedProps: { ...cita },
    }));
  };

  //card en calendario
  const renderizarEventoPersonalizado = (arg: any) => {
    const { nombrecompleto, servicio, hora, Estado, idcita, idestado } =
      arg.event.extendedProps;
    const pendiente = idestado === 3;

    const container = document.createElement("div");
    container.className = `cita-evento ${pendiente ? "cita-pendiente" : ""}`;
    container.innerHTML = `
      <strong>${nombrecompleto}</strong>
      <span>${servicio}</span>
      <span>${formatearHoraAMPM(hora)} · ${Estado}</span>
      <button type="button" class="btn-eliminar-cita">Eliminar</button>
    `;

    setTimeout(() => {
      const boton = container.querySelector(".btn-eliminar-cita");
      if (boton) {
        boton.addEventListener("click", (e) => {
          e.stopPropagation();
          eliminarCita(idcita);
        });
      }
    });

    return { domNodes: [container] };
  };

  const onEventoClick = (clickInfo: any) => {
    setEventoSeleccionado(clickInfo.event.extendedProps);
    setDialogVisible(true);
  };

  useEffect(() => {
    getInfo();
  }, []);

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <PageHeader
        eyebrow="Agenda"
        title="Citas"
        subtitle="Reservas hechas desde el sitio web."
        actions={
          <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={getInfo}>
            <i className="pi pi-sync" />
          </button>
        }
      />

      {loading ? (
        <div className="card-soft">
          <Loading loading={loading} />
        </div>
      ) : (
        <>
          {/* Calendario para sm+ */}
          <div className="card-soft hidden p-4 sm:block sm:p-6">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locales={[esLocale]}
              locale="es"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={formatearCitasParaCalendario(citas)}
              height="auto"
              nowIndicator={true}
              eventContent={renderizarEventoPersonalizado}
              eventClick={onEventoClick}
            />
          </div>

          {/* Tarjetas para móviles */}
          <div className="flex flex-col gap-3 sm:hidden">
            {citas.length === 0 && (
              <div className="card-soft">
                <EmptyState icon="pi pi-calendar" title="Sin citas" text="Aún no hay reservas." />
              </div>
            )}
            {citas.map((info) => (
              <article key={info.idcita} className="card-soft p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-ink-900">{info.nombrecompleto}</h3>
                    <p className="text-sm text-ink-500">{info.servicio}</p>
                  </div>
                  <EstadoChip estado={info.Estado} idestado={info.idestado} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="dato-label">Día</dt>
                    <dd className="dato-valor">{formatearDiaMesAno(info.dia)}</dd>
                  </div>
                  <div>
                    <dt className="dato-label">Hora</dt>
                    <dd className="dato-valor">{formatearHoraAMPM(info.hora)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="dato-label">Celular</dt>
                    <dd className="dato-valor">{info.celular}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-end">
                  {info?.idestado === 6 ? (
                    <button type="button" className="btn-ghost px-4 py-2 text-red-600" onClick={() => eliminarCita(info.idcita)}>
                      <i className="pi pi-trash" />
                      Eliminar
                    </button>
                  ) : (
                    <button type="button" className="btn-primary px-4 py-2" onClick={() => contactarWhatsApp(info)}>
                      <i className="pi pi-whatsapp" />
                      Contactar por WhatsApp
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Dialog con detalles de la cita */}
      <Dialog
        header="Detalle de la cita"
        visible={dialogVisible}
        className="w-[94vw] max-w-lg"
        blockScroll
        draggable={false}
        onHide={() => setDialogVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDialogVisible(false)} className="btn-ghost">
              Cerrar
            </button>
            {eventoSeleccionado?.idestado === 6 ? (
              <button type="button" onClick={() => eliminarCita(eventoSeleccionado.idcita)} className="btn-danger">
                <i className="pi pi-trash" />
                Eliminar
              </button>
            ) : (
              <button type="button" onClick={() => contactarWhatsApp(eventoSeleccionado)} className="btn-primary">
                <i className="pi pi-whatsapp" />
                Contactar por WhatsApp
              </button>
            )}
          </div>
        }
      >
        {eventoSeleccionado && (
          <div className="card-soft p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-2xl text-ink-900">{eventoSeleccionado.nombrecompleto}</h3>
                <p className="text-sm text-ink-500">{eventoSeleccionado.servicio}</p>
              </div>
              <EstadoChip estado={eventoSeleccionado.Estado} idestado={eventoSeleccionado.idestado} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <dt className="dato-label">Día</dt>
                <dd className="dato-valor">{formatearDiaMesAno(eventoSeleccionado.dia)}</dd>
              </div>
              <div>
                <dt className="dato-label">Hora</dt>
                <dd className="dato-valor">{formatearHoraAMPM(eventoSeleccionado.hora)}</dd>
              </div>
              <div>
                <dt className="dato-label">Celular</dt>
                <dd className="dato-valor">{eventoSeleccionado.celular}</dd>
              </div>
              <div>
                <dt className="dato-label">Categoría</dt>
                <dd className="dato-valor">{eventoSeleccionado.Categoria}</dd>
              </div>
            </dl>
          </div>
        )}
      </Dialog>
    </>
  );
};

// Etiqueta de estado: pendiente en ámbar, el resto en verde
const EstadoChip = ({ estado, idestado }: { estado: string; idestado: number }) => (
  <span
    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
      idestado === 3
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
        : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    }`}
  >
    {estado}
  </span>
);

export default CitasScreen;
