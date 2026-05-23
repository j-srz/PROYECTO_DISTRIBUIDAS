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

### Sección 4 — Conclusión

Con el desarrollo de este proyecto logramos crear una herramienta práctica que demuestra cómo funciona realmente la transparencia de repetición y fragmentación en bases de datos distribuidas.

Además, el sistema comprueba la importancia de usar un catálogo centralizado. Logramos mantener una alta disponibilidad; al simular la caída de los nodos principales.

El diseño nos demostró que, aunque los servicios lógicos de las bases de datos se caigan, la estructura y los costos de la red se mantienen constantes. El resultado final es una arquitectura robusta, estable y perfecta como entorno de pruebas para aplicar los conceptos de la carrera.