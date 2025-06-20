import { Dialog } from "primereact/dialog";
import { useForm } from "../../../Hooks/useForm";
import { Button } from "primereact/button";
import { supabase } from "../../../supabaseClient";
import { useEffect } from "react";

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
  const editando = !!usuarioEditar;
  const initialValues = {
    Nombre: "",
    Telefono: "",
    Email: "",
    Password: "",
    IdEstado: 1,
  };

  const { values, handleInputChange, resetForm, setValues, handleChange } =
    useForm(initialValues);

  const guardarUsuario = async () => {
    const { Nombre, Telefono, Email, Password, IdEstado } = values;

    try {
      if (!editando) {
        // Registrar en auth
        const { data: authUser, error: authError } = await supabase.auth.signUp(
          {
            email: Email,
            password: Password,
          }
        );

        if (authError) throw authError;

        // Insertar en tabla
        const { error: insertError } = await supabase
          .from("Usuarios")
          .insert([{ Nombre, Telefono, Email, IdEstado }]);

        if (insertError) throw insertError;
      } else {
        // Actualizar
        const { error: updateError } = await supabase
          .from("Usuarios")
          .update({ Nombre, Telefono, Email, IdEstado })
          .eq("id", usuarioEditar.id);

        if (updateError) throw updateError;
      }

      fetchUsuarios();
      onHide();
      resetForm();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  useEffect(() => {
    if (usuarioEditar) {
      setValues({ ...usuarioEditar, Password: "" });
    } else {
      resetForm();
    }
  }, [usuarioEditar]);
  return (
    <Dialog
      header={editando ? "Editar Usuario" : "Nuevo Usuario"}
      visible={visible}
      className="sm:w-1/2 w-full sm:p-0 p-2"
      modal
      onHide={() => {
        resetForm();
        onHide();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onHide}
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
    ></Dialog>
  );
};

export default UsuarioCRUD;
