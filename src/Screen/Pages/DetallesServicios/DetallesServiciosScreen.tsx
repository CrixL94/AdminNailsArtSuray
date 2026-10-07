import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { supabase } from "../../../supabaseClient";
import { toastShow } from "../../../Services/ToastService";
import Loading from "../../../Components/Loader";
import { Menu } from "primereact/menu";
import DataTable from "../../../Components/DataTable";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { MultiSelect } from "primereact/multiselect";
import PageHeader from "../../../Components/PageHeader";
import EmptyState from "../../../Components/EmptyState";
import EstadoBadge from "../../../Components/EstadoBadge";
import DialogCambiarEstado from "../../../Components/DialogCambiarEstado";
import DetallesServiciosCRUD from "./DetallesServiciosCRUD";

const DetallesServiciosScreen = () => {
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

  const [servicios, setServicios] = useState<
    { label: string; value: number }[]
  >([]);
  const [selectedServicios, setSelectedServicios] = useState<number[]>([]);
  const [editar, setEditar] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const getInfo = async () => {
    setLoading(true);
    const { data: detalles } = await supabase
      .from("vta_detalles_servicios")
      .select("*");

    const { data: serviciosData } = await supabase
      .from("servicios")
      .select("id, nombre, id_estado");

    const { data: estadosData } = await supabase
      .from("Estados")
      .select("IdEstado, NombreEstado");

    const estadosFiltrados = (estadosData || []).filter((estado: any) =>
      [1, 2].includes(estado.IdEstado)
    );

    const serviciosFiltardos = (serviciosData || []).filter((estado: any) =>
      [1].includes(estado.id_estado)
    );

    setEstados(
      estadosFiltrados.map((e: any) => ({
        label: e.NombreEstado,
        value: e.IdEstado,
      }))
    );

    setServicios(
      (serviciosFiltardos).map((s) => ({
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

  const abrirDialogEstados = (testimonio: any) => {
    setSelected(testimonio);
    setSelectedEstado(testimonio.id_estado);
    setDialoEstadogVisible(true);
  };

  // Manejar cambio en checkbox
  const onEstadoChange = (estadoValue: number) => {
    setSelectedEstado(estadoValue);
  };

  const abrirDialog = (info?: any) => {
    setEditar(info);
    setDialogVisible(true);
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

  const cerrarDialog = () => {
    setSelected(null);
    setSelectedEstado(null);
    setDialoEstadogVisible(false);
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

  const filteredData = selectedServicios.length
    ? data.filter((d) => selectedServicios.includes(d.id_servicio))
    : data;

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

  useEffect(() => {
    getInfo();
  }, []);

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <PageHeader
        eyebrow="Sitio web"
        title="Detalle de servicios"
        subtitle="Las opciones de cada servicio que aparecen en el sitio y en el formulario de reserva."
        actions={
          <>
          <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={() => getInfo()}>
            <i className="pi pi-sync" />
          </button>
          <button type="button" className="btn-primary" onClick={() => abrirDialog()}>
            <i className="pi pi-plus" />
            Nuevo detalle
          </button>
          </>
        }
      >
        <MultiSelect
          value={selectedServicios}
          options={servicios}
          onChange={(e) => setSelectedServicios(e.value)}
          optionLabel="label"
          optionValue="value"
          placeholder="Filtrar por servicio"
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
          <EmptyState icon="pi pi-list-check" title="Sin detalles" text="No hay detalles para este filtro." />
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
                  <div className="min-w-0 pt-1">
                    <h3 className="truncate font-medium text-ink-900">{info.nombre}</h3>
                    <p className="text-sm text-ink-500">{info.servicio_principal}</p>
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

      <DetallesServiciosCRUD
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        editar={editar}
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
    </>
  );
};

export default DetallesServiciosScreen;
