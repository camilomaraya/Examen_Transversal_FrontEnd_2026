// ============================================================
//  CONFIGURACIÓN GLOBAL — LicitaSeguro
//  Único lugar donde cambias el ticket o la estrategia de red.
//  Si algo de conexión falla, lo arreglas AQUÍ, no en 5 archivos.
// ============================================================

const CONFIG = {
  // --- Ticket de la API de Mercado Público ---
  // El del instructivo (AC3A098B-...) está CAÍDO (devuelve "Ticket no válido").
  // F8537A18-... es el ticket público de PRUEBA, pero está saturado (da 429).
  // >>> Solicita el TUYO en: https://api.mercadopublico.cl/modules/Participa.aspx
  //     Cuando llegue por correo, pégalo aquí y todo funciona.
  TICKET: "EF40061E-2D72-417A-BE95-98A0DF12347B",

  // --- Proxy CORS ---
  // La API NO envía cabeceras CORS, así que el navegador bloquea el fetch directo.
  // Pasamos por un proxy. Si uno falla, cambia SOLO esta línea por la otra opción:
  //   Opción A: "https://corsproxy.io/?url="
  //   Opción B: "https://api.allorigins.win/raw?url="
  PROXY: "https://corsproxy.io/?url=",

  // --- Endpoints base ---
  BASE_LICITACIONES: "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json",
  BASE_PROVEEDOR: "https://api.mercadopublico.cl/servicios/v1/Publico/Empresas/BuscarProveedor",
};
