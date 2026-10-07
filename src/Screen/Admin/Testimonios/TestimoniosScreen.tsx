import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { supabase } from "../../../supabaseClient";
import { toastShow } from "../../../Services/ToastService";
import Loading from "../../../Components/Loader";
import DialogCambiarEstado from "../../../Components/DialogCambiarEstado";
import PageHeader from "../../../Components/PageHeader";
import EmptyState from "../../../Components/EmptyState";
import EstadoBadge from "../../../Components/EstadoBadge";
import { Menu } from "primereact/menu";
import DataTable from "../../../Components/DataTable";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

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

  // Render del diálogo para selección de estados
  useEffect(() => {
    getInfo();
  }, []);

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <PageHeader
        eyebrow="Agenda"
        title="Testimonios"
        subtitle="Aprueba las reseñas para que se muestren en el sitio web."
        actions={
          <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={() => getInfo()}>
            <i className="pi pi-sync" />
          </button>
        }
      />

      {loading ? (
        <div className="card-soft">
          <Loading loading={loading} />
        </div>
      ) : data.length === 0 ? (
        <div className="card-soft">
          <EmptyState icon="pi pi-star" title="Sin testimonios" text="Aún no hay reseñas enviadas desde el sitio." />
        </div>
      ) : (
        <>
          {/* Tabla solo visible en pantallas grandes */}
          <div className="card-soft hidden overflow-hidden sm:block">
            <DataTable columns={columns} data={data} striped hover rows={10} />
          </div>

          {/* Tarjetas para pantallas pequeñas */}
          <div className="flex flex-col gap-3 sm:hidden">
            {data.map((info, index) => (
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
                  {info.Celular && (
                    <div>
                      <dt className="dato-label">Celular</dt>
                      <dd className="dato-valor break-words">{info.Celular}</dd>
                    </div>
                  )}
                  {info.contenido && (
                    <div>
                      <dt className="dato-label">Reseña</dt>
                      <dd className="dato-valor break-words">{info.contenido}</dd>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}

      <DialogCambiarEstado
        dialogEstadoVisible={dialogVisible}
        cerrarDialog={cerrarDialog}
        guardarEstado={guardarEstado}
        estados={estados}
        onEstadoChange={onEstadoChange}
        selectedEstado={selectedEstado}
      />
    </>
  );
};

export default TestimoniosScreen;
