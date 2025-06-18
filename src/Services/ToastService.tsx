import { Toast } from "primereact/toast";

export const toastShow = (
  toast: React.RefObject<Toast>,
  severity: any,
  summary: string,
  detail: string,
  life: number = 3000
): void => {
  toast.current?.show({
    severity,
    summary,
    detail,
    life,
  });
};
