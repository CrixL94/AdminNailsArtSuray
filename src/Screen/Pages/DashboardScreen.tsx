import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { formatearDiaMesAno, formatearHoraAMPM } from "../../Services/Funciones";
import PageHeader from "../../Components/PageHeader";
import Loading from "../../Components/Loader";
import EmptyState from "../../Components/EmptyState";

// Estados (tabla "Estados")
const PENDIENTE = 3;

interface Cita {
  idcita: number;
  nombrecompleto: string;
  servicio: string;
  dia: string;
  hora: string;
  idestado: number;
  Estado: string;
}

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fechaLarga = new Intl.DateTimeFormat("es-HN", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

const DashboardScreen = () => {
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [mensajesPendientes, setMensajesPendientes] = useState(0);
  const [testimoniosPendientes, setTestimoniosPendientes] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: usuarioData, error: usuarioError } = await supabase
          .from("vta_usuarios")
          .select("Nombre")
          .eq("Email", user.email)
          .single();

        setNombre(!usuarioError && usuarioData ? usuarioData.Nombre : "");
      }
    };

    const fetchResumen = async () => {
      const [citasRes, mensajesRes, testimoniosRes] = await Promise.all([
        supabase
          .from("vw_citas")
          .select("*")
          .gte("dia", hoyISO())
          .order("dia")
          .order("hora"),
        supabase
          .from("vta_contactos")
          .select("*", { count: "exact", head: true })
          .eq("id_estado", PENDIENTE),
        supabase
          .from("vta_testimonios")
          .select("*", { count: "exact", head: true })
          .eq("idestado", PENDIENTE),
      ]);

      setCitas((citasRes.data as Cita[]) || []);
      setMensajesPendientes(mensajesRes.count ?? 0);
      setTestimoniosPendientes(testimoniosRes.count ?? 0);
      setLoading(false);
    };

    fetchUser();
    fetchResumen();
  }, []);

  const citasHoy = citas.filter((c) => c.dia === hoyISO()).length;
  const citasPorContactar = citas.filter((c) => c.idestado === PENDIENTE).length;

  const tarjetas = [
    { label: "Citas hoy", valor: citasHoy, icon: "pi pi-calendar", to: "/citas" },
    { label: "Citas por contactar", valor: citasPorContactar, icon: "pi pi-whatsapp", to: "/citas", destacar: citasPorContactar > 0 },
    { label: "Mensajes pendientes", valor: mensajesPendientes, icon: "pi pi-comments", to: "/mensajes", destacar: mensajesPendientes > 0 },
    { label: "Testimonios por revisar", valor: testimoniosPendientes, icon: "pi pi-star", to: "/testimonios", destacar: testimoniosPendientes > 0 },
  ];

  return (
    <>
      <PageHeader
        eyebrow={fechaLarga}
        title={nombre ? `Hola, ${nombre.split(" ")[0]}` : "Hola"}
        subtitle="Esto es lo que está pasando en tu estudio."
      />

      {/* Resumen */}
      <section className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className="card-soft group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-6"
          >
            <div className="flex items-start justify-between">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  t.destacar ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600"
                }`}
              >
                <i className={t.icon} />
              </span>
              <i className="pi pi-arrow-up-right text-xs text-ink-300 transition group-hover:text-brand-500" />
            </div>
            <p className="font-display mt-5 text-5xl leading-none text-ink-900 lining-nums">
              {loading ? "–" : t.valor}
            </p>
            <p className="mt-2 text-sm text-ink-500">{t.label}</p>
          </Link>
        ))}
      </section>

      {/* Próximas citas */}
      <section className="card-soft mt-6 overflow-hidden sm:mt-8">
        <div className="flex items-center justify-between gap-4 border-b border-brand-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="heading-md">Próximas citas</h2>
            <p className="text-sm text-ink-500">Desde hoy en adelante</p>
          </div>
          <Link to="/citas" className="btn-ghost px-4 py-2">
            <i className="pi pi-calendar" />
            <span className="hidden sm:inline">Ver calendario</span>
          </Link>
        </div>

        {loading ? (
          <Loading loading />
        ) : citas.length === 0 ? (
          <EmptyState
            icon="pi pi-calendar"
            title="Sin citas próximas"
            text="Cuando alguien reserve desde el sitio web, aparecerá aquí."
          />
        ) : (
          <ul className="divide-y divide-brand-100">
            {citas.slice(0, 8).map((cita) => {
              const [, mes, dia] = cita.dia.split("-");
              return (
                <li key={cita.idcita} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-sand text-brand-700">
                    <span className="font-display text-2xl leading-none lining-nums">{Number(dia)}</span>
                    <span className="text-[0.6rem] tracking-widest uppercase">
                      {new Date(2000, Number(mes) - 1).toLocaleString("es-HN", { month: "short" }).replace(".", "")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-800">{cita.nombrecompleto}</p>
                    <p className="truncate text-sm text-ink-500">
                      {cita.servicio} · {formatearHoraAMPM(cita.hora)}
                    </p>
                    <p className="text-xs text-ink-400 sm:hidden">{formatearDiaMesAno(cita.dia)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      cita.idestado === PENDIENTE
                        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    }`}
                  >
                    {cita.Estado}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
};

export default DashboardScreen;
