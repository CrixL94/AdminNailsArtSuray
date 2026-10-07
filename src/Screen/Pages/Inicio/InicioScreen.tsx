import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { Toast } from "primereact/toast";
import Loading from "../../../Components/Loader";
import PageHeader from "../../../Components/PageHeader";
import EmptyState from "../../../Components/EmptyState";
import EstadoBadge from "../../../Components/EstadoBadge";
import { listarUrlsPublicas } from "../../../Services/Funciones";
import InicioCRUD from "./InicioCRUD";

const InicioScreen = () => {
  const toast = useRef<Toast>(null!);

  const [inicioData, setInicioData] = useState<any>([]);
  const [filesData, setFilesData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editar, setEditar] = useState<any>(null);

  const fetchInicioData = async () => {
    setLoading(true);

    const { data, error } = await supabase.from("vta_inicio_web").select("*");

    if (error) {
      setInicioData([]);
      setFilesData([]);
      setLoading(false);
      return;
    }

    if (!data) {
      setInicioData([]);
      setFilesData([]);
      setLoading(false);
      return;
    }
    setInicioData(data);

    const nombresDeArchivo = data
      .flatMap((item: any) => [item.imagen_url_fondo])
      .filter(Boolean);

    const urls = await listarUrlsPublicas("imagenes", "inicio_web");

    const urlsFiltradas = urls
      .filter((url) =>
        nombresDeArchivo.some((nombre: any) => url.includes(nombre))
      )
      .map((url) => {
        const nombre = url.split("/").pop();
        return { nombre, url };
      });

    setFilesData(urlsFiltradas);
    setLoading(false);
  };

  const abrirDialog = (info?: any) => {
    setEditar(info);
    setDialogVisible(true);
  };


  useEffect(() => {
    fetchInicioData();
  }, []);

  const imagenFondo = filesData.find(
    (img: any) => img.nombre === inicioData[0].imagen_url_fondo
  );

  return (
    <>
      <Toast ref={toast} />

      <PageHeader
        eyebrow="Sitio web"
        title="Inicio"
        subtitle="La portada de tu sitio web: lo primero que ven tus clientas."
        actions={
          <>
          <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={() => fetchInicioData()}>
            <i className="pi pi-sync" />
          </button>
          </>
        }
      />

      {loading ? (
        <div className="card-soft">
          <Loading loading={loading} />
        </div>
      ) : inicioData.length === 0 ? (
        <div className="card-soft">
          <EmptyState icon="pi pi-file-edit" title="Sin contenido" text="Aún no hay información para esta sección." />
        </div>
      ) : (
        <div className="space-y-6">
          {inicioData.map((inicio: any) => (
            <article key={inicio.id} className="card-soft overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 px-5 py-3 sm:px-6">
                <span className="flex items-center gap-2 text-xs tracking-[0.2em] text-ink-400 uppercase">
                  <i className="pi pi-eye" />
                  Vista previa
                </span>
                <div className="flex items-center gap-2">
                  {inicio.NombreEstado && (
                    <EstadoBadge nombre={inicio.NombreEstado} color={inicio.ColorFondo} />
                  )}
                  <button type="button" className="btn-primary px-4 py-2" onClick={() => abrirDialog(inicio)}>
                    <i className="pi pi-pencil" />
                    Editar
                  </button>
                </div>
              </div>
              <div className="grid items-center gap-10 bg-cream p-6 sm:p-10 md:grid-cols-[1.2fr_1fr]">
                <div className="text-center md:text-left">
                  <p className="eyebrow mb-4">Nail studio</p>
                  <h2 className="heading-xl">{inicio.titulo}</h2>
                  <p className="mt-4 leading-relaxed text-ink-500">
                    <span className="font-display text-xl text-brand-600 italic">{inicio.subtitulo}</span>{" "}
                    {inicio.resumen}
                  </p>
                  {inicio.label_atencion && (
                    <p className="mt-4 text-sm font-medium text-ink-700">{inicio.label_atencion}</p>
                  )}
                  {inicio.label_boton && (
                    <span className="btn-primary pointer-events-none mt-6">
                      <i className="pi pi-calendar" />
                      {inicio.label_boton}
                    </span>
                  )}
                </div>
                <div className="relative mx-auto w-full max-w-xs">
                  <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-brand-100 shadow-lift">
                    {imagenFondo && (
                      <img src={imagenFondo.url} alt={inicio.titulo} className="h-full w-full object-cover" />
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <InicioCRUD
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        editar={editar}
        filesData={filesData}
        getInfo={fetchInicioData}
      />
    </>
  );
};

export default InicioScreen;
