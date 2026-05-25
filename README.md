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
│   ├── TablaCatalogoDinamica.jsx — Widget flotante interactivo con la vista completa de disponibilidad de fragmentos.
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

## El algoritmo de sintonía (`tuningAlgorithm`)

El corazón del sistema. Provee transparencia de distribución y fragmentación calculando de dónde sacar la información requerida, realizando una poda inteligente y encontrando los caminos más óptimos en la topología definida.

### 4.1 Contexto teórico
El usuario ensambla lógicamente "Dame el Nombre y la Calificación" sobre tablas lógicas sin saber que están físicamente fragmentadas y distribuidas en múltiples nodos. `Nom` y `Calificacion` están divididos en distintos nodos y adicionalmente `Alumno` sufre fragmentación mixta. El algoritmo se encarga de determinar qué pedazos físicos son necesarios, podarlos si el WHERE los descarta teóricamente (sintonía), y localizar el nodo físico más próximo para recabar los datos, asegurando la menor latencia (saltos) posible sin perder la ilusión de usar una base de datos centralizada.

### 4.2 Entradas del algoritmo
El módulo `simulateTuning` recibe:
- `camposSeleccionados` — Array de objetos de la forma `{ tabla, campo }` (las columnas solicitadas).
- `localidadActiva` — `String` que indica el punto de origen de la red desde donde el usuario invoca la consulta.
- `localidadesHabilitadas` — Array de `Strings` con los nodos de la red que se asumen en línea.
- `condicion` — Objeto con `{ tabla, field, operator, value }` con el criterio de filtrado (el WHERE).

### 4.3 Paso 1 — Determinación de fragmentos requeridos
Se analiza cada campo solicitado. 
- Para campos de tablas que **no son Alumno**: el fragmento requerido es la tabla misma (ej. `Califica` → fragmento `Califica`).
- Para campos de la tabla **Alumno**: se consulta `CAMPO_A_FRAGMENTOS[campo]` para obtener los fragmentos físicos candidatos (`Alumno1a`, `Alumno1b`, `Alumno2a`, `Alumno2b`).
- Ejemplo: seleccionar `Nom` de `Alumno` y `Calificacion` de `Califica` → fragmentos requeridos: `{Alumno1a, Alumno2a, Califica}`.

### 4.4 Paso 2 — Sintonía por criterio de fragmentación
Teniendo el listado de fragmentos físicos, el algoritmo comprueba la cláusula WHERE para intentar **podar** fragmentos descartables.
- Solo aplica cuando la condición WHERE involucra el campo `Titulo` de `Alumno` con valor `'Lic'` o `'Ing'`.
- Si `Titulo = 'Lic'`: elimina `Alumno2a` y `Alumno2b` — solo los Lic están en los fragmentos `1x`.
- Si `Titulo = 'Ing'`: elimina `Alumno1a` y `Alumno1b` — solo los Ing están en los fragmentos `2x`.
- Cualquier otra condición: conserva todos los fragmentos (no se puede descartar sin ejecutar la consulta).
- Esto es una optimización fundamental: reduce el número de nodos a consultar cuando la condición coincide con el criterio de fragmentación horizontal.

### 4.5 Paso 3 — Creación de la Tabla Catálogo Dinámica
Se construye explícitamente una vista que lista todos los fragmentos habilitados en las localidades activas (el universo de datos disponibles). Por cada fragmento, se calculan las distancias BFS hacia su localidad origen. La tabla se ordena por fragmento y distancia ascendente.

### 4.6 Paso 4 — Verificación de disponibilidad
Se cruza la lista de fragmentos requeridos con la tabla catálogo dinámica. Si algún fragmento requerido no está en la tabla (no hay ninguna localidad habilitada que lo contenga), el algoritmo determina que la consulta no es posible y se detiene (retornando la tabla para fines informativos).

### 4.7 Paso 5 — Construcción del Plan Óptimo
Se itera ordenadamente sobre la tabla catálogo dinámica. Debido al ordenamiento estable por distancia, la primera fila que corresponda a un fragmento requerido garantiza ser la opción más cercana (con menor número de saltos). Se recolectan estas selecciones y se empaquetan en el `plan` definitivo de ejecución.

Ejemplo visual con la topología actual:
```text
Localidad activa: L1
Fragmento buscado: Alumno2a (disponible en L3 y L8)
BFS desde L1:
  L1 → distancia 0
  L2, L5 → distancia 1
  L3, L4, L6, L9 → distancia 2
  L7, L8 → distancia 3
Resultado: L3 (distancia 2) es más cercana que L8 (distancia 3) → se elige L3
```

### 4.8 Construcción del resultado
Al finalizar el recorrido y resolver todos los fragmentos, se formatea la respuesta en un objeto que incluye el plan y la tabla catálogo:
```javascript
{
  posible: true,
  tablaCatalogo: [ ... ], // Todos los fragmentos y sus distancias
  fragmentosRequeridos: [ "Alumno2a", "Califica" ],
  plan: [
    { tabla: "Alumno2a", localidad: "L3" },
    { tabla: "Califica", localidad: "L1" }
  ]
}
```
O en caso de fallo crítico (ej. nodo caído):
```javascript
{
  success: false,
  message: "No es posible realizar la consulta",
  results: [
    { fragment: "Carrera", node: "Inaccesible", distance: -1 }
  ]
}
```

### 4.8 Casos de ejemplo documentados

1. **Consulta simple desde L1: Nombre del Alumno y su Calificación**
   - SELECT: `Nom`, `Calificacion` | FROM: `Alumno`, `Califica` | WHERE: (vacío)
   - Fragmentos base: `Alumno1a`, `Alumno2a` (por Nom) y `Califica` (por Calificacion).
   - Sintonía: Sin poda al no haber WHERE.
   - BFS desde L1: `Alumno1a` está en `L6`, `Alumno2a` está en `L3` y `L8` (se elige `L3`), `Califica` está en `L1`.
   - Resultado: `Alumno1a` en L6, `Alumno2a` en L3, `Califica` en L1.

2. **Consulta con sintonía desde L1: Alumnos de 'Lic' y sus Promedios**
   - SELECT: `Nom`, `Prom` | FROM: `Alumno` | WHERE: `Titulo = 'Lic'`
   - Fragmentos base: `Alumno1a`, `Alumno2a`, `Alumno1b`, `Alumno2b`.
   - Sintonía: El WHERE obliga podar a `Alumno2a` y `Alumno2b`. Quedan `Alumno1a`, `Alumno1b`.
   - BFS desde L1: `Alumno1a` está en `L6`, `Alumno1b` en `L2`.
   - Resultado: `Alumno1a` en L6, `Alumno1b` en L2.

3. **Consulta inaccesible por caída de nodo desde L1**
   - SELECT: `Añocarr` | FROM: `Carrera` | WHERE: (vacío)
   - Nodos habilitados: `L2` y `L9` se apagan de la UI del minimapa.
   - Fragmentos base: `Carrera`.
   - Sintonía: Sin poda.
   - Verificación: `Carrera` solo existe en L2 y L9, que ahora están apagados.
   - Resultado: `{ success: false, ... }` ("No es posible realizar la consulta").

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

### `TablaCatalogoDinamica.jsx`
- **Qué renderiza:** Widget flotante que ilustra todos los fragmentos y localidades habilitadas, ordenadas por distancia. 
- **Estado:** Se despliega automáticamente tras cada ejecución y contiene los mismos estados visuales (`compact`, `expanded`, `minimized`) e interacciones físicas de inercia que el minimapa.
- **Decisiones:** Recibe el catálogo dinámico e ilumina la fila seleccionada (la elegida en el Plan de Ejecución) atenuando los fragmentos presentes en la red pero no requeridos.

### `Constructor.jsx`
- **Qué renderiza:** El core layout lateral para armar lógicamente los fragmentos y comandos. Intercambia las interfaces (lista o gráfico) dictaminado por su propio sub-estado (que a su vez está sujeto a `displayGraphicSelect`).
- **Estado:** Funciona como un orquestador ciego para los props inyectados por `App.jsx` que gobiernan los campos seleccionados y las condiciones (WHERE).
- **Interacciones:** Mapea el arreglo de opciones `OPERADORES` hacia el select, extrae campos de la selección actual, y notifica la ejecución (`onExecute`).

---

## Guía de modificación del sistema

Para extender el proyecto, solo precisas alterar **`src/data.js`**:
- **Agregar una localidad nueva:** Añade el identificador (ej. `L10`) en `GRAFO`, y asígnale su lista de `conexiones` de red y `tablas` almacenadas. Incorpórala al arreglo predefinido de `ESTADO_INICIAL.localidadesHabilitadas`.
- **Cambiar las tablas de una localidad:** Modifica el arreglo interno `GRAFO[localidad].tablas`.
- **Cambiar colores:** Altera los códigos hexadecimales en `COLORES_TABLA`.
- **Agregar un campo a una tabla:** Incluirlo directamente en `TABLAS_LOGICAS[tabla].campos` y **no te olvides** de ligarlo físicamente dentro del mapa de asignación `CAMPO_A_FRAGMENTOS` si pertenece a una tabla particionada (como `Alumno`), o directamente a su propio nombre si es monolítica.
- **Desactivar el modo gráfico:** Simplemente configura `FEATURE_FLAGS.displayGraphicSelect = false`.
- **Cambiar la localidad focal (Activa) por defecto:** `ESTADO_INICIAL.localidadActiva = "L5"`.

---

## Decisiones de diseño y limitaciones conocidas

- **`Alumno` como única tabla fragmentada**: Para propósitos de este caso de estudio y para mantener al evaluador enfocado, `Alumno` fue parametrizada como la única con fragmentación horizontal y vertical mixta transparente. Esto está diseñado firmemente para demostrar a fondo las optimizaciones por exclusión (sintonía del título `'Lic'` / `'Ing'`) a través de `CAMPO_A_FRAGMENTOS`, eximiendo a tablas mundanas del sobreproceso algorítmico.
- **Identificación cruzada con `{ tabla, campo }` (Corrección Estructural)**: Un detalle crítico fue corregir una incidencia anterior donde seleccionar un campo repetido (ej. llave foránea) colisionaba en un array simple. El estado de selección fue fortificado mediante la notación objeto `{ tabla, campo }` permitiendo la desambiguación perfecta durante el proceso SELECT / WHERE.
- **BFS sobre Dijkstra**: Al poseer un grafo perimetral distribuido donde el costo de enlace por tramo (arista) no difiere o es uniforme (`peso constante = 1`), el Algoritmo BFS (*Breadth-First Search*) resuelve la solicitud al menor costo operacional posible, haciendo redundante el cálculo intensivo de distancias iterativas tipo Dijkstra.
- **Límites de condición:** El `MonitorSQL` soporta en su lógica estructural únicamente una validación estricta por `WHERE` por corrida. No están implementadas bifurcaciones lógicas complejas (`AND` / `OR`).
- **Cambios realizados durante la auditoría:** Como parte del aseguramiento de la *Fuente Única de Verdad*, se podaron dependencias de variables que resultaron carentes de utilidades funcionales tras iteraciones tempranas (ej. limpieza de booleanos inertes de visualización y purga de imports sin utilización en `App.jsx`).
