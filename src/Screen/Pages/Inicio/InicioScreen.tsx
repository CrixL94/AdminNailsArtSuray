import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import Loading from "../../../Components/Loader";
import { Badge } from "primereact/badge";
import { Menu } from "primereact/menu";
import { listarUrlsPublicas } from "../../../Services/Funciones";
import InicioCRUD from "./InicioCRUD";

const InicioScreen = () => {
  const toast = useRef<Toast>(null!);
  const menuRef = useRef<Menu[]>([]);

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

  const imagenFondo = filesData.find(
    (img: any) => img.nombre === inicioData[0].imagen_url_fondo
  );

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
        </div>
        <div className="bg-white rounded shadow sm:h-[52rem]">
          {loading || !imagenFondo ? (
            <Loading loading={loading} />
          ) : (
            <>
              <div className="flex flex-wrap gap-4 sm:h-[49rem] h-[35rem] overflow-y-auto sm:overflow-y-visible sm:mb-0">
                {inicioData.map((inicio: any, index: any) => (
                  <div key={inicio.id} className="relative w-full">
                    <div className="absolute top-2 right-2 flex items-center gap-2">
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

                    <div className="w-full h-full mt-12 relative bg-gray-100">
                      <div className="flex flex-col md:flex-row items-center justify-center h-full sm:px-[10rem] sm:mb-0 overflow-y-auto sm:overflow-y-visible">
                        <div className="flex-1 text-center md:text-left sm:p-8 p-4">
                          <h1 className="text-2xl sm:text-6xl font-bold text-pink-600 sm:mb-4 sm:mt-0 mt-[7rem]">
                            {inicio.titulo}
                          </h1>

                          <p className="sm:text-2xl text-base md:text-lg text-gray-600">
                            <span className="font-semibold sm:text-lg text-base text-pink-500">
                              {inicio.subtitulo}
                            </span>
                            <span> </span>
                            {inicio.resumen}
                          </p>

                          <p className="sm:text-2xl text-base md:text-lg text-gray-600 mb-4">
                            <br className="hidden sm:block" />
                            <span className="font-semibold">
                              {inicio.label_atencion}
                            </span>
                          </p>

                          <button className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-full transition duration-300">
                            {inicio.label_boton}
                          </button>
                        </div>
                        <div className="flex-1">
                          <img
                            src={`${imagenFondo?.url}`}
                            alt="Manicura y Pedicura"
                            className="w-full h-full object-cover sm:rounded-xl shadow-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <InicioCRUD
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        editar={editar}
        filesData={filesData}
        getInfo={fetchInicioData}
      />
    </div>
  );
};

export default InicioScreen;
