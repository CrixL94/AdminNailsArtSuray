import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { supabase } from "../../../supabaseClient";
import DialogCambiarEstado from "../../../Components/DialogCambiarEstado";
import { Badge } from "primereact/badge";
import Loading from "../../../Components/Loader";
import DataTable from "../../../Components/DataTable";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { toastShow } from "../../../Services/ToastService";
import { Menu } from "primereact/menu";
import { Card } from "primereact/card";
import { MultiSelect } from "primereact/multiselect";

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
        <Badge
          value={rowData.NombreEstado}
          style={{
            backgroundColor: rowData.ColorFondo,
            color: "black",
            cursor: "pointer",
          }}
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
              className="p-button-text p-button-sm"
              style={{ color: "gray" }}
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
    <div className="flex h-screen overflow-hidden">
      <Toast ref={toast} />
      <ConfirmDialog />
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Mensajes Recibidos</h1>
          <Button
            icon="pi pi-sync"
            rounded
            aria-label="Filter"
            onClick={() => getInfo()}
          />

          <div className="hidden sm:block">
            <MultiSelect
              value={selectedInfo}
              options={estados}
              onChange={(e) => setSelectedInfo(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Filtar por Estado"
              className="w-full"
              display="chip"
            />
          </div>
        </div>

        <div className="my-3 sm:hidden">
          <MultiSelect
            value={selectedInfo}
            options={estados}
            onChange={(e) => setSelectedInfo(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Filtar por Estado"
            className="w-full"
            display="chip"
          />
        </div>

        <div className="sm:bg-white sm:rounded sm:shadow sm:p-4 h-[52rem] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-screen">
              <Loading loading={loading} />
            </div>
          ) : (
            <>
              {/* Tabla solo visible en pantallas grandes */}
              <div className="hidden sm:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  striped
                  hover
                  rows={5}
                />
              </div>

              {/* Tarjetas para pantallas pequeñas */}
              <div className="sm:hidden">
                <div className="flex flex-col gap-4 h-[85vh] overflow-y-auto">
                  {filteredData.map((info, index) => (
                    <div key={info.id} className="relative">
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <Badge
                          value={info.NombreEstado}
                          className="text-white text-xs"
                          style={{
                            backgroundColor: info.ColorFondo,
                            color: "black",
                          }}
                          onClick={() => abrirDialogEstados(info)}
                        />
                        <Button
                          icon="pi pi-ellipsis-v"
                          className="p-button-text p-button-sm"
                          style={{ color: "gray" }}
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
                      <Card>
                        <div className="text-sm text-gray-700 space-y-1 mt-3">
                          {/* <p>
                            <span className="font-semibold">ID:</span> {info.id}
                          </p> */}
                          <p>
                            <span className="font-semibold">Nombre:</span>{" "}
                            {info.nombre}
                          </p>
                          <p>
                            <span className="font-semibold">Celular:</span>{" "}
                            {info.celular}
                          </p>
                          {info.email && (
                            <p>
                              <span className="font-semibold">Email:</span>{" "}
                              {info.email}
                            </p>
                          )}
                          <p>
                            <span className="font-semibold">Mensaje:</span>{" "}
                            {info.mensaje}
                          </p>
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

      <DialogCambiarEstado
        dialogEstadoVisible={dialogEstadoVisible}
        cerrarDialog={cerrarDialog}
        guardarEstado={guardarEstado}
        estados={estados}
        onEstadoChange={onEstadoChange}
        selectedEstado={selectedEstado}
      />
    </div>
  );
};

export default MensajesScreen;
