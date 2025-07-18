import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";
import Loading from "../../../Components/Loader";

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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    try {
      const totalActual = filesData.length;
      const aSubir = selectedFiles.length;
      const totalFinal = totalActual + aSubir;

      if (totalFinal > 12) {
        const cantidadAEliminar = totalFinal - 12;
        const masAntiguas = [...filesData]
          .sort(
            (a, b) =>
              new Date(a.created_at ?? 0).getTime() -
              new Date(b.created_at ?? 0).getTime()
          )
          .slice(0, cantidadAEliminar);

        const nombres = masAntiguas.map((f) => f.nombre);
        const { error: errorBorrado } = await supabase.storage
          .from("galeria")
          .remove(nombres);
        if (errorBorrado) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "No se pudieron eliminar imágenes antiguas",
            life: 3000,
          });
          setUploading(false);
          return;
        }

        toast.current?.show({
          severity: "warn",
          summary: "Espacio liberado",
          detail: `${cantidadAEliminar} imagen(es) antigua(s) eliminada(s)`,
          life: 3000,
        });
      }

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const { error } = await supabase.storage
          .from("galeria")
          .upload(file.name, file, { upsert: true });

        if (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: `No se pudo subir ${file.name}`,
            life: 3000,
          });
        }
      }

      toast.current?.show({
        severity: "success",
        summary: "Subida completada",
        detail: `${selectedFiles.length} imagen(es) subidas correctamente`,
        life: 3000,
      });

      setSelectedFiles([]);
      onHide();
      onUploaded();
    } catch (err) {
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
        header="Subir imágenes"
        visible={visible}
        onHide={() => {
          setSelectedFiles([]);
          onHide();
        }}
        className="sm:w-1/2 w-full sm:p-0 p-2"
        modal
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={cerrarDialog}
              className="text-gray-700 hover:text-gray-800"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              className="text-pink-600 hover:text-pink-600"
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? "Subiendo..." : "Agregar y subir"}
            </button>
          </div>
        }
      >
        {uploading ? (
          <div className="flex items-center justify-center h-full">
            <Loading loading={uploading} />
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

            {/* vista previa o selector */}
            <div
              className="mt-2 rounded shadow-md w-full min-h-48 bg-gray-100 p-4 flex flex-wrap gap-4 justify-center items-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFiles.length > 0 ? (
                selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-40 h-auto object-cover rounded shadow"
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
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
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
