import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "primereact/sidebar";
import { supabase } from "../supabaseClient";
import Logo from "../Components/Logo";

const URL_SITIO = "https://nailsartsuray.vercel.app/";

const SECCIONES = [
  {
    titulo: "Agenda",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: "pi pi-th-large" },
      { to: "/citas", label: "Citas", icon: "pi pi-calendar" },
      { to: "/mensajes", label: "Mensajes", icon: "pi pi-comments" },
      { to: "/testimonios", label: "Testimonios", icon: "pi pi-star" },
    ],
  },
  {
    titulo: "Sitio web",
    links: [
      { to: "/inicio", label: "Inicio", icon: "pi pi-home" },
      { to: "/aboutUs", label: "Sobre nosotros", icon: "pi pi-heart" },
      { to: "/servicios", label: "Servicios", icon: "pi pi-sparkles" },
      { to: "/detalles/servicios", label: "Detalle de servicios", icon: "pi pi-list-check" },
      { to: "/galeria", label: "Galería", icon: "pi pi-images" },
    ],
  },
  {
    titulo: "Administración",
    links: [{ to: "/usuarios", label: "Usuarios", icon: "pi pi-users" }],
  },
];

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState({ nombre: "", email: "" });
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const fetchUsuario = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data } = await supabase
        .from("vta_usuarios")
        .select("Nombre")
        .eq("Email", user.email)
        .single();

      setUsuario({ nombre: data?.Nombre ?? "Usuario", email: user.email });
    };
    fetchUsuario();
  }, []);

  // Al cambiar de pantalla: cerrar el menú móvil y volver arriba
  useEffect(() => {
    setSidebarOpen(false);
    document.querySelector(".admin-scroll")?.scrollTo({ top: 0 });
  }, [pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-brand-600 text-white shadow-soft"
        : "text-ink-600 hover:bg-brand-50 hover:text-brand-700"
    }`;

  const navegacion = (
    // min-h-0: permite que la lista se encoja y haga scroll, dejando
    // siempre visible la tarjeta de usuario (con Cerrar sesión) abajo
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <nav className="nav-scroll min-h-0 flex-1 space-y-7 overflow-y-auto pr-1" aria-label="Principal">
        {SECCIONES.map((seccion) => (
          <div key={seccion.titulo}>
            <p className="mb-2 px-3 text-[0.68rem] font-medium tracking-[0.22em] text-ink-400 uppercase">
              {seccion.titulo}
            </p>
            <div className="space-y-1">
              {seccion.links.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass}>
                  {({ isActive }) => (
                    <>
                      <i
                        className={`${link.icon} text-[0.95rem] ${
                          isActive ? "text-white" : "text-brand-400 group-hover:text-brand-600"
                        }`}
                      />
                      {link.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <a
          href={URL_SITIO}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
        >
          <i className="pi pi-external-link text-[0.95rem] text-brand-400" />
          Ver sitio web
        </a>
      </nav>

      {/* Usuario */}
      <div className="mt-4 shrink-0 rounded-2xl bg-white p-3 ring-1 ring-brand-100">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
            {iniciales(usuario.nombre) || <i className="pi pi-user" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-800">
              {usuario.nombre || "…"}
            </p>
            <p className="truncate text-xs text-ink-400">{usuario.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <i className="pi pi-sign-out" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      {/* Barra lateral (escritorio) */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-brand-100 bg-sand/60 px-5 py-6 lg:flex">
        <NavLink to="/dashboard" className="mb-6 flex shrink-0 items-center gap-3 px-2" aria-label="Ir al dashboard">
          <Logo className="w-16" />
          <span className="border-l border-brand-200 pl-3 text-[0.68rem] font-medium tracking-[0.22em] text-brand-600 uppercase">
            Panel
          </span>
        </NavLink>
        {navegacion}
      </aside>

      {/* Menú lateral (móvil y tablet) */}
      <Sidebar
        visible={sidebarOpen}
        position="left"
        onHide={() => setSidebarOpen(false)}
        className="w-[85vw] max-w-xs"
        blockScroll
        header={<Logo className="w-14" />}
      >
        {navegacion}
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior (móvil y tablet) */}
        <header className="flex items-center justify-between border-b border-brand-100 bg-cream/90 px-4 py-2 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink-800 transition hover:bg-brand-50"
            aria-label="Abrir menú"
          >
            <i className="pi pi-bars text-lg" />
          </button>
          <Logo className="w-14" />
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
            {iniciales(usuario.nombre) || <i className="pi pi-user" />}
          </span>
        </header>

        {/* Contenido principal */}
        <main className="admin-scroll flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
