import { ProgressSpinner } from "primereact/progressspinner";

interface LoadingProps {
  loading: boolean;
  texto?: string;
}

const Loading = ({ loading, texto = "Cargando…" }: LoadingProps) => {
  if (!loading) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" aria-busy="true">
      <ProgressSpinner style={{ width: "44px", height: "44px" }} strokeWidth="4" />
      <p className="text-sm text-ink-400">{texto}</p>
    </div>
  );
};

export default Loading;
