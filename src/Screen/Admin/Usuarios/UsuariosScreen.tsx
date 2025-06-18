import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import DataTable from "../../../Components/DataTable";
import Loading from "../../../Components/Loader";
import { Button } from "primereact/button";

const UsuariosScreen = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("Usuarios").select("*");

    if (error) {
      console.error("Error al obtener usuarios:", error);
    } else {
      console.log(data);
      setUsuarios(data);
    }
    setLoading(false);
  };

  const columns = [
    { header: "ID", field: "id", sortable: true },
    { header: "Nombre", field: "Nombre", sortable: true },
    { header: "Correo", field: "Email", sortable: true },
    { header: "Celular", field: "Telefono", sortable: true },
  ];

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Usuarios</h1>
          <Button icon="pi pi-sync" rounded outlined aria-label="Filter" onClick={() => fetchUsuarios()}/>
        </div>

        <div className="bg-white rounded shadow p-4">
          {loading ? (
            <Loading loading={loading} />
          ) : (
            <div>
              <DataTable
                columns={columns}
                data={usuarios}
                striped
                hover
                rows={5}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UsuariosScreen;
