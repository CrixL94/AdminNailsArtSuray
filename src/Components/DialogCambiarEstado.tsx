import { Dialog } from "primereact/dialog";
import { RadioButton } from "primereact/radiobutton";

const DialogCambiarEstado = ({
  dialogEstadoVisible,
  cerrarDialog,
  guardarEstado,
  estados,
  onEstadoChange,
  selectedEstado,
}: {
  dialogEstadoVisible: boolean;
  cerrarDialog: () => void;
  guardarEstado: () => void;
  estados: { label: string; value: number }[];
  onEstadoChange: (val: number) => void;
  selectedEstado: number | null;
}) => {
  return (
    <>
      <Dialog
        header={`Cambiar Estado`}
        visible={dialogEstadoVisible}
        className="sm:w-1/3 w-full sm:p-0 p-2"
        modal
        onHide={cerrarDialog}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={cerrarDialog}
              className="text-gray-700 hover:text-gray-800"
            >
              Cancelar
            </button>

            <button
              onClick={guardarEstado}
              className="text-pink-600 hover:text-pink-600"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {estados.map((estado: any) => (
            <div key={estado.value} className="flex align-items-center">
              <RadioButton
                inputId={`estado_${estado.value}`}
                name="estado"
                value={estado.value}
                onChange={() => onEstadoChange(estado.value)}
                checked={selectedEstado === estado.value}
              />
              <label htmlFor={`estado_${estado.value}`} className="ml-2">
                {estado.label}
              </label>
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
};

export default DialogCambiarEstado;
