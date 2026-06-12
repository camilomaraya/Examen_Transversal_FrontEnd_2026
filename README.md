# LicitaSeguro

Portal web para la consulta de licitaciones públicas y proveedores del Estado de Chile.
Consume directamente la API pública de Mercado Público (Dirección ChileCompra) y presenta
la información en una interfaz pensada para que cualquier persona pueda consultarla sin
intermediarios.

**Examen final — Desarrollo Frontend, Instituto Profesional San Sebastián, junio 2026.**

- **Desarrollado por:** Camilo Meriño Araya


---

## Tabla de contenidos

1. [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
2. [Configuración](#configuración)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Stack técnico](#stack-técnico)
5. [Diseño UI/UX](#diseño-uiux-y-justificación-visual)
6. [Consumo de endpoints y manejo de errores](#consumo-de-endpoints-y-manejo-de-errores)
7. [Validación del RUT](#validación-del-rut)
8. [Accesibilidad](#accesibilidad)

---

## Cómo ejecutar el proyecto

**Requisitos:** un navegador moderno  y un servidor local.
No funciona abriendo el archivo HTML directamente con doble clic, porque las peticiones a
través del proxy CORS requieren un origen http(s).

**Pasos:**

1. Descomprimir el ZIP.
2. Abrir la carpeta `licitaseguro/` en Visual Studio Code u otro editor.
3. Levantar un servidor local. La forma más simple es la extensión **Live Server** de VS Code:
   - Click derecho sobre `index.html` → "Open with Live Server".
   - El navegador abre la app en `http://127.0.0.1:5500` (o similar).
4. Navegar por los 4 módulos: Homepage, Licitaciones, Detalle y Proveedores.

o clonar repositorio desde [Examen Transversal Frontend 2026](https://github.com/camilomaraya/Examen_Transversal_FrontEnd_2026).

---

## Configuración

Toda la configuración de red está centralizada en `js/config.js`:

```javascript
const CONFIG = {
  TICKET: "EF40061E-2D72-417A-BE95-98A0DF12347B",
  PROXY: "https://corsproxy.io/?url=",
  BASE_LICITACIONES: "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json",
  BASE_PROVEEDOR: "https://api.mercadopublico.cl/servicios/v1/Publico/Empresas/BuscarProveedor",
};
```

- **TICKET**: ticket de acceso a la API de Mercado Público. Se obtiene gratis en
  [api.mercadopublico.cl/modules/IniciarSesion.aspx](https://api.mercadopublico.cl/modules/IniciarSesion.aspx).
- **PROXY**: la API de Mercado Público no envía cabeceras CORS, por lo que el navegador
  bloquea las peticiones directas. Se usa un proxy público (corsproxy.io) configurado en
  una sola línea.

Cualquier cambio de credencial o estrategia de red se hace exclusivamente en este archivo;
el resto de la aplicación no conoce ni el ticket ni la URL real.

---

## Estructura del proyecto

```
licitaseguro/
├── index.html              ← Homepage corporativo
├── licitaciones.html       ← Listado con filtros y paginación
├── detalle.html            ← Detalle de licitación (?codigo=XXXX-XX-XX)
├── proveedores.html        ← Búsqueda por RUT (?rut=XXX)
├── README.md               ← Este documento
├── css/
│   └── styles.css          ← Sistema de diseño (variables CSS) + estilos
└── js/
    ├── config.js           ← Ticket de API y proxy (única fuente)
    ├── api.js              ← Capa de comunicación con Mercado Público
    ├── utils.js            ← Helpers compartidos (sanitizar, formatear, RUT, loader)
    ├── licitaciones.js     ← Lógica del listado
    ├── detalle.js          ← Lógica del detalle
    └── proveedores.js      ← Lógica del buscador
```

El código se organiza en **capas con una sola responsabilidad cada una**:

- **config**: credenciales y estrategia de red.
- **api**: las tres funciones que conversan con Mercado Público (`obtenerLicitaciones`, `obtenerDetalleLicitacion`, `buscarProveedor`).
- **utils**: helpers reutilizables.
- **vistas**: un JS por página, importa las capas anteriores.

El resto de la aplicación interactúa exclusivamente con las funciones de `api.js` sin
conocer URLs, headers ni códigos HTTP.

---

## Stack técnico

- **HTML5 semántico**: `header`, `main`, `nav`, `section`, `article`, `footer`.
- **CSS3** con variables (design tokens), Grid y Flexbox.
- **JavaScript ES6+** vanilla: `async/await`, `fetch`, separación por archivo y función.
- **Bootstrap 5** vía CDN, exclusivamente para grid responsive y utilidades de espaciado.
- **Bootstrap Icons** (font icon) y **Google Fonts (Inter)** vía CDN.
- **API Mercado Público** (api.mercadopublico.cl) como única fuente de datos.

---

## Diseño UI/UX

### Paleta de colores

Se descartaron tres direcciones consideradas inicialmente:

- **Azul navy + ámbar**: demasiado convencional, asociada a fintech y servicios gubernamentales en general.
- **Negro + cobalto**: estilo bauhaus distintivo pero frío para un servicio de información pública.
- **Charcoal + terracotta**: cálido pero cercano a paletas editoriales oscuras existentes.


### Tipografía

Se eligió **Inter** (Google Fonts), sans-serif humanista, por:

- Optimizada para pantalla (no para impresión), alta legibilidad en tamaños pequeños.
- Soporte completo de español (tildes, eñe).
- Múltiples pesos (400, 500, 600, 700) que permiten jerarquía sin cambiar de familia.


### Iconografía y espaciado

Se utiliza **Bootstrap Icons** (vía CDN) por consistencia visual. Todos los iconos son
decorativos y llevan `aria-hidden="true"` (el texto adyacente describe la acción).



### Técnicas aplicadas

- **Grid de Bootstrap** para columnas de módulos y filtros.
- **CSS Grid con auto-fit + minmax** en la sección de información del detalle: las columnas
  se reorganizan según el ancho disponible sin necesidad de breakpoints adicionales.
- **Tipografía fluida con `clamp()`** en h1/h2 (1.8rem mínimo, 2.6rem máximo).
- **Media queries específicas** en 768px y 576px para ajustar padding del hero y de las cards.

Todos los breakpoints están documentados con comentarios en `css/styles.css`.


## Consumo de endpoints y manejo de errores

El consumo se diseñó para consumir todos los endpoints con parsing robusto del JSON y manejo de escenarios con control de códigos HTTP.

### Endpoints consumidos

1. **Listado de licitaciones** (filtrable por fecha y/o estado):
   `GET /licitaciones.json?fecha=ddmmaaaa&estado=name&ticket=cod`
2. **Detalle de licitación** (por código):
   `GET /licitaciones.json?codigo=XXXX-XX-XX&ticket=cod`
3. **Búsqueda de proveedor** (por RUT):
   `GET /BuscarProveedor?rutempresaproveedor=XX.XXX.XXX-X&ticket=cod`

### Función central `pedirJSON`

Todas las llamadas pasan por una función única que maneja secuencialmente cuatro escenarios
de error, en este orden:

```javascript
async function pedirJSON(urlApi) {
  let respuesta;

  // 1) Error de RED (sin internet, proxy caído, DNS, etc.)
  try {
    respuesta = await fetch(construirUrl(urlApi));
  } catch (error) {
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión a internet.");
  }

  // 2) Manejo de CÓDIGOS HTTP
  if (respuesta.status === 429) throw new Error("Demasiadas peticiones (429). El ticket está sin cupo...");
  if (respuesta.status >= 500) throw new Error("El servidor de Mercado Público no está disponible...");
  if (!respuesta.ok) throw new Error("Error " + respuesta.status + " al consultar la API.");

  // 3) Parseo ROBUSTO del JSON
  let datos;
  try {
    datos = await respuesta.json();
  } catch (error) {
    throw new Error("La respuesta del servidor no es un JSON válido.");
  }

  // 4) Error LÓGICO: API responde 200 pero con {Codigo, Mensaje}
  //    Ej: ticket inválido → {"Codigo":203,"Mensaje":"Ticket no válido."}
  if (datos && datos.Codigo && datos.Mensaje) {
    throw new Error("API: " + datos.Mensaje + " (código " + datos.Codigo + ").");
  }
  return datos;
}
```

### Mensajes contextualizados

Cada escenario produce un mensaje específico:

| Escenario | Mensaje al usuario |
|---|---|
| Ticket inválido | `"API: Ticket no válido. (código 203)"` |
| Servidor saturado (429) | `"Demasiadas peticiones. El ticket está sin cupo..."` |
| Servidor caído (5xx) | `"El servidor de Mercado Público no está disponible..."` |
| Sin conexión | `"No se pudo conectar con el servidor..."` |
| Código no encontrado | `"No se encontró la licitación con código XXX."` |
| RUT no registrado | `"Proveedor no encontrado"` (con el RUT buscado) |
| URL sin parámetro | Validación previa al fetch, sin llamar a la API |

### Manejo de campos nulos

La función `sanitizar()` reemplaza automáticamente cualquier valor `null`, `undefined` o
vacío por el placeholder `"--"` antes de insertarlo en el DOM. Adicionalmente, previene
**XSS** escapando entidades HTML. Toda la información de la API pasa por esta función.

### Loader bloqueante

El loader se muestra antes del fetch y se oculta en el bloque `finally` — esto garantiza
que se oculte aunque la petición falle. Mientras está visible, el contenido se reemplaza
por el spinner, evitando interacciones con datos obsoletos.

---

## Validación del RUT

La búsqueda de proveedores incluye validación completa del RUT chileno con cuatro niveles
de error y autoformato en tiempo real.

### Niveles de validación

1. **Campo vacío** → `"Ingresa un RUT para buscar."`
2. **Caracteres no permitidos** → `"El RUT solo puede contener números, puntos, guión y la letra K."`
3. **Longitud inválida** → `"El RUT debe tener entre 8 y 10 caracteres (sin puntos ni guión)."`
4. **Dígito verificador inválido** (módulo 11) → `"El dígito verificador no corresponde. Revisa el RUT."`

El cuarto caso es el más relevante: muchos validadores superficiales aceptan cualquier RUT
con formato correcto (ej: `11.111.111-1`). La implementación calcula el dígito verificador
con el algoritmo módulo 11 estándar del SII chileno y rechaza RUTs falsos.

### Autoformato en tiempo real

A medida que el usuario tipea, el RUT se formatea automáticamente:

- `"776533823"` → `"77.653.382-3"`
- `"12345678k"` → `"1.234.567-8K"`

El listener escucha el evento `input` y reescribe el valor del campo con `formatearRut()`.

### Pre-llenado entre módulos

Si la URL trae `?rut=XXX` (caso típico: se llega desde el link "Adjudicado a..." en el
detalle de una licitación), el input se pre-llena y la búsqueda se dispara automáticamente.
Esto cierra el flujo entre los tres módulos del sitio.

---

## Accesibilidad

### Semántica HTML

- Todas las páginas usan landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- Atributo `lang="es"` en cada documento.
- Todas las páginas comienzan con un **skip link** que permite saltar al contenido principal
  (cumple WCAG 2.4.1 "Bypass Blocks").

### Labels y formularios

Cada input tiene un `<label>` asociado con `for`. Los errores se vinculan al input con
`aria-describedby` para que el lector de pantalla los lea automáticamente. Los mensajes
de error usan `role="alert"` y `aria-live="polite"`.

```html
<label for="filtro-fecha">Fecha de publicación</label>
<input type="date" id="filtro-fecha"
       aria-describedby="error-fecha ayuda-fecha">
<small id="ayuda-fecha">Opcional. Si no eliges fecha, debes seleccionar un estado.</small>
<div id="error-fecha" class="error-inline" role="alert" aria-live="polite"></div>
```

### Atributos ARIA aplicados

| Atributo | Dónde |
|---|---|
| `aria-label` | Navegación principal, botón hamburguesa, botones de paginación |
| `aria-labelledby` | Secciones con título visible (vincula `<h2>` al `<section>`) |
| `aria-current="page"` | Link activo del navbar |
| `aria-describedby` | Inputs con texto de ayuda y errores |
| `aria-live="polite"` | Mensajes de error, regiones que cambian dinámicamente |
| `aria-hidden="true"` | Iconos decorativos (no se leen dos veces) |
| `role="status"` | Contenedor del loader |
| `role="alert"` | Errores críticos |

### Navegación por teclado

Todos los elementos interactivos son alcanzables con `Tab` en orden lógico. El foco se
gestiona explícitamente en transiciones dinámicas: al cambiar de página en el listado,
el foco se mueve al primer resultado.

El estado de foco es visualmente prominente:

```css
*:focus-visible {
  outline: 3px solid var(--color-acento);
  outline-offset: 2px;
  border-radius: 4px;
}
*:focus:not(:focus-visible) { outline: none; }
```

`:focus-visible` muestra el outline solo cuando el usuario navega con teclado, no con mouse.


### Imágenes y elementos gráficos

El proyecto no utiliza imágenes raster. Los iconos vienen de Bootstrap Icons
con `aria-hidden="true"` porque son decorativos; el texto adyacente describe la acción en
todos los casos.


## Notas finales

El proyecto demuestra que es posible construir una interfaz transparente sobre una API
de datos públicos respetando, simultáneamente, criterios profesionales de diseño,
responsividad, accesibilidad y mantenibilidad, utilizando exclusivamente las tecnologías
permitidas por el enunciado.

**Fuente de datos:** [api.mercadopublico.cl](https://api.mercadopublico.cl/)
