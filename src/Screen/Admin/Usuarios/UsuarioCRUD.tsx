import { Dialog } from "primereact/dialog";
import { useForm } from "../../../Hooks/useForm";
import { supabase } from "../../../supabaseClient";
import { useEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { toastShow } from "../../../Services/ToastService";
import { Toast } from "primereact/toast";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import Loading from "../../../Components/Loader";

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    Nombre: "",
    Telefono: "",
    Email: "",
    Password: "",
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
    if (!editando) {
      if (!values.Password.trim() || values.Password.length < 6) {
        errores.Password = true;
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
    const { Nombre, Telefono, Email, Password, IdEstado } = values;

    try {
      setLoading(true);
      if (!editando) {
        // Registrar en auth
        const { data: authUser, error: authError } = await supabase.auth.signUp(
          {
            email: Email,
            password: Password,
          }
        );

        if (authError) {
          toastShow(
            toast,
            "error",
            "Error de autenticación",
            authError.message,
            3000
          );
        }

        // Insertar en tabla Usuarios
        const { error: insertError } = await supabase
          .from("Usuarios")
          .insert([{ Nombre, Telefono, Email, IdEstado }]);

        if (insertError) {
          toastShow(
            toast,
            "error",
            "Error al guardar",
            insertError.message,
            3000
          );
        }

        // Éxito
        toastShow(
          toast,
          "success",
          "Usuario creado",
          "Registro guardado exitosamente",
          3000
        );
      } else {
        // Actualizar usuario existente
        const { error: updateError } = await supabase
          .from("Usuarios")
          .update({ Nombre, Telefono, Email, IdEstado })
          .eq("id", usuarioEditar.id);

        if (updateError) {
          toastShow(
            toast,
            "error",
            "Error al actualizar",
            updateError.message,
            3000
          );
        }

        // Éxito
        toastShow(
          toast,
          "success",
          "Usuario actualizado",
          "Registro actualizado exitosamente",
          3000
        );
      }

      setTimeout(() => {
        fetchUsuarios();
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
          Password: "",
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
        header={editando ? "Editar Usuario" : "Nuevo Usuario"}
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
              onClick={guardarUsuario}
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
                <label htmlFor="nombre" className="font-bold block mb-2">
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
                  <small className="p-error">Nombre es requerido</small>
                )}
              </div>
              <div className="flex-auto">
                <label
                  htmlFor="numero-celular"
                  className="font-bold block mb-2"
                >
                  Numero Celular
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
                  <small className="p-error">Telefono es requerido</small>
                )}
              </div>
            </div>

            <div className="sm:flex gap-3 mb-4">
              <div className="sm:w-1/2 w-full">
                <label htmlFor="Email" className="font-bold block mb-2">
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
                  <small className="p-error">Email es requerido</small>
                )}
              </div>

              <div className="sm:w-1/2 sm:mt-0 mt-4 w-full">
                <label htmlFor="IdEstado" className="font-bold block mb-2">
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
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="sm:w-1/2 w-full">
                  <label htmlFor="nombre" className="font-bold block mb-2">
                    Contraseña
                  </label>
                  <IconField>
                    <InputIcon
                      className={`cursor-pointer ${
                        showPassword ? "pi pi-eye-slash" : "pi pi-eye"
                      }`}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                    <InputText
                      id="Password"
                      name="Password"
                      type={showPassword ? "text" : "Password"}
                      value={values?.Password}
                      onChange={handleInputChange}
                      className={`w-full ${
                        error?.Password ? "border-red-500 border-2" : ""
                      }`}
                    />
                  </IconField>
                  {error.Password && (
                    <small className="text-red-500 text-sm">
                      Contraseña es requerida
                    </small>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </Dialog>
    </>
  );
};

export default UsuarioCRUD;
