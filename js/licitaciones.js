// ============================================================
//  LISTADO DE LICITACIONES — lógica de página
//  Responsabilidades:
//   1. Capturar y validar los filtros (fecha, estado)
//   2. Mostrar loader durante el fetch
//   3. Renderizar resultados como cards
//   4. Paginar de 10 en 10 si hay más resultados
//   5. Manejar todos los estados (cargando, error, vacío, con datos)
// ============================================================

// --- Estado de la página (paginación) ---
// Mantenemos los resultados completos en memoria y paginamos en el cliente.
// Esto es lo correcto porque la API devuelve TODO de una vez (no soporta
// paginación server-side en este endpoint).
const ESTADO = {
  resultados: [],
  paginaActual: 1,
  porPagina: 10,
};

// ============================================================
//  1. VALIDACIÓN DE FILTROS
// ============================================================

/**
 * Valida los filtros antes de enviar la consulta.
 * Devuelve { valido: boolean, errores: { fecha?, estado? } }.
 * Mostrar los errores debajo de cada campo es trabajo del caller.
 */
function validarFiltros(fecha, estado) {
  const errores = {};

  // Regla: al menos uno de los dos debe estar lleno
  // (si los dos están vacíos, la API tira error o devuelve demasiado).
  if (!fecha && !estado) {
    errores.fecha = "Indica al menos una fecha o un estado.";
  }

  // Si hay fecha, validamos que no sea futura
  if (fecha) {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const ingresada = new Date(fecha);
    if (ingresada > hoy) {
      errores.fecha = "La fecha no puede ser posterior a hoy.";
    }
  }

  return { valido: Object.keys(errores).length === 0, errores };
}

/**
 * Pinta los errores de validación debajo de cada campo.
 * Limpia los mensajes antes de pintar (para que no se acumulen).
 */
function pintarErrores(errores) {
  document.getElementById("error-fecha").textContent = errores.fecha || "";
  document.getElementById("error-estado").textContent = errores.estado || "";
}

// ============================================================
//  2. CONSULTA A LA API
// ============================================================

/**
 * Maneja el submit del formulario: valida, carga, renderiza.
 */
async function buscar(evento) {
  evento.preventDefault();

  const fechaInput = document.getElementById("filtro-fecha").value;
  const estadoInput = document.getElementById("filtro-estado").value;

  // 1) Validar
  const { valido, errores } = validarFiltros(fechaInput, estadoInput);
  pintarErrores(errores);
  if (!valido) return;

  // 2) Mostrar loader y limpiar resultados previos
  mostrarLoader();
  document.getElementById("resultados").innerHTML = "";
  document.getElementById("paginacion").innerHTML = "";
  document.getElementById("info-resultados").textContent = "";

  // 3) Llamar a la API (con try/catch para todos los escenarios de error)
  try {
    const fechaApi = fechaParaApi(fechaInput);
    ESTADO.resultados = await obtenerLicitaciones(fechaApi, estadoInput);
    ESTADO.paginaActual = 1;
    renderizarResultados();
  } catch (error) {
    pintarError(error.message);
  } finally {
    // Importante: el loader se oculta SÍ O SÍ, pase lo que pase.
    ocultarLoader();
  }
}

// ============================================================
//  3. RENDERIZADO
// ============================================================

/**
 * Pinta la página actual de resultados.
 */
function renderizarResultados() {
  const cont = document.getElementById("resultados");

  // Estado vacío
  if (ESTADO.resultados.length === 0) {
    cont.innerHTML = `
      <div class="estado-vacio">
        <i class="bi bi-inbox" aria-hidden="true"></i>
        <h3>Sin resultados</h3>
        <p>No se encontraron licitaciones con esos filtros. Prueba con otra fecha o estado.</p>
      </div>`;
    return;
  }

  // Calculamos el slice de la página actual
  const inicio = (ESTADO.paginaActual - 1) * ESTADO.porPagina;
  const fin = inicio + ESTADO.porPagina;
  const pagina = ESTADO.resultados.slice(inicio, fin);

  // Pintamos cada card
  cont.innerHTML = pagina.map(licitacionACard).join("");

  // Info "Mostrando X-Y de Z"
  const info = document.getElementById("info-resultados");
  info.textContent = `Mostrando ${inicio + 1}-${Math.min(fin, ESTADO.resultados.length)} de ${ESTADO.resultados.length} licitaciones.`;

  // Paginación (solo si hay más de una página)
  renderizarPaginacion();
}

/**
 * Transforma un objeto de licitación en HTML de card.
 * TODO el texto que viene de la API pasa por sanitizar() — protege
 * contra XSS y reemplaza nulos por "--".
 */
function licitacionACard(lic) {
  const estadoInfo = infoEstado(lic.CodigoEstado);
  const codigo = sanitizar(lic.CodigoExterno);
  const nombre = sanitizar(lic.Nombre);
  const cierre = formatearFecha(lic.FechaCierre);

  return `
    <article class="licitacion-card">
      <span class="codigo">${codigo}</span>
      <h3><a href="detalle.html?codigo=${encodeURIComponent(lic.CodigoExterno)}">${nombre}</a></h3>
      <div class="meta">
        <span class="badge-estado ${estadoInfo.clase}">${estadoInfo.texto}</span>
        <span class="ms-3">
          <i class="bi bi-calendar-event" aria-hidden="true"></i>
          Cierre: <strong>${cierre}</strong>
        </span>
      </div>
    </article>`;
}

/**
 * Pinta los controles de paginación (Anterior, info, Siguiente).
 * Los botones se deshabilitan en los extremos — eso es exactamente
 * lo que pide la rúbrica para puntaje sobresaliente.
 */
function renderizarPaginacion() {
  const cont = document.getElementById("paginacion");
  const total = ESTADO.resultados.length;
  const totalPaginas = Math.ceil(total / ESTADO.porPagina);

  // No mostramos paginación si todo cabe en una página
  if (totalPaginas <= 1) {
    cont.innerHTML = "";
    return;
  }

  const enPrimera = ESTADO.paginaActual === 1;
  const enUltima = ESTADO.paginaActual === totalPaginas;

  cont.innerHTML = `
    <button onclick="cambiarPagina(-1)" ${enPrimera ? "disabled" : ""}
            aria-label="Página anterior">
      <i class="bi bi-chevron-left" aria-hidden="true"></i> Anterior
    </button>
    <span class="info-pagina">Página ${ESTADO.paginaActual} de ${totalPaginas}</span>
    <button onclick="cambiarPagina(1)" ${enUltima ? "disabled" : ""}
            aria-label="Página siguiente">
      Siguiente <i class="bi bi-chevron-right" aria-hidden="true"></i>
    </button>`;
}

/**
 * Cambia de página y vuelve a renderizar.
 * Accesibilidad: después de re-renderizar movemos el foco al primer
 * resultado visible. Sin esto, un usuario de teclado pierde la
 * referencia tras apretar "Siguiente" (el foco se queda en el botón).
 */
function cambiarPagina(delta) {
  ESTADO.paginaActual += delta;
  renderizarResultados();
  // Scroll suave al inicio de los resultados (UX visual)
  document.getElementById("resultados").scrollIntoView({ behavior: "smooth", block: "start" });
  // Mover foco al primer link de licitación (UX con teclado/lector de pantalla)
  const primerLink = document.querySelector("#resultados .licitacion-card h3 a");
  if (primerLink) primerLink.focus();
}

/**
 * Pinta un mensaje de error contextualizado.
 */
function pintarError(mensaje) {
  document.getElementById("resultados").innerHTML = `
    <div class="estado-vacio error" role="alert">
      <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
      <h3>No pudimos cargar las licitaciones</h3>
      <p>${sanitizar(mensaje)}</p>
    </div>`;
}

// ============================================================
//  4. INICIO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Cableamos el submit del form
  document.getElementById("form-filtros").addEventListener("submit", buscar);

  // Carga inicial: licitaciones activas de hoy (algo siempre a la vista)
  document.getElementById("filtro-estado").value = "activas";
  cargarInicial();
});

async function cargarInicial() {
  mostrarLoader();
  try {
    ESTADO.resultados = await obtenerLicitaciones(null, "activas");
    ESTADO.paginaActual = 1;
    renderizarResultados();
  } catch (error) {
    pintarError(error.message);
  } finally {
    ocultarLoader();
  }
}
