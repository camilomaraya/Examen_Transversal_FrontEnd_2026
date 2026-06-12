// ============================================================
//  PROVEEDORES — lógica de página
//  Flujo:
//   1. Auto-formato del RUT mientras el usuario escribe
//   2. Al submit: validar RUT (formato + dígito verificador)
//   3. Si es válido: loader → API → render
//   4. Maneja: vacío, formato inválido, DV inválido, no encontrado, error de red
//   5. Si la URL trae ?rut=XXX (viene del detalle), pre-llena y busca
// ============================================================

document.addEventListener("DOMContentLoaded", iniciar);

function iniciar() {
  const input = document.getElementById("input-rut");
  const form = document.getElementById("form-rut");

  // 1) Auto-formato en cada tecla.
  //    Manejamos la posición del cursor para que no salte al final
  //    cuando se inserta un punto en medio del texto.
  input.addEventListener("input", (e) => {
    const valor = e.target.value;
    const formateado = formatearRut(valor);
    e.target.value = formateado;
    // Limpiamos el error mientras el usuario edita (UX más amable)
    document.getElementById("error-rut").textContent = "";
  });

  // 2) Submit
  form.addEventListener("submit", buscarProveedorHandler);

  // 3) Pre-llenado desde ?rut=XXX (viene del detalle de licitación adjudicada)
  const rutDesdeUrl = paramUrl("rut");
  if (rutDesdeUrl) {
    input.value = formatearRut(rutDesdeUrl);
    // Disparamos la búsqueda automáticamente
    form.requestSubmit();
  }
}

// ============================================================
//  SUBMIT: validar, mostrar loader, llamar API, renderizar
// ============================================================

async function buscarProveedorHandler(evento) {
  evento.preventDefault();

  const rutInput = document.getElementById("input-rut").value;

  // 1) VALIDACIÓN
  const { valido, error } = validarRut(rutInput);
  if (!valido) {
    document.getElementById("error-rut").textContent = error;
    document.getElementById("resultado").innerHTML = "";
    return;
  }
  // Si pasó la validación, limpiamos el error
  document.getElementById("error-rut").textContent = "";

  // 2) LOADER
  document.getElementById("resultado").innerHTML = "";
  mostrarLoader();

  // 3) API + render
  try {
    const proveedor = await buscarProveedor(rutInput);
    if (proveedor === null) {
      pintarNoEncontrado(rutInput);
    } else {
      pintarProveedor(proveedor, rutInput);
    }
  } catch (error) {
    pintarError(error.message);
  } finally {
    ocultarLoader();
  }
}

// ============================================================
//  RENDER: 3 estados (encontrado, no encontrado, error)
// ============================================================

function pintarProveedor(proveedor, rutBuscado) {
  const cont = document.getElementById("resultado");
  cont.innerHTML = `
    <div class="proveedor-card" role="region" aria-labelledby="titulo-prov">
      <div class="icono-proveedor" aria-hidden="true">
        <i class="bi bi-building-check"></i>
      </div>
      <h2 id="titulo-prov">${sanitizar(proveedor.NombreEmpresa)}</h2>

      <div class="dato-proveedor">
        <span class="label">RUT</span>
        <span class="valor">${sanitizar(rutBuscado)}</span>
      </div>
      <div class="dato-proveedor">
        <span class="label">Código de empresa</span>
        <span class="valor">${sanitizar(proveedor.CodigoEmpresa)}</span>
      </div>

      <p class="text-muted mt-4 mb-0" style="font-size: .85rem;">
        <i class="bi bi-info-circle" aria-hidden="true"></i>
        Información oficial de Mercado Público. Para ver el historial de contratos
        de este proveedor, visita su perfil en mercadopublico.cl.
      </p>
    </div>`;
}

function pintarNoEncontrado(rutBuscado) {
  const cont = document.getElementById("resultado");
  cont.innerHTML = `
    <div class="estado-vacio" role="status">
      <i class="bi bi-search" aria-hidden="true"></i>
      <h2>Proveedor no encontrado</h2>
      <p>No existe un proveedor registrado con el RUT <strong>${sanitizar(rutBuscado)}</strong> en Mercado Público.</p>
    </div>`;
}

function pintarError(mensaje) {
  const cont = document.getElementById("resultado");
  cont.innerHTML = `
    <div class="estado-vacio error" role="alert">
      <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
      <h2>No pudimos completar la búsqueda</h2>
      <p>${sanitizar(mensaje)}</p>
    </div>`;
}
