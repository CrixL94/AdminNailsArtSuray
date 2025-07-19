import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import CitasScreen from "../Admin/Citas/CitasScreen";

const DashboardScreen = () => {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const userEmail = user.email;

        // Buscar el nombre
        const { data: usuarioData, error: usuarioError } = await supabase
          .from("vta_usuarios")
          .select("Nombre")
          .eq("Email", userEmail)
          .single();

        if (!usuarioError && usuarioData) {
          setNombre(usuarioData.Nombre);
        } else {
          setNombre("Usuario");
        }
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="flex w-full h-screen overflow-hidden overflow-y-auto">
      <main className="flex-1 bg-gray-100 relative">
        <h1 className="sticky top-0 z-10 bg-gray-100 sm:text-3xl sm:text-left text-2xl text-center font-bold py-4 mb-4 sm:p-6 p-2">
          ¡Bienvenido {nombre}!
        </h1>

        <CitasScreen />
      </main>
    </div>
  );
};

export default DashboardScreen;
