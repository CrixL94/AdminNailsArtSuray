import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { supabase } from "../../../supabaseClient";
import { toastShow } from "../../../Services/ToastService";
import Loading from "../../../Components/Loader";
import { Menu } from "primereact/menu";
import { Badge } from "primereact/badge";
import DataTable from "../../../Components/DataTable";
import { Dialog } from "primereact/dialog";
import { RadioButton } from "primereact/radiobutton";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Card } from "primereact/card";

const TestimoniosScreen = () => {
  const menuRef = useRef<Menu[]>([]);
  const toast = useRef<Toast>(null!);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [estados, setEstados] = useState<{ label: string; value: number }[]>(
    []
  );
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedTestimonio, setSelectedTestimonio] = useState<any>(null);
  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);

  const getInfo = async () => {
    setLoading(true);

    try {
      // Obtener testimonios
      const { data: testimonios, error: testimoniosError } = await supabase
        .from("vta_testimonios")
        .select("*");

      // Obtener estados
      const { data: estadosData, error: estadosError } = await supabase
        .from("Estados")
        .select("IdEstado, NombreEstado");

      if (testimoniosError || estadosError) {
        toastShow(
          toast,
          "error",
          "Error",
          "No se pudo obtener la información.",
          3000
        );
        setLoading(false);
        return;
      }

      const estadosFiltrados = (estadosData || []).filter((estado: any) =>
        [4, 5].includes(estado.IdEstado)
      );

      setEstados(
        estadosFiltrados.map((e: any) => ({
          label: e.NombreEstado,
          value: e.IdEstado,
        }))
      );

      setData(testimonios || []);
    } catch (e) {
      toastShow(toast, "error", "Error", "Ocurrió un error inesperado.", 3000);
    } finally {
      setLoading(false);
    }
  };

  // Abrir dialog
  const abrirDialogEstados = (testimonio: any) => {
    setSelectedTestimonio(testimonio);
    setSelectedEstado(testimonio.idestado);
    setDialogVisible(true);
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
      .from("testimonios")
      .update({ idestado: selectedEstado })
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
      setDialogVisible(false);
      getInfo();
    }

    setLoading(false);
  };

  const cerrarDialog = () => {
    setSelectedTestimonio(null);
    setSelectedEstado(null);
    setDialogVisible(false);
  };

  const eliminarUsuario = (info: any) => {
    confirmDialog({
      message: `¿Deseas eliminar el testimonio?`,
      header: "Confirmación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const { error } = await supabase
            .from("testimonios")
            .delete()
            .eq("id", info.id);

          if (error) {
            toastShow(
              toast,
              "error",
              "Error",
              "No se pudo elimianar el testimonio",
              3000
            );
          } else {
            toastShow(toast, "warn", "Eliminado", `Testimonio Eliminado`, 3000);
            getInfo();
          }
        } catch (err: any) {
          toastShow(toast, "error", "Error inesperado", err.message, 3000);
        }
      },
    });
  };

  const getActionItems = (info: any) => {
    const items = [
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        command: () => eliminarUsuario(info),
      },
    ];
    return items;
  };

  const columns = [
    // { header: "ID", field: "id", sortable: true },
    { header: "Nombre", field: "nombre", sortable: true },
    { header: "Celular", field: "Celular", sortable: true },
    { header: "Mensaje", field: "contenido", sortable: true },
    {
      header: "Estado",
      field: "NombreEstado",
      body: (rowData: any) => (
        <Badge
          value={rowData.NombreEstado}
          style={{ backgroundColor: rowData.ColorFondo, color: "black", cursor: "pointer", }}
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

  // Render del diálogo para selección de estados
  const renderDialog = () => (
    <Dialog
      header={`Cambiar Estado Testimonio`}
      visible={dialogVisible}
      className="sm:w-1/3 w-full sm:p-0 p-2"
      modal
      onHide={cerrarDialog}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={cerrarDialog}
            className="text-gray-700 hover:text-gray-800"
          >
            Cancelar
          </button>

          <button
            onClick={guardarEstado}
            className="text-pink-600 hover:text-pink-600"
          >
            Guardar
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {estados.map((estado) => (
          <div key={estado.value} className="flex align-items-center">
            <RadioButton
              inputId={`estado_${estado.value}`}
              name="estado"
              value={estado.value}
              onChange={() => onEstadoChange(estado.value)}
              checked={selectedEstado === estado.value}
            />
            <label htmlFor={`estado_${estado.value}`} className="ml-2">
              {estado.label}
            </label>
          </div>
        ))}
      </div>
    </Dialog>
  );

  useEffect(() => {
    getInfo();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Toast ref={toast} />
      <ConfirmDialog />
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Testimonios</h1>
          <Button
            icon="pi pi-sync"
            rounded
            aria-label="Filter"
            onClick={() => getInfo()}
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
                  data={data}
                  striped
                  hover
                  rows={5}
                />
              </div>

              {/* Tarjetas para pantallas pequeñas */}
              <div className="sm:hidden">
                <div className="flex flex-col gap-4 h-[76vh] overflow-y-auto">
                  {data.map((info, index) => (
                    <div key={info.id} className="relative">
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <Badge
                          value={info.NombreEstado}
                          className="text-white text-xs"
                          style={{ backgroundColor: info.ColorFondo, color:'black' }}
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
                            {info.Celular}
                          </p>
                          <p>
                            <span className="font-semibold">Mensaje:</span>{" "}
                            {info.contenido}
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

        {renderDialog()}
      </main>
    </div>
  );
};

export default TestimoniosScreen;
