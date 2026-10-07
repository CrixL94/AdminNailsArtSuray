import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { listarUrlsPublicas } from "../../../Services/Funciones";
import { supabase } from "../../../supabaseClient";
import Loading from "../../../Components/Loader";
import PageHeader from "../../../Components/PageHeader";
import EmptyState from "../../../Components/EmptyState";
import EstadoBadge from "../../../Components/EstadoBadge";
import { Menu } from "primereact/menu";
import ServiciosCRUD from "./ServiciosCRUD";
import { toastShow } from "../../../Services/ToastService";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import DialogCambiarEstado from "../../../Components/DialogCambiarEstado";
import { useNavigate } from "react-router-dom";
import DialogDetallesServicios from "../DetallesServicios/DialogDetallesServicios";

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
  const [dialogDetallesVisible, setDialogDetallesVisible] = useState(false);

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
          const { error: detallesError } = await supabase
            .from("servicios_detalles")
            .delete()
            .eq("id_servicio", info.id);

          if (detallesError) {
            toastShow(
              toast,
              "error",
              "Error",
              "No se pudieron eliminar los detalles del servicio",
              3000
            );
            return;
          }

          const { error: servicioError } = await supabase
            .from("servicios")
            .delete()
            .eq("id", info.id);

          if (servicioError) {
            toastShow(
              toast,
              "error",
              "Error",
              "No se pudo eliminar el servicio",
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

    await supabase
      .from("servicios_detalles")
      .update({ id_estado: selectedEstado })
      .eq("id_servicio", selectedinfo.id)
      .select();

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

  //Dialog detalles
  const dialogDetalles = (info: any) => {
    setSelectedInfo(info);
    setDialogDetallesVisible(true);
  };
  const onHide = () => {
    setSelectedInfo(null);
    setDialogDetallesVisible(false);
  };

  useEffect(() => {
    getInfo();
    fetchEstados();
  }, []);

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <PageHeader
        eyebrow="Sitio web"
        title="Servicios"
        subtitle="Las tarjetas de servicios que se muestran en el sitio."
        actions={
          <>
          <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={() => getInfo()}>
            <i className="pi pi-sync" />
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate("../detalles/servicios")}>
            <i className="pi pi-list-check" />
            Detalle de servicios
          </button>
          <button type="button" className="btn-primary" onClick={() => abrirDialog()}>
            <i className="pi pi-plus" />
            Nuevo servicio
          </button>
          </>
        }
      />

      {loading ? (
        <div className="card-soft">
          <Loading loading={loading} />
        </div>
      ) : inicioData.length === 0 ? (
        <div className="card-soft">
          <EmptyState
            icon="pi pi-sparkles"
            title="Sin servicios"
            text="Agrega el primer servicio para mostrarlo en el sitio."
            action={<button type="button" className="btn-primary" onClick={() => abrirDialog()}><i className="pi pi-plus" />Nuevo servicio</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {inicioData.map((servicio: any, index: number) => {
            const imagen = filesData.find(
              (img: any) => img.nombre === servicio.imagen_url
            );

            return (
              <article key={servicio.id} className="card-soft flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] bg-brand-100">
                  {imagen && (
                    <img src={imagen.url} alt={servicio.nombre} loading="lazy" className="h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                    <EstadoBadge
                      nombre={servicio.NombreEstado}
                      color={servicio.ColorFondo}
                      onClick={() => abrirDialogEstados(servicio)}
                    />
                    <button
                      type="button"
                      aria-label="Acciones"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-soft transition hover:bg-white"
                      onClick={(e) => menuRef.current[index]?.toggle(e)}
                    >
                      <i className="pi pi-ellipsis-v" />
                    </button>
                    <Menu
                      model={getActionItems(servicio)}
                      popup
                      ref={(el) => {
                        menuRef.current[index] = el!;
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="heading-md">{servicio.nombre}</h2>
                  <p className="mt-1 flex-1 text-sm text-ink-500">{servicio.descripcion}</p>
                  <button
                    type="button"
                    onClick={() => dialogDetalles(servicio)}
                    className="btn-ghost mt-5 w-full"
                  >
                    <i className="pi pi-list-check" />
                    Ver detalles
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

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

      <DialogDetallesServicios
        visible={dialogDetallesVisible}
        selectedinfo={selectedinfo}
        onHide={onHide}
      />
    </>
  );
};

export default ServiciosScreen;
