import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import Loading from "../../Components/Loader";
import { Badge } from "primereact/badge";
import { Menu } from "primereact/menu";
import { TriStateCheckbox } from "primereact/tristatecheckbox";
import { listarUrlsPublicas } from "../../Services/Funciones";
import { Image } from "primereact/image";

const InicioScreen = () => {
  const toast = useRef<Toast>(null!);
  const menuRef = useRef<Menu[]>([]);

  const [inicioData, setInicioData] = useState<any>([]);
  const [filesData, setFilesData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<any>(null);
  const [value, setValue] = useState(null);

  const fetchInicioData = async () => {
    setLoading(true);
    const { data } = await supabase.from("vta_inicio_web").select("*");
    setInicioData(data);
    cargarImagenes();
    setLoading(false);
  };

  const abrirDialog = (info?: any) => {
    setUsuarioEditar(info ?? null);
    setDialogVisible(true);
  };

  const cargarImagenes = async () => {
    const nombresDeArchivo = inicioData
      .flatMap((item: any) => [
        item.imagen_url_fondo,
        item.imagen_url_,
        item.video_url,
      ])
      .filter(Boolean);

    const urls = await listarUrlsPublicas("imagenes", "inicio_web");

    const urlsFiltradas = urls.filter((url) => nombresDeArchivo.some((nombre: any) => url.includes(nombre))).map((url) => {
        const nombre = url.split("/").pop();
        return { nombre, url };
    });
    setFilesData(urlsFiltradas);
  };

  const getActionItems = (info: any) => {
    const items = [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        command: () => abrirDialog(info),
      },
    ];
    return items;
  };

  useEffect(() => {
    fetchInicioData();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Toast ref={toast} />
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Página de Inicio</h1>
          <Button
            icon="pi pi-sync"
            rounded
            aria-label="Filter"
            onClick={() => fetchInicioData()}
          />
          <Button
            icon="pi pi-plus"
            rounded
            severity="success"
            // onClick={() => abrirDialog()}
          />
        </div>
        <div className="bg-white rounded shadow sm:h-[52rem]">
          {loading ? (
            <Loading loading={loading} />
          ) : (
            <>
              <div className="flex flex-wrap gap-4 sm:h-[49rem] h-[35rem]">
                {inicioData.map((inicio: any, index: any) => (
                  <div key={inicio.id} className="relative w-full">
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <TriStateCheckbox
                        value={value}
                        // onChange={(e) => setValue(e.value)}
                      />
                      <Badge
                        value={inicio.NombreEstado}
                        className="text-white text-xs"
                        style={{ backgroundColor: inicio.ColorFondo || "#999" }}
                      />
                      <Button
                        icon="pi pi-ellipsis-v"
                        className="p-button-text p-button-sm"
                        style={{ color: "gray" }}
                        onClick={(e) => menuRef.current[index]?.toggle(e)}
                      />
                      <Menu
                        model={getActionItems(inicio)}
                        popup
                        ref={(el) => {
                          menuRef.current[index] = el!;
                        }}
                      />
                    </div>

                    <div
                      className="w-full h-full mt-12 relative bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${inicio.imagen_url_fondo})`,
                      }}
                    >
                      <div className="relative z-10 p-6 text-white flex flex-col justify-center items-center h-full bg-[rgba(0,0,0,0.5)] bg-opacity-40">
                        <h1 className="sm:text-8xl text-4xl font-bold">
                          {inicio.titulo}
                        </h1>
                        <h2 className="sm:text-4xl text-xl mt-2 text-center">
                          {inicio.subtitulo}
                        </h2>
                        <p className="mt-4 sm:text-3xl text-center">
                          {inicio.resumen}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default InicioScreen;
