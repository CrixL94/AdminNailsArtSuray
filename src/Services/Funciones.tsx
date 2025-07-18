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
