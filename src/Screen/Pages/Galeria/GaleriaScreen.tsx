import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import Loading from "../../../Components/Loader";
import PageHeader from "../../../Components/PageHeader";
import EmptyState from "../../../Components/EmptyState";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { supabase } from "../../../supabaseClient";
import UploadDialog, { MAX_FOTOS_GALERIA } from "./UploadDialog";

const GaleriaScreen = () => {
  const toast = useRef<Toast>(null!);
  const [loading, setLoading] = useState(true);
  const [filesData, setFilesData] = useState<any[]>([]);
  const [uploadDialogVisible, setUploadDialogVisible] = useState(false);

  const fetchInicioData = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("galeria")
      .list("", { limit: 100, sortBy: { column: "created_at", order: "asc" } });

    if (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al obtener las imágenes",
        life: 3000,
      });
      setLoading(false);
      return;
    }

    // Se ignoran archivos internos de Supabase como ".emptyFolderPlaceholder"
    const urls = await Promise.all(
      data.filter((file) => !file.name.startsWith(".")).map(async (file) => {
        const { data: urlData } = supabase.storage
          .from("galeria")
          .getPublicUrl(file.name);
        return {
          nombre: file.name,
          url: urlData.publicUrl,
          created_at: file.created_at,
        };
      })
    );

    setFilesData(urls);
    setLoading(false);
  };

  const eliminarImagen = async (info: any) => {
    const { error } = await supabase.storage
      .from("galeria")
      .remove([info.nombre]);
    if (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo eliminar la imagen",
        life: 3000,
      });
    } else {
      toast.current?.show({
        severity: "success",
        summary: "Imagen eliminada",
        detail: info.nombre,
        life: 3000,
      });
      fetchInicioData();
    }
  };

  const confirmarEliminarImagen = (info: any) => {
    confirmDialog({
      message: "¿Eliminar esta foto de la galería? Dejará de verse en el sitio.",
      header: "Eliminar foto",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      icon: "pi pi-exclamation-triangle",
      accept: () => eliminarImagen(info),
    });
  };

  useEffect(() => {
    fetchInicioData();
  }, []);

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <PageHeader
        eyebrow="Sitio web"
        title="Galería"
        subtitle={
          loading
            ? "Las fotos de tus trabajos que se muestran en el sitio."
            : `${filesData.length} de ${MAX_FOTOS_GALERIA} fotos · al pasar el límite se borran las más antiguas.`
        }
        actions={
          <>
          <button type="button" className="btn-icon" aria-label="Actualizar" title="Actualizar" onClick={fetchInicioData}>
            <i className="pi pi-sync" />
          </button>
          <button type="button" className="btn-primary" onClick={() => setUploadDialogVisible(true)}>
            <i className="pi pi-upload" />
            Subir fotos
          </button>
          </>
        }
      />

      {loading ? (
        <div className="card-soft">
          <Loading loading={loading} />
        </div>
      ) : filesData.length === 0 ? (
        <div className="card-soft">
          <EmptyState
            icon="pi pi-images"
            title="La galería está vacía"
            text="Sube fotos de tus trabajos para mostrarlas en el sitio."
            action={<button type="button" className="btn-primary" onClick={() => setUploadDialogVisible(true)}><i className="pi pi-upload" />Subir fotos</button>}
          />
        </div>
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {filesData.map((img, index) => (
            <figure
              key={img.nombre ?? index}
              className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-brand-100 shadow-soft"
            >
              <img
                src={img.url}
                alt={img.nombre}
                loading="lazy"
                className="w-full object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-gradient-to-t from-ink-900/60 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Eliminar foto"
                  title="Eliminar foto"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-red-600 shadow-soft transition hover:bg-red-600 hover:text-white"
                  onClick={() => confirmarEliminarImagen(img)}
                >
                  <i className="pi pi-trash text-sm" />
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <UploadDialog
        visible={uploadDialogVisible}
        onHide={() => setUploadDialogVisible(false)}
        onUploaded={fetchInicioData}
        filesData={filesData}
      />
    </>
  );
};

export default GaleriaScreen;
