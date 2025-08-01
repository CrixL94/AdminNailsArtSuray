import { useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Button } from "primereact/button";
import { supabase } from "../supabaseClient";
import { useForm } from "../Hooks/useForm";
import { toastShow } from "../Services/ToastService";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logroprimario2.png";

const Login = () => {
  const toast = useRef<Toast>(null!);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { values, handleInputChange, setError, error } = useForm({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");

    const { email, password } = values;

    const newErrors: any = {};
    if (!email.trim()) newErrors.email = true;
    if (!password.trim()) newErrors.password = true;

    setError(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (loginError) {
      toastShow(toast, "error", "Error", "Credenciales incorrectas", 3000);
      return;
    }

    const userEmail = loginData.user.email;

    const { data: usuarioData, error: usuarioError } = await supabase
      .from("vta_usuarios")
      .select("Nombre, IdEstado")
      .eq("Email", userEmail)
      .single();

    if (usuarioError || !usuarioData) {
      toastShow(toast, "error", "Error", "No se encontró información del usuario", 3000);
      return;
    }

    // Verificamos si está activo
    if (usuarioData.IdEstado !== 1) {
      toastShow(toast, "error", "Usuario inactivo", "No puedes iniciar sesión", 3000);
      return;
    }

    // Usuario válido y activo
    const nombre = usuarioData.Nombre;
    toastShow(toast, "success", "Bienvenido", `Hola ${nombre}, has iniciado sesión correctamente`, 3000);

    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Toast ref={toast} />
      <form
        onSubmit={handleSubmit}
        className="sm:bg-white p-8 rounded-b-md sm:shadow-md w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="logo"  className="sm:w-[15rem] w-[10rem]"/>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1 font-semibold">
              Correo electrónico
            </label>
            <InputText
              id="email"
              name="email"
              type="email"
              value={values?.email}
              onChange={handleInputChange}
              placeholder="Correo electrónico"
              className={`w-full ${
                error?.email ? "border-red-500 border-2" : ""
              }`}
              keyfilter="email"
            />
            {error.email && (
              <small className="text-red-500 text-sm">
                Correo es obligatorio.
              </small>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 font-semibold">
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
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={values?.password}
                onChange={handleInputChange}
                placeholder="Contraseña"
                className={`w-full ${
                  error?.password ? "border-red-500 border-2" : ""
                }`}
              />
            </IconField>
            {error.password && (
              <small className="text-red-500 text-sm">
                Contraseña es obligatorio.
              </small>
            )}
          </div>

          {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}

          <Button
            unstyled
            label={loading ? "Iniciando..." : "Iniciar Sesión"}
            type="submit"
            className="w-full mt-2 bg-pink-600 text-white hover:bg-pink-700 p-2 rounded-sm"
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
};

export default Login;
