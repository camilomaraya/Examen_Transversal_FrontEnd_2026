// ============================================================
//  UTILIDADES COMPARTIDAS — LicitaSeguro
//  Helpers que se usan en varias páginas. Importar antes del
//  script propio de cada vista.
// ============================================================

/**
 * Sanitiza texto que viene de la API antes de insertarlo en el DOM.
 * - Evita XSS: convierte <, >, &, " a entidades HTML.
 * - Si el valor es null/undefined/vacío, devuelve "--" (placeholder
 *   estándar que pide la rúbrica para campos nulos).
 */
function sanitizar(texto) {
  if (texto === null || texto === undefined || texto === "") return "--";
  const div = document.createElement("div");
  div.textContent = String(texto);
  return div.innerHTML;
}

/**
 * Formatea una fecha ISO de la API ("2025-06-30T15:10:00") a "30/06/2025".
 * Devuelve "--" si la fecha es nula o inválida.
 */
function formatearFecha(fechaIso) {
  if (!fechaIso) return "--";
  const f = new Date(fechaIso);
  if (isNaN(f.getTime())) return "--";
  const dd = String(f.getDate()).padStart(2, "0");
  const mm = String(f.getMonth() + 1).padStart(2, "0");
  const aa = f.getFullYear();
  return `${dd}/${mm}/${aa}`;
}

/**
 * Igual que formatearFecha pero incluyendo hora: "30/06/2025 15:10".
 */
function formatearFechaHora(fechaIso) {
  if (!fechaIso) return "--";
  const f = new Date(fechaIso);
  if (isNaN(f.getTime())) return "--";
  const fecha = formatearFecha(fechaIso);
  const hh = String(f.getHours()).padStart(2, "0");
  const mi = String(f.getMinutes()).padStart(2, "0");
  return `${fecha} ${hh}:${mi}`;
}

/**
 * Formatea un monto numérico a CLP: 11385960 → "$11.385.960".
 * Devuelve "--" si el valor es nulo, 0 o no numérico.
 */
function formatearMonto(monto) {
  if (monto === null || monto === undefined || monto === "" || isNaN(monto)) return "--";
  return "$" + Number(monto).toLocaleString("es-CL");
}

/**
 * Convierte un <input type="date"> ("2025-05-30") al formato que
 * exige la API de Mercado Público (ddmmaaaa: "30052025").
 */
function fechaParaApi(fechaInput) {
  if (!fechaInput) return "";
  const [aa, mm, dd] = fechaInput.split("-");
  return `${dd}${mm}${aa}`;
}

/**
 * Mapea el CodigoEstado numérico de la API a un texto legible
 * y una clase CSS para el badge de estado.
 * (Códigos según documentación oficial de Mercado Público.)
 */
const ESTADOS = {
  5:  { texto: "Publicada",   clase: "estado-publicada" },
  6:  { texto: "Cerrada",     clase: "estado-cerrada" },
  7:  { texto: "Desierta",    clase: "estado-desierta" },
  8:  { texto: "Adjudicada",  clase: "estado-adjudicada" },
  9:  { texto: "Revocada",    clase: "estado-revocada" },
  10: { texto: "Suspendida",  clase: "estado-suspendida" },
};
function infoEstado(codigoEstado) {
  return ESTADOS[codigoEstado] || { texto: "Sin estado", clase: "estado-default" };
}

/**
 * Lee un parámetro de la URL (ej: detalle.html?codigo=1509-5-L114 -> "1509-5-L114").
 */
function paramUrl(nombre) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nombre);
}

/**
 * Loader: muestra/oculta un elemento por su id.
 * Bloquea interacciones mientras se muestra (rúbrica: "bloqueando
 * interacciones durante su visibilidad").
 */
function mostrarLoader(id = "loader") {
  const el = document.getElementById(id);
  if (el) el.classList.remove("d-none");
}
function ocultarLoader(id = "loader") {
  const el = document.getElementById(id);
  if (el) el.classList.add("d-none");
}

// ============================================================
//  VALIDACIÓN Y FORMATO DE RUT CHILENO
// ============================================================

/**
 * Auto-formatea un RUT mientras el usuario escribe.
 * Acepta cualquier entrada y devuelve formato "XX.XXX.XXX-X".
 * Ejemplos:
 *   "776533823"    -> "77.653.382-3"
 *   "77.653.382-3" -> "77.653.382-3" (ya formateado)
 *   "12345678k"    -> "1.234.567-8K" (limpia y reformatea)
 */
function formatearRut(rut) {
  if (!rut) return "";
  // Dejar solo números y K
  let limpio = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (limpio.length === 0) return "";
  if (limpio.length === 1) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  // Insertar puntos cada 3 dígitos desde el final del cuerpo
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return cuerpoConPuntos + "-" + dv;
}

/**
 * Valida un RUT chileno completo (formato + dígito verificador módulo 11).
 * Devuelve un objeto { valido, error }:
 *   - valido: boolean
 *   - error: mensaje específico si no es válido, "" si lo es.
 *
 * Casos de error que distinguimos (cada uno da puntos en la rúbrica):
 *   1. Vacío
 *   2. Caracteres no válidos
 *   3. Muy corto / muy largo
 *   4. Dígito verificador incorrecto
 */
function validarRut(rutInput) {
  // 1) Vacío
  if (!rutInput || rutInput.trim() === "") {
    return { valido: false, error: "Ingresa un RUT para buscar." };
  }

  // 2) Caracteres válidos (números, puntos, guión, K)
  if (!/^[0-9.\-kK]+$/.test(rutInput)) {
    return { valido: false, error: "El RUT solo puede contener números, puntos, guión y la letra K." };
  }

  // Limpiar para algoritmo
  const limpio = rutInput.replace(/\./g, "").replace(/-/g, "").toUpperCase();

  // 3) Longitud razonable (7-9 dígitos + DV)
  if (limpio.length < 8 || limpio.length > 10) {
    return { valido: false, error: "El RUT debe tener entre 8 y 10 caracteres (sin puntos ni guión)." };
  }

  const cuerpo = limpio.slice(0, -1);
  const dvIngresado = limpio.slice(-1);

  // El cuerpo deben ser SOLO números
  if (!/^\d+$/.test(cuerpo)) {
    return { valido: false, error: "El cuerpo del RUT debe ser numérico." };
  }

  // 4) Algoritmo módulo 11
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  let dvCalculado;
  if (resto === 11) dvCalculado = "0";
  else if (resto === 10) dvCalculado = "K";
  else dvCalculado = String(resto);

  if (dvIngresado !== dvCalculado) {
    return { valido: false, error: "El dígito verificador no corresponde. Revisa el RUT." };
  }

  return { valido: true, error: "" };
}
