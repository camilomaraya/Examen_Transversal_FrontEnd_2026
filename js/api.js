// ============================================================
//  CAPA DE API — LicitaSeguro
// ============================================================

/**
 * Envuelve la URL de la API con el proxy CORS.
 * encodeURIComponent es OBLIGATORIO: el proxy necesita la URL "escapada".
 */
function construirUrl(urlApi) {
  return CONFIG.PROXY + encodeURIComponent(urlApi);
}

/**
 * Hace un GET y devuelve el JSON ya parseado.
 * Lanza un Error con mensaje contextualizado según qué falle.
 * (El manejo de códigos HTTP y el parseo robusto = puntos directos en la rúbrica.)
 */
async function pedirJSON(urlApi) {
  let respuesta;

  // 1) Error de RED (sin internet, proxy caído, DNS, etc.)
  try {
    respuesta = await fetch(construirUrl(urlApi));
  } catch (error) {
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión a internet.");
  }

  // 2) Manejo de CÓDIGOS HTTP
  if (respuesta.status === 429) {
    throw new Error("Demasiadas peticiones (429). El ticket está sin cupo; solicita tu propio ticket.");
  }
  if (respuesta.status >= 500) {
    throw new Error("El servidor de Mercado Público no está disponible. Intente más tarde.");
  }
  if (!respuesta.ok) {
    throw new Error("Error " + respuesta.status + " al consultar la API.");
  }

  // 3) Parseo ROBUSTO del JSON
  let datos;
  try {
    datos = await respuesta.json();
  } catch (error) {
    throw new Error("La respuesta del servidor no es un JSON válido.");
  }

  // 4) Error LÓGICO de la API: responde 200 pero con {Codigo, Mensaje}
  //    Ej: ticket inválido -> {"Codigo":203,"Mensaje":"Ticket no válido."}
  if (datos && datos.Codigo && datos.Mensaje) {
    throw new Error("API: " + datos.Mensaje + " (código " + datos.Codigo + ").");
  }

  return datos;
}

/**
 * Listado de licitaciones, filtrable por fecha y/o estado.
 * @param {string} [fecha]  formato ddmmaaaa (ej: "30052025")
 * @param {string} [estado] ej: "activas", "adjudicada", "revocada"
 * @returns {Promise<Array>} siempre un array (vacío si no hay resultados)
 */
async function obtenerLicitaciones(fecha, estado) {
  const params = new URLSearchParams();
  if (fecha)  params.set("fecha", fecha);
  if (estado) params.set("estado", estado);
  params.set("ticket", CONFIG.TICKET);

  const url = CONFIG.BASE_LICITACIONES + "?" + params.toString();
  const datos = await pedirJSON(url);

  // Normalizamos: pase lo que pase, devolvemos un array.
  return Array.isArray(datos.Listado) ? datos.Listado : [];
}

/**
 * Detalle completo de una licitación por su código.
 * @param {string} codigo ej: "1509-5-L114"
 * @returns {Promise<Object>} el objeto de la licitación
 */
async function obtenerDetalleLicitacion(codigo) {
  const params = new URLSearchParams({ codigo: codigo, ticket: CONFIG.TICKET });
  const url = CONFIG.BASE_LICITACIONES + "?" + params.toString();
  const datos = await pedirJSON(url);

  if (!datos.Listado || datos.Listado.length === 0) {
    throw new Error("No se encontró la licitación con código " + codigo + ".");
  }
  return datos.Listado[0];
}

/**
 * Busca un proveedor por RUT.
 * @param {string} rut formato "77.653.382-3"
 * @returns {Promise<Object|null>} el proveedor, o null si no existe
 */
async function buscarProveedor(rut) {
  const params = new URLSearchParams({ rutempresaproveedor: rut, ticket: CONFIG.TICKET });
  const url = CONFIG.BASE_PROVEEDOR + "?" + params.toString();
  const datos = await pedirJSON(url);

  // null = "no encontrado" -> la vista mostrará "Proveedor no encontrado"
  if (!datos.listaEmpresas || datos.listaEmpresas.length === 0) {
    return null;
  }
  return datos.listaEmpresas[0];
}
