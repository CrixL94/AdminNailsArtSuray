import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { supabase } from "../../../supabaseClient";
import { useForm } from "../../../Hooks/useForm";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import Loading from "../../../Components/Loader";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { toastShow } from "../../../Services/ToastService";

const ServiciosCRUD = ({
  visible,
  onHide,
  editar = null,
  filesData,
  getInfo,
}: {
  visible: boolean;
  onHide: () => void;
  editar?: any;
  filesData: any;
  getInfo: () => void;
}) => {
  const toast = useRef<Toast>(null!);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editando = !!editar;

  const [estados, setEstados] = useState<{ label: string; value: number }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchEstados = async () => {
    const { data } = await supabase
      .from("Estados")
      .select("IdEstado, NombreEstado");

    const estadosFiltrados = (data || []).filter((estado: any) =>
      [1, 2].includes(estado.IdEstado)
    );

    setEstados(
      estadosFiltrados.map((e: any) => ({
        label: e.NombreEstado,
        value: e.IdEstado,
      }))
    );
  };

  const initialValues = {
    nombre: "",
    descripcion: "",
    imagen_url: "",
    id_estado: 1,
  };

  const { values, handleInputChange, resetForm, setValues, setError, error } =
    useForm(initialValues);

  const validarDatos = () => {
    let isValid = true;
    let errores: Record<string, boolean> = {};

    if (!values.nombre.trim()) {
      errores.nombre = true;
      isValid = false;
    }

    if (!values.descripcion.trim()) {
      errores.descripcion = true;
      isValid = false;
    }

    // if (!values.imagen_url) {
    //   errores.imagen_url = true;
    //   isValid = false;
    // }

    if (!values.id_estado) {
      errores.IdEstado = true;
      isValid = false;
    }

    setError(errores);

    return isValid;
  };

  const guardarRegistro = async () => {
    if (!validarDatos()) {
      toastShow(
        toast,
        "error",
        "Error de validación",
        "Por favor completa todos los campos requeridos",
        3000
      );
      return;
    }

    setLoading(true);

    try {
      let imgNombre = values.imagen_url?.split("/").pop();

      // Subir imagen si hay una nueva seleccionada
      if (selectedFile) {
        const nuevoNombre = `${selectedFile.name}`;
        const rutaAnterior = `Servicios/${values.imagen_url}`;
        const nuevaRuta = `Servicios/${nuevoNombre}`;

        if (
          editando &&
          values.imagen_url &&
          values.imagen_url === nuevoNombre
        ) {
          const { error: removeError } = await supabase.storage
            .from("imagenes")
            .remove([rutaAnterior]);

          if (removeError) {
            toastShow(
              toast,
              "error",
              "Error al eliminar imagen previa",
              removeError.message,
              3000
            );
            setLoading(false);
            return;
          }
        }

        // Subir nueva imagen
        const { error: uploadError } = await supabase.storage
          .from("imagenes")
          .upload(nuevaRuta, selectedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          toastShow(
            toast,
            "error",
            "Error al subir imagen",
            uploadError.message,
            3000
          );
          setLoading(false);
          return;
        }

        imgNombre = nuevoNombre;
      }

      const { nombre, descripcion, id_estado } = values;
      let supabaseResponse;
      if (editando) {
        supabaseResponse = await supabase
          .from("servicios")
          .update({
            nombre,
            descripcion,
            imagen_url: imgNombre,
            id_estado,
          })
          .eq("id", editar.id);
      } else {
        supabaseResponse = await supabase.from("servicios").insert([
          {
            nombre,
            descripcion,
            imagen_url: imgNombre,
            id_estado,
          },
        ]);
      }

      if (supabaseResponse.error) {
        toastShow(
          toast,
          "error",
          editando ? "Error al actualizar" : "Error al crear",
          supabaseResponse.error.message,
          3000
        );
        setLoading(false);
        return;
      }

      toastShow(
        toast,
        "success",
        editando ? "Actualización" : "Creación",
        editando
          ? "Registro actualizado exitosamente"
          : "Registro creado exitosamente",
        3000
      );

      setTimeout(() => {
        getInfo();
        cerrarDialog();
      }, 1000);
    } catch (error: any) {
      toastShow(toast, "error", "Error inesperado", error.message, 3000);
    }

    setLoading(false);
  };

  const cerrarDialog = () => {
    resetForm();
    setError({});
    setSelectedFile(null);
    onHide();
  };

  useEffect(() => {
    fetchEstados();
  }, []);

  useEffect(() => {
    if (visible) {
      if (editar) {
        const url = editar.imagen_url;
        const nombre = url ? url.split("/").pop() : "";

        setValues({
          nombre: editar.nombre || "",
          descripcion: editar.descripcion || "",
          imagen_url: nombre || "",
          id_estado: editar.id_estado || 1,
        });
      } else {
        resetForm();
      }
    }
  }, [visible]);
  
  return (
    <div>
      <Toast ref={toast} />
      <Dialog
        header={editando ? "Editar Servicio" : "Nuevo Servicio"}
        visible={visible}
        className="sm:w-1/2 w-full sm:p-0 p-2"
        modal
        onHide={() => {
          cerrarDialog();
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={cerrarDialog}
              className="text-gray-700 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={guardarRegistro}
              className="text-pink-600 hover:text-pink-600"
            >
              {editando ? "Actualizar" : "Guardar"}
            </button>
          </div>
        }
      >
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-50 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <Loading loading={loading} />
              </div>
            </div>
          )}

          <form className="sm:flex sm:flex-wrap flex-col w-full gap-4 mt-4">
            <div className="sm:flex gap-3 mb-4">
              <div className="sm:w-1/2 w-full">
                <label htmlFor="nombre" className="font-bold block mb-2">
                  Nombre Servicio
                </label>
                <InputText
                  id="nombre"
                  name="nombre"
                  value={values?.nombre}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.nombre && (
                  <small className="p-error">Titulo es requerido</small>
                )}
              </div>

              <div className="sm:w-1/2 sm:mt-0 mt-4 w-full">
                <label htmlFor="id_estado" className="font-bold block mb-2">
                  Estado
                </label>
                <Dropdown
                  id="id_estado"
                  name="id_estado"
                  value={values?.id_estado}
                  options={estados}
                  onChange={handleInputChange}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecciona un estado"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-auto">
                <label htmlFor="nombre" className="font-bold block mb-2">
                  Descripción
                </label>
                <InputTextarea
                  id="descripcion"
                  name="descripcion"
                  value={values?.descripcion}
                  onChange={handleInputChange}
                  className="w-full"
                  rows={5}
                  cols={30}
                />
                {error.descripcion && (
                  <small className="p-error">Descripcion es requerido</small>
                )}
              </div>
            </div>

            <div className="sm:w-1/2 w-full">
              <label
                htmlFor="img_url_fondo"
                className="font-bold block mb-2 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Imagen (haz clic en la imagen para cambiar)
              </label>

              {/* input oculto */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
                className="hidden"
              />

              {selectedFile || values.imagen_url ? (
                <img
                  src={
                    selectedFile
                      ? URL.createObjectURL(selectedFile)
                      : filesData.find(
                          (img: any) => img.nombre === values.imagen_url
                        )?.url
                  }
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 rounded shadow-md w-full object-cover cursor-pointer hover:opacity-80 transition-opacity duration-200"
                />
              ) : (
                <div
                  className="mt-2 rounded shadow-md w-full h-48 bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="pi pi-image text-4xl text-gray-500"></i>
                </div>
              )}
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default ServiciosCRUD;
