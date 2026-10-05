/**
 * Mensajes en español (con tildes) para los códigos de error estables del backend.
 * El backend responde mensajes sin tildes por compatibilidad; la interfaz muestra estos.
 * Si un código no está aquí, se usa el mensaje que envió el servidor.
 */
export const friendlyMessages: Record<string, string> = {
  "auth.invalid_credentials": "Correo o contraseña incorrectos.",
  "auth.unauthenticated": "Necesitas iniciar sesión.",
  "auth.invalid_token": "Tu sesión venció. Inicia sesión de nuevo.",
  "auth.refresh_token_invalid": "Tu sesión no es válida. Inicia sesión de nuevo.",
  "auth.refresh_token_expired": "Tu sesión venció. Inicia sesión de nuevo.",
  "auth.refresh_token_reused": "Por seguridad cerramos tu sesión. Inicia sesión de nuevo.",
  "auth.challenge_invalid": "La verificación expiró. Inicia sesión de nuevo.",
  "auth.invalid_2fa_code": "El código de verificación no es válido.",
  "auth.2fa_already_enabled": "La verificación en dos pasos ya está activa.",
  "auth.2fa_not_enabled": "La verificación en dos pasos no está activa.",
  "auth.2fa_not_started": "Primero inicia la activación de la verificación en dos pasos.",
  "auth.forbidden": "No tienes permiso para realizar esta acción.",
  "user.email_taken": "Ya existe una cuenta con ese correo.",
  "library.comic_not_found": "Ese cómic no está en tu biblioteca.",
  "library.duplicate_file": "Ese archivo ya está en tu biblioteca.",
  "library.limit_reached": "Llegaste al máximo de cómics de tu biblioteca.",
  "reading.bookmark_not_found": "Ese marcador ya no existe.",
  "reading.bookmark_limit": "Llegaste al máximo de marcadores de este cómic.",
  "reading.no_progress": "Aún no has empezado este cómic.",
  "analysis.image_too_large": "La imagen supera el máximo de 10 MB.",
  "analysis.unsupported_image": "El formato de la imagen no es compatible. Usa JPEG, PNG o WebP.",
  "analysis.empty_image": "No se recibió ninguna imagen.",
  "analysis.job_not_found": "No existe ese trabajo de análisis.",
  "analysis.result_not_found": "Esa página aún no se ha analizado.",
  "analysis.too_many_pending": "Tienes demasiados análisis en cola. Espera a que terminen.",
  "catalog.work_not_found": "Esa obra no existe en el catálogo.",
  "catalog.slug_exhausted": "Ya hay demasiadas obras con ese título.",
  "backend.unavailable": "No se pudo contactar al servidor de PanelVault. Intenta de nuevo en unos segundos.",
  "request.cross_site": "Petición rechazada por seguridad. Recarga la página.",
  "request.too_large": "El archivo es demasiado grande.",
};
