// ============================================================
//  CONFIGURACIÓN GLOBAL — LicitaSeguro
//  Único lugar donde cambias el ticket o la estrategia de red.
//  Si algo de conexión falla, lo arreglas AQUÍ, no en 5 archivos.
// ============================================================

const CONFIG = {
  // --- Ticket de la API de Mercado Público --- // 
  TICKET: "EF40061E-2D72-417A-BE95-98A0DF12347B",

  // --- Proxy CORS ---
  PROXY: "https://corsproxy.io/?url=",

  // --- Endpoints base ---
  BASE_LICITACIONES: "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json",
  BASE_PROVEEDOR: "https://api.mercadopublico.cl/servicios/v1/Publico/Empresas/BuscarProveedor",
};
