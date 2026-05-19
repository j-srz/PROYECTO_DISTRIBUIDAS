# Constructor de Consultas para Base de Datos Distribuida

Este proyecto es un simulador de base de datos distribuida con soporte para fragmentación híbrida (horizontal y vertical). El simulador permite construir consultas y visualizar cómo el motor de la base de datos resuelve el plan de ejecución seleccionando las localidades óptimas para extraer los datos mediante un algoritmo de búsqueda por amplitud (BFS).

## 🚀 Qué hace el proyecto

1. **Grafo de Distribución**: Visualiza las 9 localidades (L1 - L9) conectadas entre sí, permitiendo habilitar o deshabilitar las bases de datos de cada una dinámicamente, así como simular el movimiento del usuario entre los nodos.
2. **Constructor de Consultas**: Interfaz para generar consultas SQL paso a paso (FROM, SELECT, WHERE). Implementa restricciones lógicas donde solo puedes seleccionar campos de las tablas indicadas en el FROM.
3. **Sintonía de Red y Algoritmo de Resolución**: Ejecuta una simulación del plan de ejecución (sin conectarse a una BD real):
   - Determina los fragmentos de datos necesarios basándose en los campos solicitados.
   - Aplica reglas de optimización basadas en la fragmentación (si se busca `Titulo = 'Ing'` descarta los fragmentos de Licenciados).
   - Realiza un recorrido BFS desde la localidad actual para encontrar los nodos más cercanos que contienen los fragmentos requeridos y estén habilitados.
4. **Manejo de Estados Persistentes**: Permite cambiar la localidad del usuario o deshabilitar/habilitar nodos en caliente sin perder la consulta que se está construyendo, actualizando o invalidando el plan de ejecución si es necesario.

## 🛠️ Tecnologías

- **React 18**: Framework principal.
- **Vite**: Empaquetador y entorno de desarrollo.
- **Tailwind CSS**: Para un diseño de UI moderno y responsivo.
- **Framer Motion**: Utilizado para el drag & drop del minimapa y otras animaciones.
- **Lucide React**: Iconografía.

## 📦 Cómo instalarlo

Requisitos previos: Necesitas tener instalado [Node.js](https://nodejs.org/) (versión 16 o superior).

1. Abre la terminal en el directorio del proyecto.
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```

## 🎮 Cómo usarlo

Para iniciar el servidor de desarrollo local, ejecuta:
```bash
npm run dev
```

Esto abrirá la aplicación en tu navegador (por defecto en `http://localhost:5173`).

### Flujo de uso paso a paso:

1. **Minimapa Grafo (Widget Flotante)**:
   - Arrastra el widget para posicionarlo donde te sea más cómodo.
   - Haz clic en cualquier nodo (L1 - L9) para cambiar tu "Ubicación Actual".
   - Utiliza el pequeño botón de encendido/apagado en cada nodo para simular caídas del sistema o deshabilitar la base de datos en dicha localidad.
2. **Seleccionar Tablas**: Haz clic en una o varias tablas. Solo verás las disponibles lógicamente.
3. **Seleccionar Campos**: Selecciona qué columnas deseas extraer de las tablas habilitadas.
4. **Condición WHERE**: Aplica una condición opcional usando cualquier campo disponible (Ej: `Titulo = 'Ing'`).
5. **Ejecutar Sintonía de Red**: Presiona el botón principal para resolver la consulta. En la barra lateral derecha verás la tabla con el plan resultante, que te dirá desde qué localidad exacta se extraerá cada fragmento necesario.

## 🗃️ Arquitectura de Datos

Todo el dominio de datos (esquemas de tabla, fragmentaciones y grafo) reside **estrictamente en un único archivo fuente** `src/data.js` para asegurar la centralización de las reglas de negocio y facilitar su modificación o extensión.
