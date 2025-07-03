import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";
import DataTable from "../../../Components/DataTable";
import Loading from "../../../Components/Loader";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Menu } from "primereact/menu";
import UsuarioCRUD from "./UsuarioCRUD";
import { toastShow } from "../../../Services/ToastService";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";

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
    { header: "ID", field: "id", sortable: true },
    { header: "Nombre", field: "Nombre", sortable: true },
    { header: "Correo", field: "Email", sortable: true },
    { header: "Celular", field: "Telefono", sortable: true },
    {
      header: "Estado",
      field: "NombreEstado",
      body: (rowData: any) => (
        <Badge
          value={rowData.NombreEstado}
          style={{ backgroundColor: rowData.ColorFondo }}
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
              style={{ color: 'gray' }} 
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
    <div className="flex h-screen overflow-hidden">
      <Toast ref={toast} />
      <ConfirmDialog />
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Usuarios</h1>
          <div className="hidden sm:block w-1/2">
            <InputText
              placeholder="Filtrar por nombre, email o teléfono..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full"
            />
          </div>
          <Button icon="pi pi-sync" rounded aria-label="Filter" onClick={() => fetchUsuarios()}/>
          <Button icon="pi pi-plus" rounded severity="success" onClick={() => abrirDialog()}/>
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
                  data={usuariosFiltrados}
                  striped
                  hover
                  rows={5}
                />
              </div>

              {/* Tarjetas para pantallas pequeñas */}
              <div className="sm:hidden">
                <div className="mb-4">
                  <InputText
                    placeholder="Filtrar por nombre, email o teléfono..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-4 h-[76vh] overflow-y-auto">
                  {usuariosFiltrados.map((user, index) => (
                    <div key={user.id} className="relative">
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <Badge
                          value={user.NombreEstado}
                          className="text-white text-xs"
                          style={{ backgroundColor: user.ColorFondo || "#999" }}
                        />
                        <Button
                          icon="pi pi-ellipsis-v"
                          className="p-button-text p-button-sm"
                          style={{ color: 'gray' }}
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
                      <Card>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p>
                            <span className="font-semibold">ID:</span> {user.id}
                          </p>
                          <p>
                            <span className="font-semibold">Nombre:</span>{" "}
                            {user.Nombre}
                          </p>
                          <p>
                            <span className="font-semibold">Correo:</span>{" "}
                            {user.Email}
                          </p>
                          <p>
                            <span className="font-semibold">Celular:</span>{" "}
                            {user.Telefono}
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

      <UsuarioCRUD
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        usuarioEditar={usuarioEditar}
        fetchUsuarios={fetchUsuarios}
      />
    </div>
  );
};

export default UsuariosScreen;
