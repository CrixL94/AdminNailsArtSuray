import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { listarUrlsPublicas } from "../../../Services/Funciones";
import { supabase } from "../../../supabaseClient";
import Loading from "../../../Components/Loader";
import { Badge } from "primereact/badge";
import { Menu } from "primereact/menu";
import ServiciosCRUD from "./ServiciosCRUD";
import { toastShow } from "../../../Services/ToastService";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import DialogCambiarEstado from "../../../Components/DialogCambiarEstado";
import { useNavigate } from "react-router-dom";

const ServiciosScreen = () => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null!);
  const menuRef = useRef<Menu[]>([]);

  const [inicioData, setInicioData] = useState<any>([]);
  const [filesData, setFilesData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editar, setEditar] = useState<any>(null);
  const [estados, setEstados] = useState<{ label: string; value: number }[]>(
    []
  );
  const [dialogEstadoVisible, setDialogEstadoVisible] = useState(false);
  const [selectedinfo, setSelectedInfo] = useState<any>(null);
  const [selectedEstado, setSelectedEstado] = useState<number | null>(null);

  const getInfo = async () => {
    setLoading(true);

    const { data, error } = await supabase.from("vta_servicios").select("*");

    if (error) {
      setInicioData([]);
      setFilesData([]);
      setLoading(false);
      return;
    }

    if (!data) {
      setInicioData([]);
      setFilesData([]);
      setLoading(false);
      return;
    }
    setInicioData(data);

    const nombresDeArchivo = data
      .flatMap((item: any) => [item.imagen_url])
      .filter(Boolean);

    const urls = await listarUrlsPublicas("imagenes", "Servicios");

    const urlsFiltradas = urls
      .filter((url) =>
        nombresDeArchivo.some((nombre: any) => url.includes(nombre))
      )
      .map((url) => {
        const nombre = url.split("/").pop();
        return { nombre, url };
      });

    setFilesData(urlsFiltradas);
    setLoading(false);
  };

  const fetchEstados = async () => {
    const { data } = await supabase
      .from("Estados")
      .select("IdEstado, NombreEstado");

    const estadosFiltrados = (data || []).filter((estado: any) =>
      [1, 2].includes(estado.IdEstado)
    );

    setEstados(
      estadosFiltrados.map((e: any) => ({
        label: e.NombreEstado,
        value: e.IdEstado,
      }))
    );
  };

  const abrirDialog = (info?: any) => {
    setEditar(info);
    setDialogVisible(true);
  };

  // Abrir dialog
  const abrirDialogEstados = (info: any) => {
    setSelectedInfo(info);
    setSelectedEstado(info.id_estado);
    setDialogEstadoVisible(true);
  };

  // Manejar cambio en checkbox
  const onEstadoChange = (estadoValue: number) => {
    setSelectedEstado(estadoValue);
  };

  const eliminarServicio = (info: any) => {
    confirmDialog({
      message: `¿Deseas eliminar el servicio "${info.nombre}"?`,
      header: "Confirmación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const { error } = await supabase
            .from("servicios")
            .delete()
            .eq("id", info.id);

          if (error) {
            toastShow(
              toast,
              "error",
              "Error",
              "No se pudo eliminado el servicio",
              3000
            );
          } else {
            toastShow(
              toast,
              "warn",
              "Servicio Eliminado",
              `${info.nombre} eliminado correctamente`,
              3000
            );
            getInfo();
          }
        } catch (err: any) {
          toastShow(toast, "error", "Error inesperado", err.message, 3000);
        }
      },
    });
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
      .from("servicios")
      .update({ id_estado: selectedEstado })
      .eq("id", selectedinfo.id)
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
      cerrarDialog();
      getInfo();
    }

    setLoading(false);
  };

  const cerrarDialog = () => {
    setSelectedInfo(null);
    setSelectedEstado(null);
    setDialogEstadoVisible(false);
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
        command: () => eliminarServicio(info),
      },
    ];
    return items;
  };

  useEffect(() => {
    getInfo();
    fetchEstados();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Toast ref={toast} />
      <ConfirmDialog />
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Servicios</h1>
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
          <Button
            icon="pi pi-list"
            label="Detalles Servicios"
            className="p-button-sm"
            rounded
            severity="info"
            onClick={() => navigate("../detalles/servicios")}
          />
        </div>

        <div className="sm:bg-white sm:rounded sm:shadow sm:h-[52rem] h-[35rem] sm:p-6 p-0 overflow-y-auto">
          {loading || !filesData ? (
            <div className="flex items-center justify-center h-screen">
              <Loading loading={loading} />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
              {inicioData.map((servicio: any, index: number) => {
                const imagen = filesData.find(
                  (img: any) => img.nombre === servicio.imagen_url
                );

                return (
                  <div
                    key={servicio.id}
                    className="sm:bg-gray-100 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex items-center justify-end p-1">
                      <Badge
                        value={servicio.NombreEstado}
                        className="text-white text-xs"
                        style={{ backgroundColor: servicio.ColorFondo }}
                        onClick={() => abrirDialogEstados(servicio)}
                      />

                      <Button
                        icon="pi pi-ellipsis-v"
                        className="p-button-text p-button-sm"
                        style={{ color: "gray" }}
                        onClick={(e) => menuRef.current[index]?.toggle(e)}
                      />
                      <Menu
                        model={getActionItems(servicio)}
                        popup
                        ref={(el) => {
                          menuRef.current[index] = el!;
                        }}
                      />
                    </div>

                    {/* Imagen */}
                    {imagen && (
                      <img
                        src={imagen.url}
                        alt={servicio.nombre}
                        className="w-full object-cover"
                      />
                    )}

                    {/* Contenido */}
                    <div className="p-4 flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-purple-600 mb-2">
                          {servicio.nombre}
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">
                          {servicio.descripcion}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => console.log("Ver detalles")}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition duration-300"
                        >
                          Detalles<i className="pi pi-eye"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ServiciosCRUD
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        editar={editar}
        filesData={filesData}
        getInfo={getInfo}
      />

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

export default ServiciosScreen;
