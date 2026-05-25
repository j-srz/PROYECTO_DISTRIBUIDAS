# Constructor de Consultas - Base de Datos Distribuida

Este proyecto es una herramienta académica interactiva diseñada para demostrar y validar los principios de **transparencia de repetición y fragmentación** en bases de datos distribuidas. Proporciona una interfaz visual donde los usuarios pueden construir consultas SQL sobre un esquema lógico de tablas, mientras el sistema resuelve de manera transparente qué fragmentos físicos y desde qué nodos (localidades) se deben extraer los datos.

El problema principal que resuelve es la optimización de consultas en una topología de red distribuida. Al ejecutar una consulta, el sistema no solo identifica qué fragmentos específicos de información son necesarios, sino que también determina qué nodos habilitados disponen de esa información y calcula la ruta más corta (en saltos de red) desde el nodo donde se origina la consulta. Todo esto ocurre sin que el usuario tenga que conocer la distribución física de la base de datos subyacente.

---

## Arquitectura del proyecto

El proyecto está construido en React y sigue una arquitectura modular donde el estado y los componentes de interfaz están estrictamente separados de la lógica algorítmica y la definición de los datos.

```text
src/
├── data.js              — Fuente única de verdad. Define el grafo, fragmentos, tablas y constantes.
├── App.jsx              — Raíz del árbol de componentes. Gestiona el estado global de la consulta.
├── main.jsx             — Punto de entrada de la aplicación React.
├── index.css            — Estilos base globales y animaciones de keyframes para componentes.
├── components/
│   ├── Constructor.jsx  — Constructor visual de la consulta (modos lista/gráfico, WHERE, ejecutar).
│   ├── DiagramaER.jsx   — Modo gráfico interactivo con nodos arrastrables para la selección.
│   ├── MinimapaGrafo.jsx— Widget flotante del grafo con sus estados compacto, minimizado y expandido.
│   ├── MonitorSQL.jsx   — Muestra en tiempo real la consulta lógica SQL generada por el usuario.
│   └── ResultadosPlan.jsx — Presenta el plan de ejecución físico con localidades y fragmentos elegidos.
└── utils/
    └── tuningAlgorithm.js — Algoritmo de sintonía y resolución BFS de consultas distribuidas.
```

---

## `data.js` — Fuente única de verdad

`data.js` es el núcleo de datos del dominio. **Cualquier cambio en este archivo se refleja automáticamente en toda la aplicación al recargar.** Ningún otro archivo debe definir valores del dominio, ni colores, ni topología. Contiene:

- **`GRAFO`**: Estructura de la topología de red. Define para cada localidad (ej. `"L1"`) un array de `conexiones` (nodos adyacentes) y `tablas` (fragmentos de Alumno o tablas completas almacenadas localmente).
- **`FRAGMENTOS_ALUMNO`**: Define los fragmentos en los que se dividió la tabla `Alumno` (`Alumno1a`, `Alumno1b`, `Alumno2a`, `Alumno2b`). Indica qué campos contiene el fragmento (fragmentación vertical) y su `condicion` lógica (fragmentación horizontal, ej. `Titulo = 'Lic'`).
- **`TABLAS_LOGICAS`**: Las 5 entidades completas que interactúan con el usuario: `Alumno`, `Carrera`, `Materia`, `Maestro`, `Califica`. Describe sus atributos totales.
- **`CAMPO_A_FRAGMENTOS`**: Un mapa crucial que asocia el nombre de un campo específico (ej. `"NoCtrl"`) con la lista de fragmentos o tablas que lo contienen físicamente. Se usa para resolver en qué fragmentos buscar la información pedida.
- **`COLORES_TABLA`**: Define la identidad visual (color de fondo, borde y texto) para cada entidad. Su uso garantiza consistencia entre la UI del constructor, el diagrama interactivo y los resultados.
- **`POSICIONES_INICIALES_ER`** y **`FISICA_ER`**: Constantes usadas en el componente `DiagramaER` para inicializar el layout inicial de las tablas en el lienzo y parametrizar la inercia/fricción de los nodos.
- **`ESTADO_INICIAL`**: Valores de inicio al cargar la app (localidad focal `L1`, todas habilitadas, consulta vacía).
- **`FEATURE_FLAGS`**: Banderas de control de características. Ej. `displayGraphicSelect` permite ocultar/mostrar el modo gráfico interactivo.
- **`OPERADORES`**: Un array con los operadores de comparación permitidos para el filtro lógico (WHERE).

**Cualquier cambio en `data.js` se refleja automáticamente en toda la aplicación al recargar. Ningún otro archivo debe definir valores del dominio.**

---



## Componentes principales

### `MinimapaGrafo.jsx`
- **Qué renderiza:** El diagrama del grafo de localidades en forma de widget flotante con nodos y conexiones (SVG).
- **Estado:** Controla una máquina de estados para la vista (`compact`, `minimized`, `expanded`, `restoring`, `minimizing`). Administra una simulación de inercias físicas 2D (drag bounds) mediante `requestAnimationFrame`.
- **Interacciones:** Clic para cambiar `localidadActiva`, botones en cada nodo para deshabilitarlos/habilitarlos. Botones de esquina superior/inferior para colapsarlo a círculo o expandirlo sobre un `backdrop-blur`.
- **Decisiones:** Los 3 estados son mutuamente excluyentes; se usa CSS transition y `transform-origin` para una animación orgánica entre un círculo encogido y una ventana flotante, manteniendo consistencia total del estado de nodos sin importar la vista.

### `DiagramaER.jsx`
- **Qué renderiza:** Un motor relacional (modo de selección gráfico) que visualiza las tablas como tarjetas flotantes.
- **Estado:** Controla estados físicos locales de cada tabla flotante, independientemente del widget minimapa. 
- **Interacciones:** Selección interactiva clickeando campos, o doble click para selecciones absolutas. Se infieren dinámicamente conexiones visuales uniendo campos homólogos (llaves foráneas conceptuales).
- **Decisiones:** Sus coordenadas base vienen de `POSICIONES_INICIALES_ER` (y cualquier futura se asigna a un default `[20,20]`). La física permite acomodar la tabla libremente arrastrando su barra de título con inercia limitada.

### `Constructor.jsx`
- **Qué renderiza:** El core layout lateral para armar lógicamente los fragmentos y comandos. Intercambia las interfaces (lista o gráfico) dictaminado por su propio sub-estado (que a su vez está sujeto a `displayGraphicSelect`).
- **Estado:** Funciona como un orquestador ciego para los props inyectados por `App.jsx` que gobiernan los campos seleccionados y las condiciones (WHERE).
- **Interacciones:** Mapea el arreglo de opciones `OPERADORES` hacia el select, extrae campos de la selección actual, y notifica la ejecución (`onExecute`).

