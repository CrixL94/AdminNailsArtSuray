import { useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { supabase } from "../supabaseClient";
import { useForm } from "../Hooks/useForm";
import { toastShow } from "../Services/ToastService";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import Logo from "../Components/Logo";

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
    <div className="grid min-h-screen bg-cream lg:grid-cols-[1.1fr_1fr]">
      <Toast ref={toast} />

      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden bg-ink-900 p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-600/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative inline-flex w-fit rounded-2xl bg-cream px-5 py-4">
          <Logo className="w-24" />
        </div>

        <div className="relative max-w-md">
          <p className="eyebrow mb-5 text-brand-300 before:bg-brand-300">Panel de administración</p>
          <h1 className="font-display text-5xl leading-tight font-medium">
            Todo tu estudio, en un solo lugar.
          </h1>
          <p className="mt-5 text-white/70">
            Gestiona citas, mensajes, testimonios y el contenido de tu sitio web.
          </p>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} Nail's Art Suray
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center px-5 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm" noValidate>
          <div className="mb-10 flex justify-center lg:hidden">
            <Logo className="w-28" />
          </div>

          <p className="eyebrow mb-3">Bienvenida</p>
          <h2 className="heading-xl">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-ink-500">
            Ingresa con tu correo y contraseña.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="field-label">
                Correo electrónico
              </label>
              <InputText
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values?.email}
                onChange={handleInputChange}
                placeholder="tucorreo@ejemplo.com"
                className="w-full"
                invalid={!!error?.email}
                keyfilter="email"
              />
              {error.email && (
                <small className="field-error">El correo es obligatorio.</small>
              )}
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Contraseña
              </label>
              <IconField iconPosition="right">
                <InputIcon
                  className={`cursor-pointer ${
                    showPassword ? "pi pi-eye-slash" : "pi pi-eye"
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                />
                <InputText
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={values?.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full"
                  invalid={!!error?.password}
                />
              </IconField>
              {error.password && (
                <small className="field-error">La contraseña es obligatoria.</small>
              )}
            </div>

            {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="pi pi-spin pi-spinner" />
                  Iniciando…
                </>
              ) : (
                <>
                  Entrar
                  <i className="pi pi-arrow-right text-xs" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Login;
