# Referencia de Componentes React

El proyecto cuenta con un conjunto de componentes puros enfocados en mostrar el estado inyectado y emitir eventos hacia arriba (hacia `App.jsx`).

---

## `App.jsx`
- **Responsabilidad:** Coordinador central. Mantiene todo el estado y provee las funciones modificadoras (toggles).
- **Estado interno:** Maneja las tablas, campos, condición, la ubicación, los nodos habilitados y los resultados de sintonía.
- **Efectos secundarios:** Tiene un `useEffect` fundamental que reinicia (`null`) el resultado de sintonización cada vez que el usuario modifica los nodos activos o su ubicación local. Esto previene información stale (pasada) en la UI.

---

## `MinimapaGrafo.jsx`
- **Responsabilidad:** Representar visualmente el grafo (estado de la red). Controlar qué localidad envía la consulta y cuáles están caídas.
- **Props:** Recibe el estado activo y manejadores de estado.
- **Interacciones:** 
  - Clic secundario o botón de acción: apagar/encender nodo (despacha hacia `App.jsx`).
  - Doble clic: Definir este nodo como emisor de la consulta actual.
- **Estados Especiales (Grafo Dinámico):** Mantiene lógica para tres estados visuales: `compact`, `minimized`, `expanded`.
  - Incluye un loop de físicas personalizadas impulsado por `requestAnimationFrame` que se encarga del renderizado elástico del grafo, aplicando umbrales para frenado de nodos inerciales.
  - El arrastre interactivo (drag) está deliberadamente desactivado cuando está expandido por reglas de diseño UX. Usa backdrop blur durante la expansión.

---

## `TablaCatalogoDinamica.jsx`
- **Responsabilidad:** Muestra el catálogo de todos los fragmentos disponibles en la red habilitada y sus distancias hacia el origen, resaltando cuáles forman parte del plan óptimo final.
- **Props:** Recibe los resultados (`tuningResults`) de la ejecución.
- **Interacciones:** Misma máquina de estados físicos (`compact`, `minimized`, `expanded`) e inercia que el `MinimapaGrafo`.
- **Estados Especiales:**
  - Solo se renderiza tras una ejecución válida o fallida que contenga un catálogo disponible.
  - Atenúa visualmente los fragmentos disponibles pero no requeridos por el plan.

---

## `DiagramaER.jsx`
- **Responsabilidad:** Servir como interfaz visual de Entidad Relación.
- **Interacciones:**
  - Clic en cabecera de tabla: Selecciona de forma masiva o deselecciona la tabla y todos sus campos.
  - Clic en propiedades: Alterna la selección puntual de campos.
- **Estados Especiales:**
  - La sincronización está garantizada porque si un campo se activa vía `Constructor.jsx` (modo lista), este diagrama leerá las props y mostrará el check correspondiente.
  - El header tiene **tres estados visuales**: no seleccionado (gris), parcial (borde tintado), y selección total (relleno de color completo).
  - Inferencia automática de relaciones: Detecta campos con el mismo nombre y dibuja las líneas SVG entre las tablas dinámicamente.
  - Física de nodos: Los nodos de las tablas tienen física independiente permitiendo que el usuario reorganice las tablas arrastrándolas con inercia, aunque sus posiciones iniciales son dictadas por `POSICIONES_INICIALES_ER` en `data.js`.

---

## `Constructor.jsx`
- **Responsabilidad:** Dar a elegir entre el modo gráfico (Diagrama ER) o el modo de lista plana. Gestionar la inserción de la cláusula WHERE.
- **Estado Interno:** `viewMode` (`list` o `graphic`).
- **Consideración:** El componente que define el WHERE está montado independientemente de la vista (`list` o `graphic`) porque el filtrado WHERE es agnóstico de la herramienta usada para elegir el SELECT.

---

## `ResultadosPlan.jsx`
- **Responsabilidad:** Únicamente desplegar la tabla con las rutas a obtener. Mapea la propiedad de resultado (el plan del `tuningAlgorithm.js`) y aplica `getColorForTable()` para colorear cada fila acorde al fragmento que contiene. No almacena estado de nada.

---

## `MonitorSQL.jsx`
- **Responsabilidad:** Tomar un string plano y dibujarlo con formato. Se invoca dentro del `useMemo` del App superior por lo que el string de consulta llega preformateado.
