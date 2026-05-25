# Arquitectura del Proyecto

## Visión General

Este proyecto es un **Simulador de Base de Datos Distribuida** orientado a contextos académicos y didácticos. Permite al usuario construir consultas visualmente o seleccionando desde listas y observar cómo el optimizador (el algoritmo de sintonía) planea la extracción de los datos tomando en cuenta topología de red, localidades apagadas/encendidas, y fragmentación híbrida de tablas. 

Se enfoca 100% en el cliente y ha sido desarrollado con React, sin servidor de backend, ya que la sintonía algorítmica y el estado son simulados en memoria en el navegador.

## Estructura de Archivos

```
/
├─ documentacion/               # Manuales y documentación técnica exhaustiva (este directorio)
├─ public/                      # Archivos estáticos
├─ src/
│  ├─ assets/                   # Íconos, imágenes
│  ├─ components/
│  │  ├─ Constructor.jsx        # Interfaz de creación de consultas
│  │  ├─ DiagramaER.jsx         # Visor visual del esquema de datos
│  │  ├─ MinimapaGrafo.jsx      # Control visual de la red de localidades
│  │  ├─ TablaCatalogoDinamica.jsx # Visor flotante del catálogo de fragmentos disponibles
│  │  ├─ MonitorSQL.jsx         # Renderizador del query en tiempo real
│  │  └─ ResultadosPlan.jsx     # Presentación final del plan de ejecución
│  ├─ utils/
│  │  └─ tuningAlgorithm.js     # Núcleo algorítmico inmutable de rutas
│  ├─ App.jsx                   # Raíz de UI, coordinador de estado global
│  ├─ data.js                   # [CRÍTICO] Fuente única de verdad (SSOT)
│  └─ main.jsx                  # Entrada principal
├─ index.html
├─ package.json
└─ tailwind.config.js
```

## Flujo de Datos (Arquitectura Unidireccional)

La aplicación sigue una arquitectura unidireccional puramente manejada por el estado de React en `App.jsx`.

```text
[Interacción del Usuario] (Clic en tabla/campo, prender/apagar nodo, cambiar localidad activa)
       │
       ▼
[Actualización de Estado Global en App.jsx] (selectedTables, selectedFields, activeNodes, currentLocation)
       │
       ├─────────► [MonitorSQL.jsx] (Construye query string)
       │
       ├─────────► [DiagramaER.jsx / Constructor.jsx] (Actualiza checkboxes y colores)
       │
       ▼
[handleExecute() llamado explícitamente por Usuario]
       │
       ▼
[simulateTuning()] (tuningAlgorithm.js inyectado con el estado global)
       │
       ▼
[Actualización de tuningResults en App.jsx]
       │
       ├─────────► [TablaCatalogoDinamica.jsx] (Muestra todos los fragmentos y elegidos)
       │
       ▼
[ResultadosPlan.jsx] (Muestra Plan de Ejecución Final)
```

## `data.js` como Fuente Única de Verdad

El archivo `data.js` centraliza de manera absoluta la configuración estática de la base de datos distribuida. **Ningún componente debe codificar en duro lógicas relativas a tablas, esquemas, o el grafo.** Si se cambia `data.js`, la UI entera, el algoritmo de rutas y el renderizador SQL se adaptan de forma dinámica.

Exporta constantes como:
- `GRAFO`: Topología y contenido de cada localidad.
- `TABLAS_LOGICAS` y `FRAGMENTOS_ALUMNO`: Estructura abstracta vs estructura física real.
- `CAMPO_A_FRAGMENTOS`: Índice invertido para acelerar el algoritmo de resolución.

## Estado Global

Reside en `App.jsx` y fluye como `props` al resto de componentes. Tiene la siguiente estructura:

- `selectedTables`: Array de strings (ej: `['Alumno', 'Carrera']`).
- `selectedFields`: Array de objetos estructurados `[{tabla: 'Alumno', campo: 'Nom'}]`.
- `condicion`: Objeto plano `{"tabla": "", "field": "", "operator": "=", "value": ""}`.
- `currentLocation`: String apuntando a la localidad que envía la consulta (`L1`).
- `activeNodes`: Array de strings con localidades no caídas (`['L1', 'L3', ...]`).
- `tuningResults`: Resultado inyectado por el motor para mostrar el plan. Se anula a `null` automáticamente siempre que cambie la topología de red para forzar re-ejecución.

## Sistema de Colores (`COLORES_TABLA`)

Para ayudar a la carga cognitiva del usuario, `data.js` exporta `COLORES_TABLA`. A cada tabla se le asocia de forma rígida un color (fondo, borde, texto). Este color se utiliza consistente en toda la UI: el minimapa, los diagramas ER, y en las tarjetas de resultados del plan final usando el helper `getColorForTable()`.

## Feature Flags

`FEATURE_FLAGS` permite encender características incompletas o experimentales de manera aislada (como el modo `displayGraphicSelect`).
