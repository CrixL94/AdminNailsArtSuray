import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useForm } from "../../../Hooks/useForm";
import { toastShow } from "../../../Services/ToastService";
import Loading from "../../../Components/Loader";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";

const DetallesServiciosCRUD = ({
  visible,
  onHide,
  editar = null,
  getInfo,
  idServicioPrincipal,
}: {
  visible: boolean;
  onHide: () => void;
  editar?: any;
  getInfo: () => void;
  idServicioPrincipal?: any;
}) => {
  const toast = useRef<Toast>(null!);
  const editando = !!editar;

  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState<{ label: string; value: number }[]>(
    []
  );
  const [servicios, setServicios] = useState<
    { label: string; value: number }[]
  >([]);

  const obtenerInfo = async () => {
    setLoading(true);

    const { data: serviciosData } = await supabase
      .from("servicios")
      .select("id, nombre");

    const { data: estadosData } = await supabase
      .from("Estados")
      .select("IdEstado, NombreEstado");

    const estadosFiltrados = (estadosData || []).filter((estado: any) =>
      [1, 2].includes(estado.IdEstado)
    );

    setEstados(
      estadosFiltrados.map((e: any) => ({
        label: e.NombreEstado,
        value: e.IdEstado,
      }))
    );

    setServicios(
      (serviciosData || []).map((s) => ({
        label: s.nombre,
        value: s.id,
      }))
    );

    setLoading(false);
  };

  const initialValues = {
    id_servicio: "",
    nombre: "",
    descripcion: "",
    precio: "",
    duracion_minutos: "",
    id_estado: 1,
  };

  const { values, handleInputChange, resetForm, setValues, setError, error } =
    useForm(initialValues);

  const validarDatos = () => {
    let isValid = true;
    let errores: Record<string, boolean> = {};

    if (!values.id_servicio) {
      errores.id_servicio = true;
      isValid = false;
    }

    if (!values.nombre.trim()) {
      errores.nombre = true;
      isValid = false;
    }

    if (!values.descripcion.trim()) {
      errores.descripcion = true;
      isValid = false;
    }

    if (!values.precio) {
      errores.precio = true;
      isValid = false;
    }

    if (!values.duracion_minutos) {
      errores.duracion_minutos = true;
      isValid = false;
    }

    if (!values.id_estado) {
      errores.id_estado = true;
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
      const {
        id_servicio,
        nombre,
        descripcion,
        precio,
        duracion_minutos,
        id_estado,
      } = values;
      let supabaseResponse;
      if (editando) {
        supabaseResponse = await supabase
          .from("servicios_detalles")
          .update({
            id_servicio,
            nombre,
            descripcion,
            precio,
            duracion_minutos,
            id_estado,
          })
          .eq("id", editar.id);
      } else {
        supabaseResponse = await supabase.from("servicios_detalles").insert([
          {
            id_servicio,
            nombre,
            descripcion,
            precio,
            duracion_minutos,
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
    onHide();
  };

  useEffect(() => {
    obtenerInfo();
  }, []);

  useEffect(() => {
    if (visible) {
      if (editar) {
        setValues({
          id_servicio: editar.id_servicio || "",
          nombre: editar.nombre || "",
          descripcion: editar.descripcion || "",
          precio: editar.precio || "",
          duracion_minutos: editar.duracion_minutos || "",
          id_estado: editar.id_estado || 1,
        });
      } else {
        resetForm();
        if (idServicioPrincipal) {
          setValues((prevValues) => ({
            ...prevValues,
            id_servicio: idServicioPrincipal,
          }));
        }
      }
    }
  }, [visible, idServicioPrincipal]);

  return (
    <div>
      <Toast ref={toast} />
      <Dialog
        header={editando ? "Editar detalle" : "Nuevo detalle"}
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
            <div className="sm:flex gap-3 mb-4">
              <div className="sm:w-1/2 w-full">
                <label htmlFor="id_servicio" className="field-label">
                  Servicio
                </label>
                <Dropdown
                  id="id_servicio"
                  name="id_servicio"
                  value={values?.id_servicio}
                  options={servicios}
                  onChange={handleInputChange}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecciona un estado"
                  className="w-full"
                />
                {error.id_servicio && (
                  <small className="field-error">Campo es requerido</small>
                )}
              </div>

              <div className="sm:w-1/2 w-full sm:mt-0 mt-4">
                <label htmlFor="nombre" className="field-label">
                  Nombre del detalle
                </label>
                <InputText
                  id="nombre"
                  name="nombre"
                  value={values?.nombre}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.nombre && (
                  <small className="field-error">Detalle es requerido</small>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-auto">
                <label htmlFor="precio" className="field-label">
                  Precio (L.)
                </label>
                <InputText
                  id="precio"
                  name="precio"
                  keyfilter="money"
                  value={values?.precio}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.precio && (
                  <small className="field-error">Costo es requerido</small>
                )}
              </div>
              <div className="flex-auto">
                <label
                  htmlFor="duracion_minutos"
                  className="field-label"
                >
                  Tiempo Estimado (Minutos)
                </label>
                <InputText
                  id="duracion_minutos"
                  name="duracion_minutos"
                  value={values?.duracion_minutos}
                  onChange={handleInputChange}
                  keyfilter="num"
                  className="w-full"
                />
                {error.duracion_minutos && (
                  <small className="field-error">Tiempo es requerido</small>
                )}
              </div>
            </div>

            <div className="sm:flex gap-3 mb-4">
              <div className="sm:w-1/2 w-full">
                <label htmlFor="descripcion" className="field-label">
                  Descripción
                </label>
                <InputTextarea
                  id="descripcion"
                  name="descripcion"
                  value={values?.descripcion}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.descripcion && (
                  <small className="field-error">Campo es requerido</small>
                )}
              </div>

              <div className="sm:w-1/2 sm:mt-0 mt-4 w-full">
                <label htmlFor="id_estado" className="field-label">
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
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default DetallesServiciosCRUD;
