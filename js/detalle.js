// ============================================================
//  DETALLE DE LICITACIÓN — lógica de página
//  Flujo:
//   1. Lee ?codigo=XXXX de la URL
//   2. Si no hay código → muestra error sin llamar a la API
//   3. Muestra loader, llama API, oculta loader
//   4. Renderiza todos los datos (con "--" para campos nulos)
//   5. Si la API falla → mensaje contextualizado
// ============================================================

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {
  const codigo = paramUrl("codigo");

  // Caso 1: la URL no trae código (ej: alguien entró directo a detalle.html)
  if (!codigo) {
    pintarError("No se especificó un código de licitación. Vuelve al listado y selecciona una.");
    return;
  }

  // Mostramos el código en el header de inmediato (antes de tener datos)
  // para que el usuario vea algo mientras carga.
  document.getElementById("dt-codigo").textContent = codigo;

  mostrarLoader();
  try {
    const licitacion = await obtenerDetalleLicitacion(codigo);
    renderizar(licitacion);
  } catch (error) {
    pintarError(error.message);
  } finally {
    ocultarLoader();
  }
}

// ============================================================
//  RENDERIZADO
//  Función por sección para que sea fácil de leer/mantener.
//  TODO valor pasa por sanitizar(), formatearFecha(), o
//  formatearMonto() — nunca se inserta crudo de la API.
// ============================================================

function renderizar(lic) {
  const cont = document.getElementById("detalle-contenido");
  const estado = infoEstado(lic.CodigoEstado);

  cont.innerHTML = `
    ${renderHeader(lic, estado)}
    ${renderInfoGeneral(lic)}
    ${renderComprador(lic)}
    ${renderDescripcion(lic)}
    ${renderItems(lic)}
  `;
}

function renderHeader(lic, estado) {
  return `
    <div class="detalle-header">
      <div class="codigo">${sanitizar(lic.CodigoExterno)}</div>
      <h1>${sanitizar(lic.Nombre)}</h1>
      <span class="badge-estado ${estado.clase}">${estado.texto}</span>
    </div>`;
}

function renderInfoGeneral(lic) {
  return `
    <section class="info-bloque" aria-labelledby="titulo-info-general">
      <h2 id="titulo-info-general">Información general</h2>
      <dl class="info-grid">
        <div class="dato">
          <dt>Fecha de cierre</dt>
          <dd>${formatearFechaHora(lic.FechaCierre)}</dd>
        </div>
        <div class="dato">
          <dt>Fecha de publicación</dt>
          <dd>${formatearFecha(lic.FechaPublicacion || lic.FechaCreacion)}</dd>
        </div>
        <div class="dato">
          <dt>Fecha estimada de adjudicación</dt>
          <dd>${formatearFecha(lic.FechaEstimadaAdjudicacion)}</dd>
        </div>
        <div class="dato">
          <dt>Tipo</dt>
          <dd>${sanitizar(lic.Tipo)}</dd>
        </div>
        <div class="dato">
          <dt>Modalidad</dt>
          <dd>${sanitizar(lic.Modalidad)}</dd>
        </div>
        <div class="dato">
          <dt>Moneda</dt>
          <dd>${sanitizar(lic.Moneda)}</dd>
        </div>
      </dl>
    </section>`;
}

function renderComprador(lic) {
  // El bloque "Comprador" puede no venir, o venir incompleto.
  // Usamos optional chaining (?.) y sanitizar maneja los nulos.
  const c = lic.Comprador || {};
  return `
    <section class="info-bloque" aria-labelledby="titulo-comprador">
      <h2 id="titulo-comprador">Comprador</h2>
      <dl class="info-grid">
        <div class="dato">
          <dt>Organismo</dt>
          <dd>${sanitizar(c.NombreOrganismo)}</dd>
        </div>
        <div class="dato">
          <dt>Unidad</dt>
          <dd>${sanitizar(c.NombreUnidad)}</dd>
        </div>
        <div class="dato">
          <dt>RUT</dt>
          <dd>${sanitizar(c.RutUnidad)}</dd>
        </div>
        <div class="dato">
          <dt>Dirección</dt>
          <dd>${sanitizar(c.DireccionUnidad)}</dd>
        </div>
        <div class="dato">
          <dt>Comuna</dt>
          <dd>${sanitizar(c.ComunaUnidad)}</dd>
        </div>
        <div class="dato">
          <dt>Región</dt>
          <dd>${sanitizar(c.RegionUnidad)}</dd>
        </div>
      </dl>
    </section>`;
}

function renderDescripcion(lic) {
  return `
    <section class="info-bloque" aria-labelledby="titulo-descripcion">
      <h2 id="titulo-descripcion">Descripción</h2>
      <p class="descripcion-texto">${sanitizar(lic.Descripcion)}</p>
    </section>`;
}

function renderItems(lic) {
  // Items.Listado puede no venir. Si no hay, mostramos placeholder.
  const items = lic.Items?.Listado || [];

  if (items.length === 0) {
    return `
      <section class="info-bloque" aria-labelledby="titulo-items">
        <h2 id="titulo-items">Productos / servicios</h2>
        <p class="text-muted">No se registraron items para esta licitación.</p>
      </section>`;
  }

  const cardsHtml = items.map(itemACard).join("");
  return `
    <section class="info-bloque" aria-labelledby="titulo-items">
      <h2 id="titulo-items">Productos / servicios (${items.length})</h2>
      ${cardsHtml}
    </section>`;
}

function itemACard(item) {
  // Bloque de adjudicación: solo si Adjudicacion existe Y tiene un proveedor real
  let adjudicacionHtml = "";
  const adj = item.Adjudicacion;
  if (adj && adj.RutProveedor) {
    const rutEncoded = encodeURIComponent(adj.RutProveedor);
    adjudicacionHtml = `
      <div class="item-adjudicacion">
        <strong>Adjudicado a:</strong>
        <a href="proveedores.html?rut=${rutEncoded}">${sanitizar(adj.NombreProveedor)}</a>
        — RUT ${sanitizar(adj.RutProveedor)}
        <br>
        Cantidad: ${sanitizar(adj.Cantidad)} ·
        Monto unitario: ${formatearMonto(adj.MontoUnitario)}
      </div>`;
  }

  return `
    <article class="item-card">
      <div class="item-titulo">${sanitizar(item.NombreProducto)}</div>
      <div class="item-meta">
        Código ${sanitizar(item.CodigoProducto)} · Categoría: ${sanitizar(item.Categoria)}
      </div>
      <div class="item-descripcion">${sanitizar(item.Descripcion)}</div>
      <div class="item-meta">
        Cantidad: <strong>${sanitizar(item.Cantidad)}</strong>
        ${item.UnidadMedida ? `${sanitizar(item.UnidadMedida)}` : ""}
      </div>
      ${adjudicacionHtml}
    </article>`;
}

// ============================================================
//  ERROR
// ============================================================

function pintarError(mensaje) {
  document.getElementById("detalle-contenido").innerHTML = `
    <div class="estado-vacio error" role="alert">
      <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
      <h2>No pudimos cargar el detalle</h2>
      <p>${sanitizar(mensaje)}</p>
      <a href="licitaciones.html" class="btn-primario mt-3">
        <i class="bi bi-arrow-left" aria-hidden="true"></i> Volver al listado
      </a>
    </div>`;
}
