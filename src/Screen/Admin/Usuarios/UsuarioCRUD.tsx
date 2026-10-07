import { Dialog } from "primereact/dialog";
import { useForm } from "../../../Hooks/useForm";
import { supabase } from "../../../supabaseClient";
import { useEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { toastShow } from "../../../Services/ToastService";
import { Toast } from "primereact/toast";
import Loading from "../../../Components/Loader";

// Pantalla de Supabase donde se crean las cuentas de acceso (el registro
// público está desactivado por seguridad)
const PROYECTO = new URL(import.meta.env.VITE_SUPABASE_URL as string).hostname.split(".")[0];
const URL_USUARIOS_SUPABASE = `https://supabase.com/dashboard/project/${PROYECTO}/auth/users`;

const UsuarioCRUD = ({
  visible,
  onHide,
  fetchUsuarios,
  usuarioEditar = null,
}: {
  visible: boolean;
  onHide: () => void;
  fetchUsuarios: () => void;
  usuarioEditar?: any;
}) => {
  const toast = useRef<Toast>(null!);
  const editando = !!usuarioEditar;

  const [estados, setEstados] = useState<{ label: string; value: number }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const fetchEstados = async () => {
    const { data } = await supabase
      .from("Estados")
      .select("IdEstado, NombreEstado");
    setEstados(
      (data || [])
        .filter((e: any) => [1, 2].includes(e.IdEstado))
        .map((e: any) => ({ label: e.NombreEstado, value: e.IdEstado }))
    );
  };

  const initialValues = {
    Nombre: "",
    Telefono: "",
    Email: "",
    IdEstado: 1,
  };

  const { values, handleInputChange, resetForm, setValues, setError, error } = useForm(initialValues);

  const validarDatos = () => {
    let isValid = true;
    let errores: Record<string, boolean> = {};

    if (!values.Nombre.trim()) {
      errores.Nombre = true;
      isValid = false;
    }
    if (!values.Telefono.trim()) {
      errores.Telefono = true;
      isValid = false;
    }
    if (!values.Email.trim()) {
      errores.Email = true;
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.Email)) {
        errores.Email = true;
        isValid = false;
      }
    }
    if (!values.IdEstado) {
      errores.IdEstado = true;
      isValid = false;
    }

    setError(errores);

    return isValid;
  };

  const guardarUsuario = async () => {
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
    const { Nombre, Telefono, Email, IdEstado } = values;
    const datos = { Nombre, Telefono, Email: Email.trim().toLowerCase(), IdEstado };

    setLoading(true);
    const { error: guardarError } = editando
      ? await supabase.from("Usuarios").update(datos).eq("id", usuarioEditar.id)
      : await supabase.from("Usuarios").insert([datos]);
    setLoading(false);

    if (guardarError) {
      toastShow(
        toast,
        "error",
        editando ? "Error al actualizar" : "Error al guardar",
        guardarError.message,
        4000
      );
      return;
    }

    toastShow(
      toast,
      "success",
      editando ? "Usuario actualizado" : "Usuario agregado",
      editando
        ? "Los cambios se guardaron correctamente"
        : "Si aún no tiene cuenta, créala en Supabase con el mismo correo",
      4000
    );

    setTimeout(() => {
      fetchUsuarios();
      cerrarDialog();
    }, 800);
  };

  const cerrarDialog = () => {
    resetForm();
    setError({});
    onHide();
  };

  useEffect(() => {
    fetchEstados();
  }, []);

  useEffect(() => {
    if (visible) {
      if (usuarioEditar) {
        setValues({
          ...usuarioEditar,
          IdEstado: usuarioEditar.IdEstado || 1,
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
        header={editando ? "Editar usuario" : "Nuevo usuario"}
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
              onClick={guardarUsuario}
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
                <label htmlFor="nombre" className="field-label">
                  Nombre
                </label>
                <InputText
                  id="nombre"
                  name="Nombre"
                  value={values?.Nombre}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.Nombre && (
                  <small className="field-error">Nombre es requerido</small>
                )}
              </div>
              <div className="flex-auto">
                <label
                  htmlFor="numero-celular"
                  className="field-label"
                >
                  Número de celular
                </label>
                <InputText
                  id="numero-celular"
                  name="Telefono"
                  value={values?.Telefono}
                  onChange={handleInputChange}
                  keyfilter="num"
                  className="w-full"
                />
                {error.Telefono && (
                  <small className="field-error">Telefono es requerido</small>
                )}
              </div>
            </div>

            <div className="sm:flex gap-3 mb-4">
              <div className="sm:w-1/2 w-full">
                <label htmlFor="Email" className="field-label">
                  Email
                </label>
                <InputText
                  id="Email"
                  name="Email"
                  value={values?.Email}
                  onChange={handleInputChange}
                  className="w-full"
                />
                {error.Email && (
                  <small className="field-error">Escribe un correo válido</small>
                )}
                <small className="mt-1 block text-xs text-ink-400">
                  Debe ser el mismo correo de su cuenta de acceso.
                </small>
              </div>

              <div className="sm:w-1/2 sm:mt-0 mt-4 w-full">
                <label htmlFor="IdEstado" className="field-label">
                  Estado
                </label>
                <Dropdown
                  id="IdEstado"
                  name="IdEstado"
                  value={values?.IdEstado}
                  options={estados}
                  onChange={handleInputChange}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Selecciona un estado"
                  className="w-full"
                />
              </div>
            </div>

            {!editando && (
              <div className="rounded-2xl bg-brand-50 p-4 text-sm text-ink-700 ring-1 ring-brand-100">
                <p className="mb-2 flex items-center gap-2 font-medium text-brand-800">
                  <i className="pi pi-info-circle" />
                  La cuenta de acceso se crea en Supabase
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-ink-600">
                  <li>Guarda aquí sus datos.</li>
                  <li>
                    En Supabase, ve a{" "}
                    <a
                      href={URL_USUARIOS_SUPABASE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-700 underline underline-offset-2"
                    >
                      Authentication → Users
                    </a>{" "}
                    → <strong>Add user</strong> → <strong>Create new user</strong>.
                  </li>
                  <li>
                    Usa el <strong>mismo correo</strong>, ponle una contraseña y marca{" "}
                    <strong>Auto Confirm User</strong>.
                  </li>
                </ol>
                <p className="mt-2 text-xs text-ink-400">
                  Solo podrá entrar al panel si su estado aquí es Activo.
                </p>
              </div>
            )}
          </form>
        </div>
      </Dialog>
    </>
  );
};

export default UsuarioCRUD;
