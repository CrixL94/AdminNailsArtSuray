import { ProgressSpinner } from "primereact/progressspinner";

interface LoadingProps {
  loading: boolean;
}

const Loading = ({ loading }: LoadingProps) => {
  if (!loading) return null;

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="5" />
    </div>
  );
};

export default Loading;
