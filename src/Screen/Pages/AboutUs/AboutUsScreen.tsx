import { useEffect, useRef, useState } from "react";
import { Menu } from "primereact/menu";
import { Toast } from "primereact/toast";
import { listarUrlsPublicas } from "../../../Services/Funciones";
import { supabase } from "../../../supabaseClient";
import { Button } from "primereact/button";
import Loading from "../../../Components/Loader";
import { Card } from "primereact/card";
import AboutUsCRUD from "./AboutUsCRUD";

const AboutUsScreen = () => {
  const toast = useRef<Toast>(null!);
  const menuRef = useRef<Menu[]>([]);

  const [inicioData, setInicioData] = useState<any>([]);
  const [filesData, setFilesData] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editar, setEditar] = useState<any>(null);

  const fetchInicioData = async () => {
    setLoading(true);

    const { data, error } = await supabase.from("about_us").select("*");

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

    const urls = await listarUrlsPublicas("imagenes", "About_Us");

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
    (img: any) => img.nombre === inicioData[0].imagen_url
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Toast ref={toast} />
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="sm:text-3xl text-2xl font-bold">
            Página Sobre Nostotros
          </h1>
          <Button
            icon="pi pi-sync"
            rounded
            aria-label="Filter"
            onClick={() => fetchInicioData()}
          />
        </div>
        <div className="bg-white rounded shadow sm:h-[52rem]">
          {loading || !imagenFondo ? (
            <div className="flex items-center justify-center h-screen">
              <Loading loading={loading} />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 sm:h-[49rem] h-[35rem] overflow-y-auto sm:overflow-visible sm:mb-0">
                {inicioData.map((inicio: any, index: any) => (
                  <div key={inicio.id} className="relative w-full">
                    <div className="absolute top-2 right-2 flex items-center gap-2">
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
                      {/* Contenedor scrollable */}
                      <div className="items-center justify-center h-full sm:px-[10rem] sm:mb-0 overflow-y-auto max-h-[46rem] sm:p-8 p-0 space-y-10">
                        {/* Imagen + Descripción */}
                        <div className="flex flex-col md:flex-row items-center justify-center h-full gap-6">
                          <div className="flex-1">
                            <img
                              src={`${imagenFondo?.url}`}
                              alt="Manicura y Pedicura"
                              className="w-full h-full object-cover sm:rounded-xl shadow-lg"
                            />
                          </div>

                          <div className="flex-1 text-center md:text-left sm:p-8 p-4 sm:my-0 my-[7rem]">
                            <h1 className="text-2xl sm:text-6xl font-bold text-purple-600 sm:mb-4 mt-0">
                              {inicio?.titulo}
                            </h1>

                            <p className="sm:text-2xl text-base md:text-lg text-gray-600">
                              <span className="font-semibold sm:text-lg text-base text-purple-500">
                                {inicio?.subtitulo}
                              </span>{" "}
                              {inicio?.descripcion}
                            </p>
                          </div>
                        </div>

                        {/* Misión y Visión */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <Card>
                            <h3 className="text-xl font-semibold mb-2 text-purple-500">
                              Misión
                            </h3>
                            <p>{inicio?.mision}</p>
                          </Card>

                          <Card>
                            <h3 className="text-xl font-semibold mb-2 text-purple-500">
                              Visión
                            </h3>
                            <p>{inicio?.vision}</p>
                          </Card>
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

      <AboutUsCRUD
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        editar={editar}
        filesData={filesData}
        getInfo={fetchInicioData}
      />
    </div>
  );
};

export default AboutUsScreen;
