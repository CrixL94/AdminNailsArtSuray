import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { prepararImagen } from "../../../Services/Funciones";
import Loading from "../../../Components/Loader";

// Máximo de fotos en la galería; al pasarlo se borran las más antiguas
export const MAX_FOTOS_GALERIA = 70;
// Fotos que se comprimen y suben al mismo tiempo
const SUBIDAS_SIMULTANEAS = 3;

interface FileData {
  nombre: string;
  url: string;
  created_at?: string;
}

interface Props {
  visible: boolean;
  onHide: () => void;
  onUploaded: () => void;
  filesData: FileData[];
}

const UploadDialog = ({ visible, onHide, onUploaded, filesData }: Props) => {
  const toast = useRef<Toast>(null!);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progreso, setProgreso] = useState({ hechas: 0, total: 0 });

  // Una URL de vista previa por foto; se liberan al cambiar la selección
  const previews = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles]
  );
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => {
        const todas = [...prev, ...newFiles];
        if (todas.length > MAX_FOTOS_GALERIA) {
          toast.current?.show({
            severity: "warn",
            summary: "Demasiadas fotos",
            detail: `Puedes subir hasta ${MAX_FOTOS_GALERIA} a la vez; se tomaron las primeras ${MAX_FOTOS_GALERIA}.`,
            life: 4000,
          });
        }
        return todas.slice(0, MAX_FOTOS_GALERIA);
      });
    }
    // Permite volver a elegir el mismo archivo después de quitarlo
    e.target.value = "";
  };

  // Comprime y sube una foto; devuelve true si se subió
  const subirFoto = async (file: File) => {
    try {
      // Comprimida a WebP y con nombre único (evita reemplazar otra foto con el mismo nombre)
      const { archivo, nombre } = await prepararImagen(file);
      const { error } = await supabase.storage
        .from("galeria")
        .upload(nombre, archivo, { cacheControl: "31536000", upsert: true });
      return !error;
    } catch {
      return false;
    } finally {
      setProgreso((p) => ({ ...p, hechas: p.hechas + 1 }));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProgreso({ hechas: 0, total: selectedFiles.length });

    try {
      // 1) Subir primero, de a varias a la vez
      const fallidas: string[] = [];
      for (let i = 0; i < selectedFiles.length; i += SUBIDAS_SIMULTANEAS) {
        const lote = selectedFiles.slice(i, i + SUBIDAS_SIMULTANEAS);
        const resultados = await Promise.all(lote.map(subirFoto));
        resultados.forEach((ok, j) => {
          if (!ok) fallidas.push(lote[j].name);
        });
      }
      const subidas = selectedFiles.length - fallidas.length;

      // 2) Después borrar las más antiguas que sobren, solo según lo que sí se subió.
      //    Así, si la subida falla, no se pierde ninguna foto existente.
      const sobran = filesData.length + subidas - MAX_FOTOS_GALERIA;
      if (sobran > 0) {
        const nombres = [...filesData]
          .sort(
            (a, b) =>
              new Date(a.created_at ?? 0).getTime() -
              new Date(b.created_at ?? 0).getTime()
          )
          .slice(0, sobran)
          .map((f) => f.nombre);

        const { error: errorBorrado } = await supabase.storage
          .from("galeria")
          .remove(nombres);

        toast.current?.show(
          errorBorrado
            ? {
                severity: "error",
                summary: "Error",
                detail: "No se pudieron eliminar las imágenes antiguas",
                life: 4000,
              }
            : {
                severity: "warn",
                summary: "Espacio liberado",
                detail: `Se eliminaron ${sobran} imagen(es) antigua(s) para mantener ${MAX_FOTOS_GALERIA}`,
                life: 4000,
              }
        );
      }

      if (fallidas.length > 0) {
        toast.current?.show({
          severity: "error",
          summary: `No se pudieron subir ${fallidas.length} imagen(es)`,
          detail: fallidas.join(", "),
          life: 6000,
        });
      }

      if (subidas > 0) {
        toast.current?.show({
          severity: "success",
          summary: "Subida completada",
          detail: `${subidas} imagen(es) subidas correctamente`,
          life: 3000,
        });
      }

      // Si alguna falló, se dejan seleccionadas solo esas para reintentar
      setSelectedFiles(selectedFiles.filter((f) => fallidas.includes(f.name)));
      if (fallidas.length === 0) onHide();
      onUploaded();
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Error inesperado",
        detail: "No se pudo subir las imágenes",
        life: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  const cerrarDialog = () => {
    setSelectedFiles([]);
    onHide();
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header="Subir fotos"
        visible={visible}
        onHide={() => {
          setSelectedFiles([]);
          onHide();
        }}
        className="w-[94vw] max-w-2xl"
        blockScroll
        draggable={false}
        modal
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={cerrarDialog}
              type="button"
              className="btn-ghost"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              type="button"
              className="btn-primary"
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? "Subiendo..." : "Agregar y subir"}
            </button>
          </div>
        }
      >
        {uploading ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full py-6">
            <Loading loading={uploading} />
            <p className="text-sm text-ink-500">
              Subiendo {Math.min(progreso.hechas + 1, progreso.total)} de {progreso.total}…
            </p>
            <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full bg-brand-600 transition-all duration-300"
                style={{ width: `${progreso.total ? (progreso.hechas / progreso.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* input oculto */}
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={onFileChange}
              className="hidden"
            />

            {selectedFiles.length > 0 && (
              <p className="mb-2 text-sm text-ink-500">
                {selectedFiles.length} de {MAX_FOTOS_GALERIA} foto(s) seleccionada(s) · haz clic en el recuadro para agregar más
              </p>
            )}

            {/* vista previa o selector */}
            <div
              className={`mt-2 min-h-48 max-h-[60vh] w-full cursor-pointer overflow-y-auto rounded-2xl border-2 border-dashed border-brand-200 bg-white p-4 transition hover:border-brand-400 ${
                selectedFiles.length > 0
                  ? "grid grid-cols-3 sm:grid-cols-5 gap-3 content-start"
                  : "flex justify-center items-center"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFiles.length > 0 ? (
                selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={previews[idx]}
                      alt={file.name}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                    {/* Botón para eliminar imagen */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedFiles = [...selectedFiles];
                        updatedFiles.splice(idx, 1);
                        setSelectedFiles(updatedFiles);
                      }}
                      className="absolute top-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/95 text-xs text-red-600 shadow-soft hover:bg-red-600 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-brand-400">
                  <i className="pi pi-image text-4xl mb-2"></i>
                  <p className="text-sm">Haz clic para seleccionar imágenes</p>
                </div>
              )}
            </div>
          </>
        )}
      </Dialog>
    </>
  );
};

export default UploadDialog;
