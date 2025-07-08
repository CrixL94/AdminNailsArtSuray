import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { supabase } from "../../../supabaseClient";
import { toastShow } from "../../../Services/ToastService";
import Loading from "../../../Components/Loader";
import { Menu } from "primereact/menu";
import { Badge } from "primereact/badge";
import DataTable from "../../../Components/DataTable";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Card } from "primereact/card";
import { MultiSelect } from "primereact/multiselect";
import DialogCambiarEstado from "../../../Components/DialogCambiarEstado";

const DetallesServiciosScreen = () => {
  const menuRef = useRef<Menu[]>([]);
  const toast = useRef<Toast>(null!);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [estados, setEstados] = useState<{ label: string; value: number }[]>([]);
  const [dialogEstadoVisible, setDialoEstadogVisible] = useState(false);
  const [selectedTestimonio, setSelectedTestimonio] = useState<any>(null);
  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);

  const [servicios, setServicios] = useState<{ label: string; value: number }[]>([]);
  const [selectedServicios, setSelectedServicios] = useState<number[]>([]);

  const getInfo = async () => {
    setLoading(true);
    const { data: detalles } = await supabase
      .from("vta_detalles_servicios")
      .select("*");

    const { data: serviciosData } = await supabase
      .from("servicios")
      .select("id, nombre");

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

    setServicios(
      (serviciosData || []).map((s) => ({
        label: s.nombre,
        value: s.id,
      }))
    );
    setData(detalles || []);

    setLoading(false);
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

  // Abrir dialog
  const abrirDialogEstados = (testimonio: any) => {
    setSelectedTestimonio(testimonio);
    setSelectedEstado(testimonio.id_estado);
    setDialoEstadogVisible(true);
  };

  // Manejar cambio en checkbox
  const onEstadoChange = (estadoValue: number) => {
    setSelectedEstado(estadoValue);
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
      .eq("id", selectedTestimonio.id)
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

  const cerrarDialog = () => {
    setSelectedTestimonio(null);
    setSelectedEstado(null);
    setDialoEstadogVisible(false);
  };

  const getActionItems = (info: any) => {
    const items = [
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        command: () => eliminar(info),
      },
    ];
    return items;
  };

  const filteredData = selectedServicios.length
    ? data.filter((d) => selectedServicios.includes(d.id_servicio))
    : data;

  const columns = [
    // { header: "ID", field: "id", sortable: true },
    { header: "Detalle Servicio", field: "nombre", sortable: true },
    { header: "Descripcion", field: "descripcion", sortable: true },
    { header: "Precio", field: "precio", sortable: true },
    { header: "Tiempo (Minutos)", field: "duracion_minutos", sortable: true },
    { header: "Servicio", field: "servicio_principal", sortable: true },
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
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Detalles Servicios</h1>
          <Button
            icon="pi pi-sync"
            rounded
            aria-label="Filter"
            onClick={() => getInfo()}
          />

          <div className="hidden sm:block">
            <MultiSelect
              value={selectedServicios}
              options={servicios}
              onChange={(e) => setSelectedServicios(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Filtar por Servicio"
              className="w-full"
              display="chip"
            />
          </div>
        </div>

        <div className="my-3 sm:hidden">
          <MultiSelect
            value={selectedServicios}
            options={servicios}
            onChange={(e) => setSelectedServicios(e.value)}
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona servicios"
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

export default DetallesServiciosScreen;
