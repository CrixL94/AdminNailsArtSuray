import { supabase } from "../supabaseClient";

/**
 * Lista archivos en un bucket y carpeta específica con paginación.
 * @param bucket - Nombre del bucket (ej: "imagenes")
 * @param folder - Carpeta dentro del bucket (ej: "inicio_web")
 * @param limit - Cantidad máxima de archivos a listar (por defecto 100)
 * @param offset - Offset para paginación (por defecto 0)
 * @returns Array de objetos archivo o vacío si error
 */
export async function listarArchivos(
  bucket: string,
  folder: string,
  limit = 100,
  offset = 0
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { limit, offset });

  if (error) {
    console.error("Error listando archivos:", error.message);
    return [];
  }

  return data;
}

/**
 * Lista archivos directamente desde la raíz de un bucket.
 * @param bucket - Nombre del bucket (ej: "imagenes")
 * @param limit - Cantidad máxima de archivos a listar (por defecto 100)
 * @param offset - Offset para paginación (por defecto 0)
 * @returns Array de objetos archivo o vacío si error
 */
export async function listarArchivosRaiz(
  bucket: string,
  limit = 100,
  offset = 0
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list("", { limit, offset }); // "" indica la raíz del bucket

  if (error) {
    console.error("Error listando archivos desde raíz:", error.message);
    return [];
  }

  return data;
}

/**
 * Obtiene la URL pública de un archivo dado su bucket y ruta.
 * @param bucket - Nombre del bucket (ej: "imagenes")
 * @param path - Ruta completa dentro del bucket (ej: "inicio_web/foto.jpg")
 * @returns URL pública o null si no disponible
 */
export function obtenerUrlPublica(bucket: string, path: string): string | null {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data || !data.publicUrl) {
    console.warn(`No se pudo obtener URL para ${path}`);
    return null;
  }
  return data.publicUrl;
}

/**
 * Combina listar archivos y obtener sus URLs públicas desde carpeta
 */
export async function listarUrlsPublicas(
  bucket: string,
  folder: string,
  limit = 100,
  offset = 0
) {
  const archivos = await listarArchivos(bucket, folder, limit, offset);

  const urls = archivos
    .map((file) => obtenerUrlPublica(bucket, `${folder}/${file.name}`))
    .filter((url) => url !== null) as string[];

  return urls;
}

/**
 * Combina listar archivos y obtener sus URLs públicas desde raíz
 */
export async function listarUrlsPublicasRaiz(
  bucket: string,
  limit = 100,
  offset = 0
) {
  const archivos = await listarArchivosRaiz(bucket, limit, offset);

  const urls = archivos
    .map((file) => obtenerUrlPublica(bucket, file.name))
    .filter((url) => url !== null) as string[];

  return urls;
}

/**
 * Nombre seguro para Supabase Storage: sin acentos, espacios ni símbolos.
 * "Uñas Rojas (1).JPG" -> "Unas-Rojas-1.JPG"
 */
export function nombreSeguro(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-(?=\.)|-$/g, "");
}

/**
 * Reduce y convierte una imagen a WebP en el navegador antes de subirla.
 * Una foto de celular de 4–8 MB queda en ~100–250 KB.
 * Si el navegador no puede procesarla (HEIC, GIF, SVG…) o el resultado no
 * es más liviano, devuelve el archivo original.
 * @param file - Imagen seleccionada
 * @param maxLado - Lado más largo en píxeles (por defecto 1600)
 * @param calidad - Calidad WebP entre 0 y 1 (por defecto 0.8)
 */
export async function comprimirImagen(
  file: File,
  maxLado = 1600,
  calidad = 0.8
): Promise<File> {
  const noProcesables = ["image/gif", "image/svg+xml"];
  if (!file.type.startsWith("image/") || noProcesables.includes(file.type)) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    // "from-image" respeta la rotación EXIF de las fotos de celular
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", calidad)
  );

  // Algunos navegadores antiguos devuelven PNG en lugar de WebP
  if (!blob || blob.type !== "image/webp" || blob.size >= file.size) {
    return file;
  }

  const nombre = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], nombre, { type: "image/webp", lastModified: Date.now() });
}

/**
 * Comprime la imagen y genera un nombre único y seguro para subirla.
 * @returns El archivo listo para subir y su nombre (ej: "1754400000000-k3f9_unas.webp")
 */
export async function prepararImagen(file: File) {
  const archivo = await comprimirImagen(file);
  // El sufijo aleatorio evita choques al subir varias fotos en el mismo milisegundo
  const unico = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const nombre = `${unico}_${nombreSeguro(archivo.name)}`;
  return { archivo, nombre };
}

//FORMATEAR HORA A AM/PM
export const formatearHoraAMPM = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  const fecha = new Date();
  fecha.setHours(h, m);

  return fecha.toLocaleTimeString("es-HN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const sumarUnaHora = (hora: string) => {
  const [h, m, s] = hora.split(":").map(Number);
  const fecha = new Date();
  fecha.setHours(h, m, s || 0);
  fecha.setHours(fecha.getHours() + 1);
  return fecha.toISOString().slice(11, 19);
};

export const formatearDiaMesAno = (fechaString: string) => {
  // Extraemos partes año, mes, día para construir fecha local
  const [año, mes, dia] = fechaString.split("-").map(Number);
  // Mes en JS es base 0, por eso restamos 1
  const fecha = new Date(año, mes - 1, dia);

  if (isNaN(fecha.getTime())) return fechaString;

  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const diaSemana = diasSemana[fecha.getDay()];
  const diaMes = fecha.getDate();
  const mesNombre = meses[fecha.getMonth()];
  const añoNum = fecha.getFullYear();

  return `${diaSemana} ${diaMes} de ${mesNombre} de ${añoNum}`;
};
