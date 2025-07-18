import { useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Sidebar } from "primereact/sidebar";
import { Divider } from "primereact/divider";
import { Menu } from "primereact/menu";
import { Button } from "primereact/button";

const AdminLayout = () => {
  const menuPages = useRef<Menu>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-2 py-1 rounded ${
      isActive ? "text-blue-600 font-bold" : "text-gray-600"
    } hover:text-blue-600`;

  const pagesItems = [
    {
      label: "Inicio",
      icon: "pi pi-home",
      command: () => {
        setSidebarOpen(false);
        navigate("/inicio");
      },
    },
    {
      label: "Sobre Nosotros",
      icon: "pi pi-objects-column",
      command: () => {
        setSidebarOpen(false);
        navigate("/aboutUs");
      },
    },
    {
      label: "Servicios",
      icon: "pi pi-list",
      command: () => {
        setSidebarOpen(false);
        navigate("/servicios");
      },
    },
    {
      label: "Detalle Servicios",
      icon: "pi pi-list-check",
      command: () => {
        setSidebarOpen(false);
        navigate("detalles/servicios");
      },
    },
    {
      label: "Galería",
      icon: "pi pi-images",
      command: () => {
        setSidebarOpen(false);
        navigate("galeria");
      },
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-md p-4 justify-between">
        <div>
          <h2 className="text-xl font-bold mb-6 text-center">
            NAILS ART SURAY
          </h2>
          <nav className="space-y-3">
            <NavLink to="/dashboard" className={navLinkClass}>
              <i className="pi pi-home mr-2" /> Dashboard
            </NavLink>
            <Divider />
            <NavLink to="/usuarios" className={navLinkClass}>
              <i className="pi pi-users mr-2" /> Usuarios
            </NavLink>
            <NavLink to="/mensajes" className={navLinkClass}>
              <i className="pi pi-comments mr-2" /> Mensajes
            </NavLink>
            <NavLink to="/testimonios" className={navLinkClass}>
              <i className="pi pi-list mr-2" /> Testimonios
            </NavLink>
            <Divider />
            <Button
              className="w-full flex items-center justify-between p-2"
              onClick={(e) => menuPages.current?.toggle(e)}
              text
            >
              <span className="flex items-center gap-2">
                <i className="pi pi-folder" />
                Páginas
              </span>
              <i className="pi pi-chevron-down" />
            </Button>

            <Menu model={pagesItems} popup ref={menuPages} />
            <Divider />
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
      <Sidebar
        visible={sidebarOpen}
        position="right"
        onHide={() => setSidebarOpen(false)}
        className="w-64"
      >
        <div className="flex flex-col justify-between h-full">
          <div>
            <h2 className="text-xl font-bold mb-6 text-center sm:mt-10">
              NAILS ART SURAY
            </h2>
            <nav className="space-y-3">
              <NavLink
                to="/dashboard"
                className={navLinkClass}
                onClick={() => setSidebarOpen(false)}
              >
                <i className="pi pi-home mr-2" /> Dashboard
              </NavLink>
              <Divider />
              <NavLink
                to="/usuarios"
                className={navLinkClass}
                onClick={() => setSidebarOpen(false)}
              >
                <i className="pi pi-users mr-2" /> Usuarios
              </NavLink>
              <Divider />
              <NavLink
                to="/mensajes"
                className={navLinkClass}
                onClick={() => setSidebarOpen(false)}
              >
                <i className="pi pi-comments mr-2" /> Mensajes
              </NavLink>
              <Divider />
              <NavLink
                to="/testimonios"
                className={navLinkClass}
                onClick={() => setSidebarOpen(false)}
              >
                <i className="pi pi-list mr-2" /> Testimonios
              </NavLink>
              <Divider />
              <Button
                className="w-full flex items-center justify-between p-2"
                onClick={(e) => menuPages.current?.toggle(e)}
                text
              >
                <span className="flex items-center gap-2">
                  <i className="pi pi-folder" />
                  Páginas
                </span>
                <i className="pi pi-chevron-down" />
              </Button>

              <Menu model={pagesItems} popup ref={menuPages} />
              <Divider />
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
        <div className="flex justify-end md:hidden pr-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl pl-4"
          >
            <i className="pi pi-align-justify" />
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
