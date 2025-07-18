import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { supabase } from "../../../supabaseClient";
import { useForm } from "../../../Hooks/useForm";
import { Dialog } from "primereact/dialog";
import { toastShow } from "../../../Services/ToastService";
import Loading from "../../../Components/Loader";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";

const AboutUsCRUD = ({
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

  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const initialValues = {
    titulo: "",
    subtitulo: "",
    descripcion: "",
    imagen_url: "",
    mision: "",
    vision: "",
  };

  const { values, handleInputChange, resetForm, setValues, setError, error } =
    useForm(initialValues);

  const validarDatos = () => {
    let isValid = true;
    let errores: Record<string, boolean> = {};

    if (!values.titulo.trim()) {
      errores.titulo = true;
      isValid = false;
    }

    if (!values.subtitulo.trim()) {
      errores.subtitulo = true;
      isValid = false;
    }

    if (!values.descripcion.trim()) {
      errores.descripcion = true;
      isValid = false;
    }

    if (!values.mision.trim()) {
      errores.mision = true;
      isValid = false;
    }
    if (!values.vision.trim()) {
      errores.vision = true;
      isValid = false;
    }

    if (!values.imagen_url) {
      errores.imagen_url = true;
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
        // Eliminar imagen anterior si estamos editando
        if (editando && values.imagen_url) {
          await supabase.storage
            .from("imagenes")
            .remove([`About_Us/${values.imagen_url}`]);
        }

        // Subir nueva imagen
        const nuevoNombre = `${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("imagenes/About_Us")
          .upload(nuevoNombre, selectedFile, {
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

      const { titulo, subtitulo, descripcion, mision, vision } = values;

      let supabaseResponse;
      // UPDATE
      supabaseResponse = await supabase
        .from("about_us")
        .update({
          titulo,
          subtitulo,
          descripcion,
          imagen_url: imgNombre,
          mision,
          vision,
        })
        .eq("id", editar.id);

      if (supabaseResponse.error) {
        console.error("Error:", supabaseResponse.error);
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
      setLoading(false);
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
    if (visible) {
      if (editar) {
        const url = editar.imagen_url;
        const nombre = url ? url.split("/").pop() : "";

        setValues({
          titulo: editar.titulo || "",
          subtitulo: editar.subtitulo || "",
          descripcion: editar.descripcion || "",
          imagen_url: nombre || "",
          mision: editar.mision || "",
          vision: editar.vision || "",
        });
      } else {
        resetForm();
      }
    }
  }, [visible]);

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={editando ? "Editar Registro" : "Nuevo Registro"}
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
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-auto">
                <label htmlFor="titulo" className="font-bold block mb-2">
                  Titulo
                </label>
                <InputText
                  id="titulo"
                  name="titulo"
                  value={values?.titulo}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.titulo && (
                  <small className="p-error">Titulo es requerido</small>
                )}
              </div>

              <div className="flex-auto">
                <label htmlFor="subtitulo" className="font-bold block mb-2">
                  Sub Titulo
                </label>
                <InputText
                  id="subtitulo"
                  name="subtitulo"
                  value={values?.subtitulo}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.subtitulo && (
                  <small className="p-error">Sub Titulo es requerido</small>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-auto">
                <label htmlFor="mision" className="font-bold block mb-2">
                  Misión
                </label>
                <InputTextarea
                  id="mision"
                  name="mision"
                  value={values?.mision}
                  onChange={handleInputChange}
                  className="w-full"
                  rows={5}
                  cols={30}
                />
                {error.mision && (
                  <small className="p-error">Misión es requerida</small>
                )}
              </div>

              <div className="flex-auto">
                <label htmlFor="vision" className="font-bold block mb-2">
                  Visión
                </label>
                <InputTextarea
                  id="vision"
                  name="vision"
                  value={values?.vision}
                  onChange={handleInputChange}
                  className="w-full"
                  rows={5}
                  cols={30}
                />
                {error.vision && (
                  <small className="p-error">Visión es requerida</small>
                )}
              </div>
            </div>

            <div className="sm:flex gap-3 mb-4">
              <div className="w-full">
                <label htmlFor="Email" className="font-bold block mb-2">
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
                  <small className="p-error">Descripción es requerida</small>
                )}
              </div>
            </div>

            <div className="sm:w-1/2 w-full">
              <label
                htmlFor="img_url_fondo"
                className="font-bold block mb-2 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Imagen de Fondo (haz clic en la imagen para cambiar)
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

              {(selectedFile || values.imagen_url) && (
                <img
                  src={
                    selectedFile
                      ? URL.createObjectURL(selectedFile)
                      : filesData.find(
                          (img: any) => img.nombre === values.imagen_url
                        )?.url
                  }
                  alt="Vista previa"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 rounded shadow-md w-full object-cover cursor-pointer hover:opacity-80 transition-opacity duration-200"
                />
              )}

              {error.imagen_url_fondo && (
                <small className="p-error">Imagen de fondo es requerida</small>
              )}
            </div>
          </form>
        </div>
      </Dialog>
    </>
  );
};

export default AboutUsCRUD;
