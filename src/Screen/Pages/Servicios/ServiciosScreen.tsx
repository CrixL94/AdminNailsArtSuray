import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { listarUrlsPublicas } from "../../../Services/Funciones";
import { supabase } from "../../../supabaseClient";
import Loading from "../../../Components/Loader";
import { Badge } from "primereact/badge";
import { Menu } from "primereact/menu";

const ServiciosScreen = () => {
  const toast = useRef<Toast>(null!);
  const menuRef = useRef<Menu[]>([]);

  const [inicioData, setInicioData] = useState<any>([]);
  const [filesData, setFilesData] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  const getInfo = async () => {
    setLoading(true);

    const { data, error } = await supabase.from("vta_servicios").select("*");

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
      .flatMap((item: any) => [item.imagen_url])
      .filter(Boolean);

    const urls = await listarUrlsPublicas("imagenes", "Servicios");

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

  const getActionItems = (info: any) => {
    const items = [
      {
        label: "Editar",
        icon: "pi pi-pencil",
        // command: () => abrirDialog(info),
      },
      {
        label: "Eliminar",
        icon: "pi pi-trash",
        // command: () => eliminarServicio(info),
      },
    ];
    return items;
  };

  useEffect(() => {
    getInfo();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Toast ref={toast} />
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">Servicios</h1>
          <Button
            icon="pi pi-sync"
            rounded
            aria-label="Filter"
            onClick={() => getInfo()}
          />
        </div>

        <div className="sm:bg-white sm:rounded sm:shadow sm:h-[52rem] h-[35rem] sm:p-6 p-0 overflow-y-auto sm:overflow-visible">
          {loading || !filesData ? (
            <div className="flex items-center justify-center h-screen">
              <Loading loading={loading} />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
              {inicioData.map((servicio: any, index: number) => {
                const imagen = filesData.find(
                  (img: any) => img.nombre === servicio.imagen_url
                );

                return (
                  <div
                    key={servicio.id}
                    className="sm:bg-gray-100 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex items-center justify-end p-1">
                      <Badge
                        value={servicio.NombreEstado}
                        className="text-white text-xs"
                        style={{ backgroundColor: servicio.ColorFondo }}
                      />

                      <Button
                        icon="pi pi-ellipsis-v"
                        className="p-button-text p-button-sm"
                        style={{ color: "gray" }}
                        onClick={(e) => menuRef.current[index]?.toggle(e)}
                      />
                      <Menu
                        model={getActionItems(servicio)}
                        popup
                        ref={(el) => {
                          menuRef.current[index] = el!;
                        }}
                      />
                    </div>

                    {/* Imagen */}
                    {imagen && (
                      <img
                        src={imagen.url}
                        alt={servicio.nombre}
                        className="w-full h-48 object-cover"
                      />
                    )}

                    {/* Contenido */}
                    <div className="p-4 flex flex-col justify-between h-full">
                      <div>
                        <h2 className="text-lg font-bold text-purple-600 mb-2">
                          {servicio.nombre}
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">
                          {servicio.descripcion}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ServiciosScreen;
