import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import Loading from "../../../Components/Loader";
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
import { Badge } from "primereact/badge";
import { Card } from "primereact/card";
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
      backgroundColor: "#8B5CF6",
      borderColor: "#6B46C1",
      textColor: "#ffffff",
      extendedProps: { ...cita },
    }));
  };

  //card en calendario
  const renderizarEventoPersonalizado = (arg: any) => {
    const { nombrecompleto, servicio, hora, Estado, idcita } =
      arg.event.extendedProps;

    const container = document.createElement("div");
    container.style.backgroundColor = "#8B5CF6";
    container.style.color = "white";
    container.style.padding = "6px 10px";
    container.style.borderRadius = "8px";
    container.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
    container.style.fontSize = "0.85rem";
    container.style.width = "100%";
    container.style.display = "block"; // Asegura que ocupe todo el espacio disponible
    container.style.boxSizing = "border-box"; // Evita desbordamiento

    container.innerHTML = `
    <strong>${nombrecompleto}</strong><br />
    <span style="font-size: 0.75rem;">${servicio}</span><br />
    <span style="font-size: 0.75rem;">${formatearHoraAMPM(hora)}</span><br />
    <span style="font-size: 0.75rem;">${Estado}</span><br />
    <button class="btn-eliminar-cita" style="
      margin-top: 4px;
      background: #EF4444;
      color: white;
      border: none;
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.7rem;
      width: 100%;
      margin-top: 6px;
    ">Eliminar</button>
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
    <div className="flex h-screen overflow-hidden">
      <Toast ref={toast} />
      <ConfirmDialog />
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">
            Calendario de Citas
          </h1>
          <Button
            icon="pi pi-sync"
            rounded
            aria-label="Actualizar"
            onClick={getInfo}
          />
        </div>

        <div className="sm:bg-white sm:rounded sm:shadow sm:p-4 h-[52rem] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-[40rem]">
              <Loading loading={loading} />
            </div>
          ) : (
            <>
              {/* Calendario para sm+ */}
              <div className="hidden sm:block">
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
              <div className="sm:hidden">
                <div className="flex flex-col gap-4 h-[85vh] overflow-y-auto">
                  {citas.map((info) => (
                    <div key={info.idcita} className="relative">
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <Badge
                          value={info.Estado}
                          className="text-white text-xs"
                          style={{
                            backgroundColor: info.ColorFondo || "#8B5CF6",
                            color: "black",
                          }}
                        />
                      </div>
                      <Card>
                        <div className="text-sm text-gray-700 space-y-1 mt-3">
                          <p>
                            <span className="font-semibold">Nombre:</span>{" "}
                            {info.nombrecompleto}
                          </p>
                          <p>
                            <span className="font-semibold">Celular:</span>{" "}
                            {info.celular}
                          </p>
                          <p>
                            <span className="font-semibold">Servicio:</span>{" "}
                            {info.servicio}
                          </p>
                          <p>
                            <span className="font-semibold">Día:</span>{" "}
                            {formatearDiaMesAno(info.dia)}
                          </p>
                          <p>
                            <span className="font-semibold">Hora:</span>{" "}
                            {formatearHoraAMPM(info.hora)}
                          </p>

                          <div className="flex justify-end mt-2">
                            <button
                              onClick={
                                info?.idestado === 6
                                  ? () => eliminarCita(info.idcita)
                                  : () => contactarWhatsApp(info)
                              }
                              className="text-pink-600 hover:text-pink-700"
                            >
                              {info?.idestado === 6
                                ? "Eliminar"
                                : "Contactar por WhatsApp"}
                            </button>
                          </div>

                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Dialog con detalles de la cita */}
      <Dialog
        header="Detalle de la Cita"
        visible={dialogVisible}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={() => setDialogVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDialogVisible(false)}
              className="text-gray-700 hover:text-gray-800"
            >
              Cancelar
            </button>

            <button
              onClick={
                eventoSeleccionado?.idestado === 6
                  ? () => eliminarCita(eventoSeleccionado.idcita)
                  : () => contactarWhatsApp(eventoSeleccionado)
              }
              className="text-pink-600 hover:text-pink-700"
            >
              {eventoSeleccionado?.idestado === 6
                ? "Eliminar"
                : "Contactar por WhatsApp"}
            </button>
          </div>
        }
      >
        {eventoSeleccionado && (
          <div className="space-y-2 text-sm text-gray-700">
            <Card>
              <div className="relative">
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <Badge
                    value={eventoSeleccionado.Estado}
                    className="text-white text-xs"
                    style={{
                      backgroundColor: eventoSeleccionado.ColorFondo,
                      color: "black",
                    }}
                  />
                </div>

                <p>
                  <strong>Nombre:</strong> {eventoSeleccionado.nombrecompleto}
                </p>
                <p>
                  <strong>Celular:</strong> {eventoSeleccionado.celular}
                </p>
                <p>
                  <strong>Día:</strong>{" "}
                  {formatearDiaMesAno(eventoSeleccionado.dia)}
                </p>
                <p>
                  <strong>Hora:</strong>{" "}
                  {formatearHoraAMPM(eventoSeleccionado.hora)}
                </p>
                <p>
                  <strong>Servicio:</strong> {eventoSeleccionado.servicio}
                </p>
                <p>
                  <strong>Categoría:</strong> {eventoSeleccionado.Categoria}
                </p>
              </div>
            </Card>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default CitasScreen;
