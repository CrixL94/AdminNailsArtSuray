import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import Loading from "../../../Components/Loader";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { supabase } from "../../../supabaseClient";
import UploadDialog from "./UploadDialog";

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

    const urls = await Promise.all(
      data.map(async (file) => {
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
      message: `¿Estás seguro que deseas eliminar "${info.nombre}"?`,
      header: "Confirmación",
      icon: "pi pi-exclamation-triangle",
      accept: () => eliminarImagen(info),
    });
  };

  useEffect(() => {
    fetchInicioData();
  }, []);

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Galería</h1>
          <Button
            icon="pi pi-sync"
            rounded
            aria-label="Refrescar"
            onClick={fetchInicioData}
          />

          <Button
            icon="pi pi-upload"
            rounded
            severity="success"
            onClick={() => setUploadDialogVisible(true)}
          />
        </div>
        <div className="sm:bg-white sm:rounded sm:shadow h-screen sm:h-[52rem] sm:p-6 p-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loading loading={loading} />
            </div>
          ) : (
            <div className="grid md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-6">
              {filesData.map((img, index) => (
                <div
                  key={index}
                  className="sm:bg-gray-100 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-center justify-between p-1">
                    <h2 className="text-lg font-bold text-purple-600 truncate">
                      {img.nombre}
                    </h2>
                    <Button
                      icon="pi pi-trash"
                      className="p-button-text p-button-sm"
                      style={{ color: "gray" }}
                      onClick={() => confirmarEliminarImagen(img)}
                    />
                  </div>
                  <img
                    src={img.url}
                    alt={img.nombre}
                    className="w-full h-auto object-cover rounded-t-lg"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <UploadDialog
        visible={uploadDialogVisible}
        onHide={() => setUploadDialogVisible(false)}
        onUploaded={fetchInicioData}
        filesData={filesData}
      />
    </div>
  );
};

export default GaleriaScreen;
