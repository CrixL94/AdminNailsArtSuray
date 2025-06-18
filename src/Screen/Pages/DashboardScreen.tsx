import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const DashboardScreen = () => {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setNombre(user.user_metadata?.nombre || "Usuario");
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="flex w-full h-screen overflow-hidden overflow-y-auto">
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <h1 className="sm:text-3xl sm:text-left text-2xl text-center font-bold mb-4">¡Bienvenido, {nombre}!</h1>
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Resumen</h2>
          <p className="text-sm text-gray-500">
            Agrega aquí tus datos, tablas o widgets.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DashboardScreen;
