import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { supabase } from "../../../supabaseClient";
import DialogCambiarEstado from "../../../Components/DialogCambiarEstado";
import Loading from "../../../Components/Loader";
import DataTable from "../../../Components/DataTable";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { toastShow } from "../../../Services/ToastService";
import { Menu } from "primereact/menu";
import { MultiSelect } from "primereact/multiselect";
import PageHeader from "../../../Components/PageHeader";
import EmptyState from "../../../Components/EmptyState";
import EstadoBadge from "../../../Components/EstadoBadge";

const MensajesScreen = () => {
  const menuRef = useRef<Menu[]>([]);
  const toast = useRef<Toast>(null!);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [estados, setEstados] = useState<{ label: string; value: number }[]>(
    []
  );
  const [dialogEstadoVisible, setDialoEstadogVisible] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<number[]>([]);

  const getInfo = async () => {
    setLoading(true);
    const { data: detalles } = await supabase.from("vta_contactos").select("*");

    const { data: estadosData } = await supabase
      .from("Estados")
      .select("IdEstado, NombreEstado");

    const estadosFiltrados = (estadosData || []).filter((estado: any) =>
      [6].includes(estado.IdEstado)
    );

    setEstados(
      estadosFiltrados.map((e: any) => ({
        label: e.NombreEstado,
        value: e.IdEstado,
      }))
    );

    setData(detalles || []);

    setLoading(false);
  };

  const eliminar = async (info: any) => {
    confirmDialog({
      message: "¿Deseas eliminar el mensaje?",
      header: "Confirmación",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        const { error } = await supabase
          .from("contactos")
          .delete()
          .eq("id", info.id);
        if (error) {
          toastShow(toast, "error", "Error", error.message, 3000);
        } else {
          toastShow(toast, "warn", "Eliminado", "Mensaje eliminado", 3000);
          getInfo();
        }
      },
    });
  };

  const abrirDialogEstados = (info: any) => {
    setSelected(info);
    setSelectedEstado(info.id_estado);
    setDialoEstadogVisible(true);
  };

  // Manejar cambio en checkbox
  const onEstadoChange = (estadoValue: number) => {
    setSelectedEstado(estadoValue);
  };

  const guardarEstado = async () => {
    setLoading(true);

    const { error } = await supabase
      .from("contactos")
      .update({ id_estado: selectedEstado })
      .eq("id", selected.id)
      .select();

    if (error) {
      toastShow(
        toast,
        "error",
        "Error",
        "No se pudo actualizar el estado",
        3000
      );
    } else {
      toastShow(
        toast,
        "success",
        "Éxito",
        "Estado actualizado correctamente",
        3000
      );
      setDialoEstadogVisible(false);
      getInfo();
      confirmDialog({
        message: "¿Deseas contactar al cliente ahora por WhatsApp?",
        header: "Confirmar acción",
        icon: "pi pi-whatsapp",
        acceptLabel: "Sí, contactar",
        rejectLabel: "No",
        accept: () => contactarWhatsApp(selected),
      });
    }

    setLoading(false);
  };

  const cerrarDialog = () => {
    setSelected(null);
    setSelectedEstado(null);
    setDialoEstadogVisible(false);
  };

  const contactarWhatsApp = async (info: any) => {
    if (!info?.celular) return;
    setLoading(true);
    await supabase
      .from("contactos")
      .update({ id_estado: 6 })
      .eq("id", info.id)
      .select();

    const { data } = await supabase.from("servicios_detalles").select("*");

    const serviciosFiltrados = (data || []).filter((estado: any) =>
      [1].includes(estado.id_estado)
    );

    const numero = info.celular.replace(/\D/g, "");

    let mensaje = `*Hola ${info.nombre}*, recibí tu mensaje por la web. A continuación te detallo nuestros servicios:\n\n`;

    serviciosFiltrados.forEach((servicio, index) => {
      mensaje += `*${index + 1}.* *${servicio.nombre}*\n`;
    });

    mensaje += `\n*Nail's Art Suray*\n_¿Lista para lucir tus uñas?_\n*Reserva tu cita ahora* y déjanos consentirte como te mereces`;

    const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

    const a = document.createElement("a");
    a.href = link;
    a.target = "_self";
    a.rel = "noopener noreferrer";
    a.click();
    setLoading(false);
  };

  const getActionItems = (info: any) => {
    const items = [
      {
        label: "Contactar",
        icon: "pi pi-pencil",
        command: () => contactarWhatsApp(info),
      },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        command: () => eliminar(info),
      },
    ];
    return items;
  };

  const filteredData = selectedInfo.length
    ? data.filter((d) => selectedInfo.includes(d.id_estado))
    : data;

  const columns = [
    // { header: "ID", field: "id", sortable: true },
    { header: "Nombre", field: "nombre", sortable: true },
    { header: "Celular", field: "celular", sortable: true },
    { header: "Email", field: "email", sortable: true },
    { header: "Mensaje", field: "mensaje", sortable: true },
    {
      header: "Estado",
      field: "NombreEstado",
      body: (rowData: any) => (
        <EstadoBadge
          nombre={rowData.NombreEstado}
          color={rowData.ColorFondo}
          onClick={() => abrirDialogEstados(rowData)}
        />
      ),
      sortable: true,
    },
    {
      header: "",
      sortable: false,
      body: (rowData: any, { rowIndex }: { rowIndex: number }) => {
        return (
          <div className="flex justify-end items-center">
            <Button
              icon="pi pi-ellipsis-v"
              rounded
              text
              aria-label="Acciones"
              onClick={(e) => menuRef.current[rowIndex]?.toggle(e)}
            />
            <Menu
              model={getActionItems(rowData)}
              popup
              ref={(el) => {
                menuRef.current[rowIndex] = el!;
              }}
            />
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    getInfo();
  }, []);

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <PageHeader
        eyebrow="Agenda"
        title="Mensajes"
        subtitle="Lo que te escriben desde el formulario de contacto."
        actions={
          <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={() => getInfo()}>
            <i className="pi pi-sync" />
          </button>
        }
      >
        <MultiSelect
            value={selectedInfo}
            options={estados}
            onChange={(e) => setSelectedInfo(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrar por estado"
            className="w-full sm:w-80"
            display="chip"
            showClear
          />
      </PageHeader>

      {loading ? (
        <div className="card-soft">
          <Loading loading={loading} />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="card-soft">
          <EmptyState icon="pi pi-comments" title="Sin mensajes" text="No hay mensajes con este filtro." />
        </div>
      ) : (
        <>
          {/* Tabla solo visible en pantallas grandes */}
          <div className="card-soft hidden overflow-hidden sm:block">
            <DataTable columns={columns} data={filteredData} striped hover rows={10} />
          </div>

          {/* Tarjetas para pantallas pequeñas */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filteredData.map((info, index) => (
              <article key={info.id} className="card-soft p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 truncate pt-1 font-medium text-ink-900">{info.nombre}</h3>
                  <div className="flex shrink-0 items-center gap-1">
                    <EstadoBadge
                      nombre={info.NombreEstado}
                      color={info.ColorFondo}
                      onClick={() => abrirDialogEstados(info)}
                    />
                    <Button
                      icon="pi pi-ellipsis-v"
                      rounded
                      text
                      aria-label="Acciones"
                      onClick={(e) => menuRef.current[index]?.toggle(e)}
                    />
                    <Menu
                      model={getActionItems(info)}
                      popup
                      ref={(el) => {
                        menuRef.current[index] = el!;
                      }}
                    />
                  </div>
                </div>
                <dl className="mt-3 space-y-3">
                  {info.celular && (
                    <div>
                      <dt className="dato-label">Celular</dt>
                      <dd className="dato-valor break-words">{info.celular}</dd>
                    </div>
                  )}
                  {info.email && (
                    <div>
                      <dt className="dato-label">Email</dt>
                      <dd className="dato-valor break-words">{info.email}</dd>
                    </div>
                  )}
                  {info.mensaje && (
                    <div>
                      <dt className="dato-label">Mensaje</dt>
                      <dd className="dato-valor break-words">{info.mensaje}</dd>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}

      <DialogCambiarEstado
        dialogEstadoVisible={dialogEstadoVisible}
        cerrarDialog={cerrarDialog}
        guardarEstado={guardarEstado}
        estados={estados}
        onEstadoChange={onEstadoChange}
        selectedEstado={selectedEstado}
      />
    </>
  );
};

export default MensajesScreen;
