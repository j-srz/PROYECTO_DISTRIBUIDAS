# Proyecto: Transparencia de Repetición y Fragmentación
## Base de Datos Distribuidas
### EQUIPO 1:
#### Suárez Licea Jesús
#### Garcia Castorena Jose Guadalupe
#### Ewar 
### Instituto Tecnologico de Aguascalientes
### 22 de Mayo del 2026 Aguascalientes, Ags.

---

### Explicación del proyecto

El presente proyecto consiste en un sistema interactivo diseñado para simular fragmentación y repetición dentro de una base de datos distribuida. La herramienta proporciona a los usuarios un constructor visual para generar consultas SQL sobre tablas.

El proyecto fue desarrollado utilizando un entorno moderno de frontend basado en **React** y **JavaScript**, empaquetado y servido a través de **Vite**. Se trata de una arquitectura sin servidor, donde toda la base de datos distribuida, el grafo de la topología y el motor algorítmico de rutas están simulados.


---

### Implementación de la tabla catálogo


**— Implementación en `data.js`**
La topología y el catálogo de ubicaciones se modelan a través del objeto `GRAFO` en el archivo de configuración global `data.js`. Para cada identificador de localidad, se registra un arreglo de conexiones (nodos adyacentes de red) y un arreglo de las tablas o fragmentos que alberga físicamente:

```javascript
export const GRAFO = {
  L1: { conexiones: ["L2", "L5"], tablas: ["Alumno1a", "Materia", "Califica"] },
  L2: { conexiones: ["L1", "L3"], tablas: ["Alumno1b", "Carrera"] },
  L3: { conexiones: ["L2", "L6"], tablas: ["Alumno2a", "Maestro"] },
  L4: { conexiones: ["L5", "L7"], tablas: ["Alumno2b", "Maestro"] },
  L5: { conexiones: ["L1", "L4", "L6", "L9"], tablas: ["Alumno2b", "Materia"] },
  L6: { conexiones: ["L3", "L5"], tablas: ["Alumno1a", "Califica"] },
  L7: { conexiones: ["L4", "L8"], tablas: ["Materia", "Califica"] },
  L8: { conexiones: ["L7", "L9"], tablas: ["Alumno2a", "Maestro"] },
  L9: { conexiones: ["L5", "L8"], tablas: ["Alumno1b", "Carrera"] }
};
```

**— Representación de la tabla catálogo**

| Localidad | Conectada con | Tablas / Fragmentos almacenados |
|-----------|--------------|--------------------------------|
| L1 | L2, L5 | Alumno1a, Materia, Califica |
| L2 | L1, L3 | Alumno1b, Carrera |
| L3 | L2, L6 | Alumno2a, Maestro |
| L4 | L5, L7 | Alumno2b, Maestro |
| L5 | L1, L4, L6, L9 | Alumno2b, Materia |
| L6 | L3, L5 | Alumno1a, Califica |
| L7 | L4, L8 | Materia, Califica |
| L8 | L7, L9 | Alumno2a, Maestro |
| L9 | L5, L8 | Alumno1b, Carrera |


**— Cómo el sistema consulta la tabla catálogo**
Durante la ejecución lógica, el módulo resolutor (`tuningAlgorithm.js`) interactúa de forma secuencial con `data.js`. Primero lee el catálogo reverso `CAMPO_A_FRAGMENTOS` para transformar los campos lógicos seleccionados en requerimientos de fragmentos físicos. Posteriormente, si existe una condición explícita que corresponda al criterio de fragmentación (`Titulo`), se depuran los fragmentos que lógicamente no poseerán datos. Finalmente, se itera sobre los nodos habilitados del sistema buscando aquellos cuyo inventario coincida con los fragmentos requeridos, consultando una matriz de distancias precalculada desde el catálogo `GRAFO` para garantizar la elección de la localidad más cercana y óptima.

---

### Guía de uso con ejemplos

**— Interfaz general**
La pantalla principal de la aplicación integra cuatro zonas de control:
1. **Monitor SQL (Superior):** Renderiza dinámicamente la consulta generada en lenguaje SQL estándar.
2. **Constructor (Centro-Izquierda):** Permite ensamblar consultas marcando tablas y columnas mediante botones o arrastrando elementos, así como la inyección del operador y valor del filtro lógico (cláusula `WHERE`).
3. **Plan de Ejecución (Centro-Derecha):** Presenta de forma analítica el resultado algorítmico, detallando el estado de la consulta y la tabla de rutas.
4. **Minimapa de Grafo (Flotante Inferior):** Representación visual e interactiva de la red de localidades y su conectividad.

**— Pasos para construir una consulta**

1. **Seleccionar localidad activa:** En el Minimapa, el usuario debe realizar clic sobre el nodo que asumirá el rol de punto de origen de la red desde donde se lanza la petición (ej. `L1`).
2. **Habilitar/deshabilitar localidades:** Mediante un clic simple en el botón en la esquina inferior derecha a cada nodo en el minimapa, es posible encender o apagar bases de datos.
3. **Seleccionar tablas (FROM):** En el panel Constructor, se hace clic sobre las tablas requeridas. 
4. **Seleccionar campos (SELECT):** Al expandir las tablas elegidas, el usuario marca las casillas de las columnas particulares que desea obtener en el resultado.
5. **Definir condición (WHERE):** En la parte inferior del Constructor, opcionalmente, el usuario selecciona una columna de la lista, un operador relacional (ej. `=`) y redacta el valor a evaluar para acotar el resultado.
6. **Ejecutar:** Al presionar el botón de ejecución, el motor procesa el plan y lo renderiza en la zona de Ejecución.

**— Ejemplo 1: Consulta con condición sobre Titulo = 'Ing'**

* Localidad activa: `L1`
* Nodos de red: Todas las localidades habilitadas
* Tablas seleccionadas: `Alumno`, `Carrera`
* Campos seleccionados: `Nom` (de Alumno), `Titulo` (de Alumno), `Nomcarr` (de Carrera)
* Condición WHERE: `Titulo = 'Ing'`

**Razonamiento del sistema:**
Al elegir los campos `Nom` y `Titulo` de la tabla fragmentada `Alumno`, el motor inicialmente demanda obtener los fragmentos `Alumno1a`, `Alumno1b`, `Alumno2a` y `Alumno2b`. Sin embargo, al detectar una condición discriminante horizontal explícita (`Titulo = 'Ing'`), el algoritmo descarta de manera instantánea `Alumno1a` y `Alumno1b`, ya que lógicamente no contienen información de ingenierías.

- `Alumno2a`. Se elige `L3`.
- `Alumno2b`. Se elige `L5`.


**Resultado en pantalla:**
| Localidad | Tabla / Fragmento |
|-----------|-------------------|
| L3 | Alumno2a |
| L5 | Alumno2b |


**Ejemplo 2: Consulta sin condición**

* Localidad activa: `L1`
* Nodos de red: Todas las localidades habilitadas
* Tablas seleccionadas: `Alumno`, `Carrera`
* Campos seleccionados: `Nom` (de Alumno), `Titulo` (de Alumno), `Nomcarr` (de Carrera)
* Condición WHERE: `Nom = 'Pedro'`

**Razonamiento del sistema:**
A diferencia del caso anterior, el filtro no aborda la regla de fragmentación (`Titulo`). Por lo tanto, el sistema desconoce qué partición alberga al alumno llamado 'Pedro' y se ve forzado a solicitar y ensamblar los fragmentos. 

**Resultado en pantalla:**
| Localidad | Tabla / Fragmento |
|-----------|-------------------|
| L1 | Alumno1a |
| L2 | Carrera |
| L3 | Alumno2a |



---

### Conclusión

El desarrollo de este proyecto permitió al equipo consolidar y aplicar de manera práctica los conceptos fundamentales abordados durante el curso de Bases de Datos Distribuidas. La implementación del simulador exigió comprender a profundidad los principios de fragmentación horizontal y vertical, la transparencia de fragmentación como propiedad esencial de un sistema distribuido, y el rol que desempeña la tabla catálogo como mecanismo central de directorio que hace posible dicha transparencia.

A través de la construcción del sistema se pudo apreciar la importancia de la distribución de datos entre múltiples localidades y la forma en que esta distribución impacta directamente en la disponibilidad y el rendimiento de las consultas. La sintonía de red, entendida como la selección óptima del nodo más cercano que posea el fragmento requerido, demostró ser un mecanismo indispensable para minimizar el costo de transferencia de datos en una red distribuida, concepto que el curso abordó como uno de los criterios de diseño más relevantes en este tipo de arquitecturas.

Finalmente, la transparencia de repetición y fragmentación, tema central de la asignatura y eje del presente proyecto, quedó evidenciada en el hecho de que el usuario interactúa en todo momento con tablas lógicas completas, sin conocer ni necesitar conocer la distribución física de los datos en la red. Este principio, que en sistemas reales es garantizado por capas de middleware y servidores de directorio, fue simulado aquí mediante la tabla catálogo implementada en data.js, demostrando que su correcta gestión es la piedra angular sobre la que descansa cualquier sistema de base de datos distribuida transparente.