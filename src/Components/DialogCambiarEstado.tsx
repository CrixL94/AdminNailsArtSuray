import { Dialog } from "primereact/dialog";

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
    <Dialog
      header="Cambiar estado"
      visible={dialogEstadoVisible}
      className="w-[94vw] max-w-md"
      modal
      blockScroll
      draggable={false}
      onHide={cerrarDialog}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={cerrarDialog} className="btn-ghost">
            Cancelar
          </button>
          <button type="button" onClick={guardarEstado} className="btn-primary">
            <i className="pi pi-check" />
            Guardar
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Estado">
        {estados.map((estado) => {
          const activo = selectedEstado === estado.value;
          return (
            <button
              key={estado.value}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onEstadoChange(estado.value)}
              className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                activo
                  ? "border-brand-500 bg-brand-50 text-brand-800"
                  : "border-brand-100 bg-white text-ink-700 hover:border-brand-300"
              }`}
            >
              {estado.label}
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  activo ? "border-brand-600 bg-brand-600 text-white" : "border-brand-200"
                }`}
              >
                {activo && <i className="pi pi-check text-[10px]" />}
              </span>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
};

export default DialogCambiarEstado;
