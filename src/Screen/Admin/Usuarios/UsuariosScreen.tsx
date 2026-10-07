import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";
import DataTable from "../../../Components/DataTable";
import Loading from "../../../Components/Loader";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import UsuarioCRUD from "./UsuarioCRUD";
import { toastShow } from "../../../Services/ToastService";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import PageHeader from "../../../Components/PageHeader";
import EmptyState from "../../../Components/EmptyState";
import EstadoBadge from "../../../Components/EstadoBadge";

const UsuariosScreen = () => {
  const menuRef = useRef<Menu[]>([]);
  const toast = useRef<Toast>(null!);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<any>(null);
  const [filtro, setFiltro] = useState("");

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("vta_usuarios").select("*");
    if (error) {
      toastShow(toast, "error", "Error", "No se pudo obtener el listado de usuarios", 3000);
    } else {
      setUsuarios(data);
      setUsuariosFiltrados(data); 
    }
    setLoading(false);
  };

  const abrirDialog = (usuario?: any) => {
    setUsuarioEditar(usuario ?? null);
    setDialogVisible(true);
  };

  const eliminarUsuario = (usuario: any) => {
    confirmDialog({
      message: `¿Deseas deshabilitar al usuario "${usuario.Nombre}"?`,
      header: "Confirmación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const { error } = await supabase
            .from("Usuarios")
            .update({ IdEstado: 2 })
            .eq("id", usuario.id);

          if (error) {
            toastShow(toast, "error", "Error", "No se pudo deshabilitar el usuario", 3000);
          } else {
            toastShow(toast, "warn", "Usuario deshabilitado", `${usuario.Nombre} ya no podrá iniciar sesión`, 3000);
            fetchUsuarios();
          }
        } catch (err: any) {
          toastShow(toast, "error", "Error inesperado", err.message, 3000);
        }
      },
    });
  };

  const getActionItems = (usuario: any) => {
    const items = [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => abrirDialog(usuario),
      },
    ];

    // Solo mostrar "Eliminar" si el usuario NO está deshabilitado
    if (usuario.IdEstado !== 2) {
      items.push({
        label: "Eliminar",
        icon: "pi pi-trash",
        command: () => eliminarUsuario(usuario),
      });
    }

    return items;
  };


  const columns = [
    // { header: "ID", field: "id", sortable: true },
    { header: "Nombre", field: "Nombre", sortable: true },
    { header: "Correo", field: "Email", sortable: true },
    { header: "Celular", field: "Telefono", sortable: true },
    {
      header: "Estado",
      field: "NombreEstado",
      body: (rowData: any) => (
        <EstadoBadge
          nombre={rowData.NombreEstado}
          color={rowData.ColorFondo}
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
    fetchUsuarios();
  }, []);

  useEffect(() => {
    const filtroLower = filtro.toLowerCase();

    const filtrados = usuarios.filter((u) =>
      (u.Nombre?.toLowerCase().includes(filtroLower) ?? false) ||
      (u.Email?.toLowerCase().includes(filtroLower) ?? false) ||
      (u.Telefono?.toLowerCase().includes(filtroLower) ?? false)
    );

    setUsuariosFiltrados(filtrados);
  }, [filtro, usuarios]);

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        subtitle="Personas con acceso a este panel."
        actions={
          <>
          <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={() => fetchUsuarios()}>
            <i className="pi pi-sync" />
          </button>
          </>
        }
      >
        <IconField iconPosition="left" className="w-full sm:max-w-md">
          <InputIcon className="pi pi-search" />
          <InputText
            placeholder="Buscar por nombre, correo o teléfono…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full"
          />
        </IconField>
      </PageHeader>

      {loading ? (
        <div className="card-soft">
          <Loading loading={loading} />
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="card-soft">
          <EmptyState icon="pi pi-users" title="Sin usuarios" text="No hay usuarios que coincidan con la búsqueda." />
        </div>
      ) : (
        <>
          {/* Tabla solo visible en pantallas grandes */}
          <div className="card-soft hidden overflow-hidden sm:block">
            <DataTable columns={columns} data={usuariosFiltrados} striped hover rows={10} />
          </div>

          {/* Tarjetas para pantallas pequeñas */}
          <div className="flex flex-col gap-3 sm:hidden">
            {usuariosFiltrados.map((user, index) => (
              <article key={user.id} className="card-soft p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 pt-1">
                    <h3 className="truncate font-medium text-ink-900">{user.Nombre}</h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <EstadoBadge
                      nombre={user.NombreEstado}
                      color={user.ColorFondo}
                    />
                    <Button
                      icon="pi pi-ellipsis-v"
                      rounded
                      text
                      aria-label="Acciones"
                      onClick={(e) => menuRef.current[index]?.toggle(e)}
                    />
                    <Menu
                      model={getActionItems(user)}
                      popup
                      ref={(el) => {
                        menuRef.current[index] = el!;
                      }}
                    />
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="dato-label">Correo</dt>
                    <dd className="dato-valor break-words">{user.Email}</dd>
                  </div>
                  <div>
                    <dt className="dato-label">Celular</dt>
                    <dd className="dato-valor break-words">{user.Telefono}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}

      <UsuarioCRUD
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        usuarioEditar={usuarioEditar}
        fetchUsuarios={fetchUsuarios}
      />
    </>
  );
};

export default UsuariosScreen;
