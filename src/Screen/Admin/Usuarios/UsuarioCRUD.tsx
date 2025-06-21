import { Dialog } from "primereact/dialog";
import { useForm } from "../../../Hooks/useForm";
import { supabase } from "../../../supabaseClient";
import { useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

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

  const [estados, setEstados] = useState<{ label: string; value: number }[]>(
    []
  );

  const fetchEstados = async () => {
    const { data } = await supabase
      .from("Estados")
      .select("IdEstado, NombreEstado");
    setEstados(
      data.map((e: any) => ({ label: e.NombreEstado, value: e.IdEstado }))
    );
  };

  const initialValues = {
    Nombre: "",
    Telefono: "",
    Email: "",
    Password: "",
    IdEstado: 1,
  };

  const { values, handleInputChange, resetForm, setValues } =
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
    >
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
          </div>
          <div className="flex-auto">
            <label htmlFor="numero-celular" className="font-bold block mb-2">
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
          </div>

          <div className="sm:w-1/2 w-full">
            <label htmlFor="IdEstado" className="font-bold block mb-2">
              Estado
            </label>
            <Dropdown
              id="IdEstado"
              name="IdEstado"
              value={values.IdEstado}
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
    </Dialog>
  );
};

export default UsuarioCRUD;
