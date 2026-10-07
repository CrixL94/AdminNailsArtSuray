import { Dialog } from "primereact/dialog";
import { supabase } from "../../../supabaseClient";
import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import DataTable from "../../../Components/DataTable";
import Loading from "../../../Components/Loader";
import EmptyState from "../../../Components/EmptyState";
import EstadoBadge from "../../../Components/EstadoBadge";
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
    { header: "Detalle", field: "nombre", sortable: true },
    { header: "Descripción", field: "descripcion", sortable: true },
    {
      header: "Precio",
      field: "precio",
      sortable: true,
      body: (rowData: any) => <span className="whitespace-nowrap">L. {rowData.precio}</span>,
    },
    {
      header: "Duración",
      field: "duracion_minutos",
      sortable: true,
      body: (rowData: any) => <span className="whitespace-nowrap">{rowData.duracion_minutos} min</span>,
    },
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
          <div className="flex flex-col items-start">
            <span className="eyebrow mb-1 font-sans">{selectedinfo?.nombre ?? "Servicio"}</span>
            <span>Detalles del servicio</span>
          </div>
        }
        visible={visible}
        className="w-[96vw] max-w-5xl"
        modal
        blockScroll
        draggable={false}
        onHide={() => {
          cerrarDialog();
        }}
        footer={
          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex gap-2">
              <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={() => getInfo()}>
            <i className="pi pi-sync" />
          </button>
              <button type="button" className="btn-primary" onClick={() => abrirDialog()}>
            <i className="pi pi-plus" />
            Nuevo detalle
          </button>
            </div>
            <button type="button" onClick={cerrarDialog} className="btn-ghost">
              Cerrar
            </button>
          </div>
        }
      >
        <div className="pt-2">
          {loading ? (
            <div className="card-soft">
              <Loading loading={loading} />
            </div>
          ) : data.length === 0 ? (
            <div className="card-soft">
              <EmptyState icon="pi pi-list-check" title="Sin detalles" text="Este servicio aún no tiene detalles." />
            </div>
          ) : (
            <>
              {/* Tabla solo visible en pantallas grandes */}
              <div className="hidden overflow-hidden rounded-2xl ring-1 ring-brand-100 sm:block">
                <DataTable columns={columns} data={data} striped hover rows={10} />
              </div>

              {/* Tarjetas para pantallas pequeñas */}
              <div className="flex flex-col gap-3 sm:hidden">
                {data.map((info, index) => (
                  <article key={info.id} className="card-soft p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 pt-1">
                        <h3 className="truncate font-medium text-ink-900">{info.nombre}</h3>
                      </div>
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
                    <dl className="mt-3 grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <dt className="dato-label">Descripción</dt>
                        <dd className="dato-valor break-words">{info.descripcion}</dd>
                      </div>
                      <div>
                        <dt className="dato-label">Precio</dt>
                        <dd className="dato-valor break-words">L. {info.precio}</dd>
                      </div>
                      <div>
                        <dt className="dato-label">Duración</dt>
                        <dd className="dato-valor break-words">{info.duracion_minutos} min</dd>
                      </div>
                    </dl>
                  </article>
                ))}
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
