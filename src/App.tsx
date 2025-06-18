import { PrimeReactProvider } from "primereact/api";
import AppRouter from "./Router/Router"; 

function App() {
  return (
    <>
      <PrimeReactProvider>
        <AppRouter />
      </PrimeReactProvider>
    </>
  );
}

export default App;
