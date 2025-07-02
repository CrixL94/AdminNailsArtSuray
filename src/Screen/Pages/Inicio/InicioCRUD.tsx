import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { supabase } from "../../../supabaseClient";
import { useForm } from "../../../Hooks/useForm";
import { Dialog } from "primereact/dialog";
import { toastShow } from "../../../Services/ToastService";
import Loading from "../../../Components/Loader";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";

const InicioCRUD = ({
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
    setEstados(
      data
        ? data.map((e: any) => ({ label: e.NombreEstado, value: e.IdEstado }))
        : []
    );
  };

  const initialValues = {
    titulo: "",
    subtitulo: "",
    resumen: "",
    imagen_url_fondo: "",
    id_estado: 1,
    label_boton: "",
    label_atencion: "",
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

    if (!values.resumen.trim()) {
      errores.resumen = true;
      isValid = false;
    }

    if (!values.label_atencion.trim()) {
      errores.label_atencion = true;
      isValid = false;
    }

    if (!values.label_boton.trim()) {
      errores.label_boton = true;
      isValid = false;
    }

    if (!values.imagen_url_fondo) {
      errores.imagen_url_fondo = true;
      isValid = false;
    }

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
      let imgNombre = values.imagen_url_fondo?.split("/").pop();

      // Subir imagen si hay una nueva seleccionada
      if (selectedFile) {
        // Eliminar imagen anterior si estamos editando
        if (editando && values.imagen_url_fondo) {
          await supabase.storage
            .from("imagenes")
            .remove([`inicio_web/${values.imagen_url_fondo}`]);
        }

        // Subir nueva imagen
        const nuevoNombre = `${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("imagenes/inicio_web")
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

      const {
        titulo,
        subtitulo,
        resumen,
        id_estado,
        label_boton,
        label_atencion,
      } = values;

      let supabaseResponse;
      // UPDATE
      supabaseResponse = await supabase
        .from("InicioWeb")
        .update({
          titulo,
          subtitulo,
          resumen,
          imagen_url_fondo: imgNombre,
          id_estado,
          label_boton,
          label_atencion,
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
    fetchEstados();
  }, []);

  useEffect(() => {
    if (visible) {
      if (editar) {
        const url = editar.imagen_url_fondo;
        const nombre = url ? url.split("/").pop() : "";

        setValues({
          titulo: editar.titulo || "",
          subtitulo: editar.subtitulo || "",
          resumen: editar.resumen || "",
          imagen_url_fondo: nombre || "",
          id_estado: editar.id_estado || 1,
          label_boton: editar.label_boton || "",
          label_atencion: editar.label_atencion || "",
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
                <label htmlFor="label_boton" className="font-bold block mb-2">
                  Texto Boton
                </label>
                <InputText
                  id="label_boton"
                  name="label_boton"
                  value={values?.label_boton}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.label_boton && (
                  <small className="p-error">Texto Boton es requerido</small>
                )}
              </div>

              <div className="flex-auto">
                <label htmlFor="label_atencion" className="font-bold block mb-2">
                  Texto Atencion
                </label>
                <InputText
                  id="label_atencion"
                  name="label_atencion"
                  value={values?.label_atencion}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.label_atencion && (
                  <small className="p-error">Texto Atencion es requerido</small>
                )}
              </div>
            </div>

            <div className="sm:flex gap-3 mb-4">
              <div className="sm:w-1/2 w-full">
                <label htmlFor="Email" className="font-bold block mb-2">
                  Resumen
                </label>
                <InputTextarea
                  id="resumen"
                  name="resumen"
                  value={values?.resumen}
                  onChange={handleInputChange}
                  className="w-full"
                  rows={5}
                  cols={30}
                />
                {error.resumen && (
                  <small className="p-error">Resumen es requerido</small>
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

              {(selectedFile || values.imagen_url_fondo) && (
                <img
                  src={
                    selectedFile
                      ? URL.createObjectURL(selectedFile)
                      : filesData.find(
                          (img: any) => img.nombre === values.imagen_url_fondo
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

export default InicioCRUD;
