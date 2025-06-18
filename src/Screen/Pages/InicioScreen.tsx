
const InicioScreen = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 bg-gray-100 sm:p-6 p-2 relative">
        <h1 className="sm:text-3xl text-2xl font-bold mb-4">Página de Inicio</h1>
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-500">
            Agrega aquí tus datos, tablas o widgets.
          </p>
        </div>
      </main>
    </div>
  )
}

export default InicioScreen