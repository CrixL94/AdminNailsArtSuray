import { Dialog } from "primereact/dialog";
import { supabase } from "../../../supabaseClient";
import { useEffect, useRef, useState } from "react";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import DataTable from "../../../Components/DataTable";
import Loading from "../../../Components/Loader";
import DetallesServiciosCRUD from "./DetallesServiciosCRUD";
import { confirmDialog } from "primereact/confirmdialog";
import { toastShow } from "../../../Services/ToastService";
import { Menu } from "primereact/menu";
import { Toast } from "primereact/toast";
import DialogCambiarEstado from "../../../Components/DialogCambiarEstado";

const DialogDetallesServicios = ({
  visible,
  selectedinfo,
  onHide,
}: {
  visible: boolean;
  selectedinfo: any;
  onHide: () => void;
}) => {
  const menuRef = useRef<Menu[]>([]);
  const toast = useRef<Toast>(null!);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [dialogEstadoVisible, setDialoEstadogVisible] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);
  const [estados, setEstados] = useState<{ label: string; value: number }[]>(
    []
  );
  const [editar, setEditar] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const getInfo = async () => {
    setLoading(true);
    const { data: detalles } = await supabase
      .from("vta_detalles_servicios")
      .select("*");

    const { data: estadosData } = await supabase
      .from("Estados")
      .select("IdEstado, NombreEstado");

    const estadosFiltrados = (estadosData || []).filter((estado: any) =>
      [1, 2].includes(estado.IdEstado)
    );

    setEstados(
      estadosFiltrados.map((e: any) => ({
        label: e.NombreEstado,
        value: e.IdEstado,
      }))
    );

    const detallesFiltrados = (detalles || []).filter(
      (item: any) => item.id_servicio === selectedinfo?.id
    );

    setData(detallesFiltrados);

    setLoading(false);
  };

  const abrirDialog = (info?: any) => {
    setEditar(info);
    setDialogVisible(true);
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

  const eliminar = async (info: any) => {
    confirmDialog({
      message: "¿Deseas eliminar el detalle del servicio?",
      header: "Confirmación",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        const { error } = await supabase
          .from("servicios_detalles")
          .delete()
          .eq("id", info.id);
        if (error) {
          toastShow(toast, "error", "Error", error.message, 3000);
        } else {
          toastShow(toast, "warn", "Eliminado", "Detalle eliminado", 3000);
          getInfo();
        }
      },
    });
  };

  const getActionItems = (info: any) => {
    const items = [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => abrirDialog(info),
      },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        command: () => eliminar(info),
      },
    ];
    return items;
  };

  const columns = [
    // { header: "ID", field: "id", sortable: true },
    { header: "Servicio", field: "servicio_principal", sortable: true },
    { header: "Detalle Servicio", field: "nombre", sortable: true },
    { header: "Descripcion", field: "descripcion", sortable: true },
    { header: "Precio", field: "precio", sortable: true },
    { header: "Tiempo (Minutos)", field: "duracion_minutos", sortable: true },
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

  const cerrarDialog = () => {
    onHide();
  };

  const guardarEstado = async () => {
    if (selectedEstado === 3) {
      toastShow(
        toast,
        "error",
        "Error de validación",
        "Es requerido un estado",
        3000
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("servicios_detalles")
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
    }

    setLoading(false);
  };

  const cerrarDialogEstado = () => {
    setSelected(null);
    setSelectedEstado(null);
    setDialoEstadogVisible(false);
  };

  useEffect(() => {
    if (visible) {
      getInfo();
    }
  }, [visible]);
  return (
    <div>
      <Toast ref={toast} />
      {/* <ConfirmDialog /> */}
      <Dialog
        header={
          <div className="sm:flex sm:items-center gap-3 mb-4">
            <h1 className="sm:text-3xl text-2xl">Detalles Servicios</h1>
            <div className="flex gap-3 mt-3">
              <Button
                icon="pi pi-sync"
                rounded
                aria-label="Filter"
                onClick={() => getInfo()}
              />

              <Button
                icon="pi pi-plus"
                rounded
                severity="success"
                onClick={() => abrirDialog()}
              />
            </div>
          </div>
        }
        visible={visible}
        className="sm:w-[75%] w-full sm:p-0 p-2"
        modal
        onHide={() => {
          cerrarDialog();
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={cerrarDialog}
              className="text-gray-700 hover:text-gray-800"
            >
              Cerrar
            </button>
          </div>
        }
      >
        <div className="sm:bg-gray-100 sm:rounded sm:shadow sm:p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loading loading={loading} />
            </div>
          ) : (
            <>
              {/* Tabla solo visible en pantallas grandes */}
              <div className="hidden sm:block">
                <DataTable
                  columns={columns}
                  data={data}
                  striped
                  hover
                  rows={5}
                />
              </div>

              {/* Tarjetas para pantallas pequeñas */}
              <div className="sm:hidden">
                <div className="flex flex-col gap-4 overflow-y-auto">
                  {data.map((info, index) => (
                    <div
                      key={info.id}
                      className="relative border-1 border-gray-100 rounded shadow-2xs"
                    >
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
                            <span className="font-semibold">
                              Tipo Servicio:
                            </span>{" "}
                            {info.servicio_principal}
                          </p>
                          <p>
                            <span className="font-semibold">
                              Detalle Servicio:
                            </span>{" "}
                            {info.nombre}
                          </p>
                          <p>
                            <span className="font-semibold">Descripción:</span>{" "}
                            {info.descripcion}
                          </p>
                          <p>
                            <span className="font-semibold">Precio:</span>{" "}
                            {info.precio}
                          </p>
                          <p>
                            <span className="font-semibold">
                              Tiempo estimado:
                            </span>{" "}
                            {info.duracion_minutos} min.
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
      </Dialog>

      <DetallesServiciosCRUD
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        editar={editar}
        getInfo={getInfo}
        idServicioPrincipal={selectedinfo?.id}
      />

      <DialogCambiarEstado
        dialogEstadoVisible={dialogEstadoVisible}
        cerrarDialog={cerrarDialogEstado}
        guardarEstado={guardarEstado}
        estados={estados}
        onEstadoChange={onEstadoChange}
        selectedEstado={selectedEstado}
      />
    </div>
  );
};

export default DialogDetallesServicios;
