import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";
import DataTable from "../../../Components/DataTable";
import Loading from "../../../Components/Loader";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Menu } from "primereact/menu";
import UsuarioCRUD from "./UsuarioCRUD";

const UsuariosScreen = () => {
  const menuRef = useRef<Menu[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<any>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("vta_usuarios").select("*");
    if (error) {
      console.error("Error al obtener usuarios:", error);
    } else {
      setUsuarios(data);
    }
    setLoading(false);
  };

  const abrirDialog = (usuario?: any) => {
    setUsuarioEditar(usuario ?? null);
    setDialogVisible(true);
  };

  const eliminarUsuario = (usuario?: any) => {
    console.log("ELIMINAR USUARIO", usuario);
    // setUsuarioEditar(usuario ?? null);
    // setDialogVisible(true);
  };

  // Definir función que retorna el array de items para SplitButton
  const getActionItems = (usuario: any) => [
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => abrirDialog(usuario),
    },
    {
      label: "Eliminar",
      icon: "pi pi-trash",
      command: () => eliminarUsuario(usuario),
    },
  ];

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

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Usuarios</h1>
          <Button
            icon="pi pi-sync"
            rounded
            outlined
            aria-label="Filter"
            onClick={() => fetchUsuarios()}
          />
        </div>

        <div className="sm:bg-white sm:rounded sm:shadow sm:p-4 h-[52rem] overflow-y-auto">
          {loading ? (
            <Loading loading={loading} />
          ) : (
            <>
              {/* Tabla solo visible en pantallas grandes */}
              <div className="hidden sm:block">
                <DataTable
                  columns={columns}
                  data={usuarios}
                  striped
                  hover
                  rows={5}
                />
              </div>
              {/* Tarjetas para pantallas pequeñas */}
              <div className="sm:hidden flex flex-col gap-4">
                {usuarios.map((user, index) => (
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
