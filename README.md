# Fast Style Editor

Editor visual de estilos en tiempo real para páginas web. Detecta los elementos de una página (`div`, `span`, `p`, `ul`, `ol`, `table`, títulos, botones, etc.), muestra su color de texto, color de fondo y tipografía, y te deja **editarlos en vivo** con un selector de color al estilo Google Sheets. Al final te entrega el **CSS de tus cambios** listo para copiar.

Hecho con **Node.js + React (Vite)**.

---

## Características

- **Detección de elementos:** resaltado al pasar el mouse y selección con click. Muestra etiqueta, clases, texto, color, fondo, fuente, tamaño y peso.
- **Selector de color** (pestañas *Texto* / *Fondo*): cuadro de saturación/brillo, barra de tono, cuentagotas (Chrome/Edge), campos Hexadecimal y R/V/B, y botones *Cancelar* / *Aceptar*.
- **Editor de fuente:** familia, tamaño (slider + número) y peso (100–900), todo en tiempo real.
- **Árbol de estructura:** navegá los elementos de la página (incluye listas y tablas anidadas) y seleccionalos desde el panel.
- **Restaurar** un elemento a su estado original.
- **Exportar CSS:** genera el CSS de todos los elementos editados y lo copia al portapapeles.
- **Integrable en tus proyectos:** plugin de Vite (solo desarrollo) o snippet de una línea para proyectos sin Vite.

## Requisitos

- **Node.js 18 o superior** y npm.

## Instalación

```bash
git clone <URL-DEL-REPO> style-inspector
cd style-inspector
npm install
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Modo desarrollo: editor en **http://localhost:5173** + servidor proxy en el puerto 4000. |
| `npm start` | Compila el editor y lo sirve todo desde **http://localhost:4000**. |
| `npm run build` | Compila el editor en `dist/`. |
| `npm run build:plugin` | Regenera el editor embebido en `plugin/editor/` (usado por el plugin de Vite). |

> El puerto del servidor es el 4000. Podés cambiarlo con `PORT=4100 npm start`, pero en `npm run dev` el puerto 4000 está fijo en `vite.config.js`.

## Uso rápido

1. Ejecutá `npm run dev` y abrí http://localhost:5173.
2. Escribí una URL (por ejemplo `https://example.com` o tu app local `http://localhost:3000`) y presioná **Cargar**.
3. Pasá el mouse por la página y hacé click en un elemento, o elegilo desde **Estructura** (columna izquierda).
4. Editá color de texto, color de fondo y fuente en el panel derecho. Los cambios se ven al instante.
5. Copiá el resultado con **Copiar** en *CSS de tus cambios*.

## Integrarlo en tus proyectos

### A) Proyectos con Vite (React, Vue, etc.) — recomendado

1. Copiá la carpeta `plugin/` a un lugar común (por ejemplo `~/tools/style-inspector/plugin`) o usá el zip `style-inspector-plugin.zip`.
2. En tu proyecto:
   ```bash
   npm i -D ../ruta/a/style-inspector/plugin
   ```
3. En `vite.config.js`:
   ```js
   import react from '@vitejs/plugin-react';
   import styleInspector from 'style-inspector-plugin';

   export default defineConfig({
     plugins: [react(), styleInspector()],
   });
   ```
4. Ejecutá `npm run dev` de tu proyecto. Aparece un botón 🎨 abajo a la derecha que abre el editor sobre tu app, o entrá directo a `http://localhost:5173/__inspector`.

El plugin funciona **solo en desarrollo**: no se incluye en `vite build`.

### B) Proyectos sin Vite (Next, CRA, HTML, Express…)

Dejá Fast Style Editor corriendo (`npm run dev`) y agregá este script a tu página **solo durante el desarrollo**:

```html
<script src="http://localhost:4000/inspector.js" data-editor="http://localhost:5173/"></script>
```

Aparece el botón 🎨. Quitá el script antes de publicar.

## Cómo funciona

```
┌─────────────── Editor (React) ───────────────┐
│  Estructura │      <iframe>      │  Panel     │
│   (árbol)   │  página a editar   │ color/fuente│
└──────┬──────┴─────────┬──────────┴─────┬──────┘
       │   postMessage  │                │
       └────────► inspector.js (dentro de la página) ◄────┘
```

- Para páginas externas, el servidor Node (`/proxy?url=…`) descarga el HTML, agrega `<base>` e inyecta `inspector.js`, de modo que el editor pueda leer y modificar el DOM.
- `inspector.js` corre dentro de la página: detecta elementos, aplica los estilos recibidos por `postMessage` y arma el árbol y el CSS exportado.
- En modo plugin (Vite), la página es del mismo origen, así que se carga directo en el iframe, sin proxy.

## Estructura del proyecto

```
style-inspector/
├── server/index.js            # Servidor Express: proxy + inyección de inspector.js
├── public/inspector.js        # Script inyectado en la página objetivo
├── src/
│   ├── App.jsx                # Layout y comunicación con el iframe
│   ├── color.js               # Conversión HSV / RGB / HEX
│   └── components/
│       ├── ColorPicker.jsx    # Selector de color (Texto / Fondo)
│       ├── FontEditor.jsx     # Familia, tamaño y peso
│       └── ElementTree.jsx    # Árbol de elementos
├── plugin/                    # Plugin de Vite (con el editor ya compilado)
├── vite.config.js
└── vite.embed.config.js       # Build del editor para el plugin
```

## Límites conocidos

- Los cambios son **visuales y temporales** (viven en el navegador). Para llevarlos a tu código usá *Copiar CSS*; los selectores generados pueden necesitar ajustes.
- Las fuentes disponibles son las del sistema (no hay Google Fonts).
- Sitios muy dinámicos (React/Vue) pueden redibujarse y pisar los cambios; el botón ↻ de *Estructura* vuelve a leer la página.
- Algunos sitios externos cargan recursos o scripts que no funcionan bien a través del proxy.
- El cuentagotas solo está en navegadores con la API `EyeDropper` (Chrome, Edge).

## Seguridad

- El proxy descarga **cualquier URL** que se le pida. Usalo **solo en local** y no expongas el puerto 4000 a la red ni lo subas a un servidor público.
- El plugin de Vite y el script del snippet son para **desarrollo**; no los dejes en producción.

## Solución de problemas

| Síntoma | Qué revisar |
|---|---|
| Solo veo los estilos pero no los controles de edición | Estás corriendo una versión vieja: cortá el servidor, usá la carpeta más reciente, `npm install`, `npm run dev` y recargá con Ctrl+Shift+R. |
| La página no carga en el iframe | Probá con la URL completa (`https://…`). Si es tu app local, verificá que esté corriendo. |
| No aparece el botón 🎨 | Confirmá que el plugin está en `vite.config.js` y que reiniciaste el servidor de desarrollo. |
| Mis cambios desaparecen solos | La página se redibujó; volvé a aplicarlos o usá ↻. |

## Licencia

Uso interno de **Blacksmith Lab**. Definí la licencia antes de publicar el repositorio.
