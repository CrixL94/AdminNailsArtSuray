import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Sidebar } from "primereact/sidebar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-2 py-1 rounded ${
    isActive ? 'text-blue-600 font-bold' : 'text-gray-600'
  } hover:text-blue-600`;


  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-md p-4 justify-between">
        <div>
          <h2 className="text-xl font-bold mb-6 text-center">NAILS ART SURAY</h2>
          <nav className="space-y-3">
            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
            <NavLink to="/usuarios" className={navLinkClass}>Usuarios</NavLink>
            <NavLink to="/inicio" className={navLinkClass}>Inicio</NavLink>

            {/* <a href="/sobre-nosotros" className="block hover:text-blue-600">Sobre Nosotros</a>
            <a href="/servicios" className="block hover:text-blue-600">Servicios</a>
            <a href="/promociones" className="block hover:text-blue-600">Promociones</a>
            <a href="/galeria" className="block hover:text-blue-600">Galería</a>
            <a href="/testimonios" className="block hover:text-blue-600">Testimonios</a>
            <a href="/contacto" className="block hover:text-blue-600">Contacto</a> */}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Sidebar móvil */}
      <Sidebar visible={sidebarOpen} onHide={() => setSidebarOpen(false)} className="w-64">
        <div className="flex flex-col justify-between h-full">
          <div>
            <h2 className="text-xl font-bold mb-6 text-center sm:mt-10">NAILS ART SURAY</h2>
            <nav className="space-y-3">
              <NavLink to="/dashboard" className={navLinkClass} onClick={() => setSidebarOpen(false)}>Dashboard</NavLink>
              <NavLink to="/usuarios" className={navLinkClass} onClick={() => setSidebarOpen(false)}>Usuarios</NavLink>
              <NavLink to="/inicio" className={navLinkClass} onClick={() => setSidebarOpen(false)}>Inicio</NavLink>

              {/* <a href="/sobre-nosotros" className="block hover:text-blue-600">Sobre Nosotros</a>
              <a href="/servicios" className="block hover:text-blue-600">Servicios</a>
              <a href="/promociones" className="block hover:text-blue-600">Promociones</a>
              <a href="/galeria" className="block hover:text-blue-600">Galería</a>
              <a href="/testimonios" className="block hover:text-blue-600">Testimonios</a>
              <a href="/contacto" className="block hover:text-blue-600">Contacto</a> */}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </Sidebar>

      {/* Contenido principal */}
      <main className="flex-1 bg-gray-100 relative">
        {/* Botón menú móvil */}
        <div className="md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl pl-4">
            <i className="pi pi-align-justify" />
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
