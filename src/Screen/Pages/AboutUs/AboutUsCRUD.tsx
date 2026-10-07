import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { supabase } from "../../../supabaseClient";
import { prepararImagen } from "../../../Services/Funciones";
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

        // Subir nueva imagen (comprimida a WebP y con nombre único)
        const { archivo, nombre: nuevoNombre } = await prepararImagen(selectedFile);
        const { error: uploadError } = await supabase.storage
          .from("imagenes/About_Us")
          .upload(nuevoNombre, archivo, {
            // El nombre nunca se repite, así que el navegador puede guardarla un año
            cacheControl: "31536000",
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
        header={editando ? "Editar contenido" : "Nuevo contenido"}
        visible={visible}
        className="w-[94vw] max-w-2xl"
        blockScroll
        draggable={false}
        modal
        onHide={() => {
          cerrarDialog();
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={cerrarDialog}
              type="button"
              className="btn-ghost"
            >
              Cancelar
            </button>
            <button
              onClick={guardarRegistro}
              type="button"
              className="btn-primary"
            >
              {editando ? "Actualizar" : "Guardar"}
            </button>
          </div>
        }
      >
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-cream/80 backdrop-blur-sm">
              <div className="text-center">
                <Loading loading={loading} />
              </div>
            </div>
          )}

          <form className="sm:flex sm:flex-wrap flex-col w-full gap-4 mt-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-auto">
                <label htmlFor="titulo" className="field-label">
                  Título
                </label>
                <InputText
                  id="titulo"
                  name="titulo"
                  value={values?.titulo}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.titulo && (
                  <small className="field-error">Titulo es requerido</small>
                )}
              </div>

              <div className="flex-auto">
                <label htmlFor="subtitulo" className="field-label">
                  Subtítulo
                </label>
                <InputText
                  id="subtitulo"
                  name="subtitulo"
                  value={values?.subtitulo}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.subtitulo && (
                  <small className="field-error">Sub Titulo es requerido</small>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-auto">
                <label htmlFor="mision" className="field-label">
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
                  <small className="field-error">Misión es requerida</small>
                )}
              </div>

              <div className="flex-auto">
                <label htmlFor="vision" className="field-label">
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
                  <small className="field-error">Visión es requerida</small>
                )}
              </div>
            </div>

            <div className="sm:flex gap-3 mb-4">
              <div className="w-full">
                <label htmlFor="Email" className="field-label">
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
                  <small className="field-error">Descripción es requerida</small>
                )}
              </div>
            </div>

            <div className="sm:w-1/2 w-full">
              <label
                htmlFor="img_url_fondo"
                className="field-label cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Imagen de fondo · haz clic para cambiarla
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
                  className="mt-2 max-h-72 w-full cursor-pointer rounded-2xl object-cover ring-1 ring-brand-100 transition hover:opacity-90"
                />
              )}

              {error.imagen_url_fondo && (
                <small className="field-error">Imagen de fondo es requerida</small>
              )}
            </div>
          </form>
        </div>
      </Dialog>
    </>
  );
};

export default AboutUsCRUD;
