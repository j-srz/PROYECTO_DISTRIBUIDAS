# Guía de Modificación del Sistema

La arquitectura impone que `data.js` sea la fuente de la verdad para toda la topología y datos lógicos. Modificar el sistema en un 90% de los casos solo requiere editar este archivo.

> [!TIP]
> Cualquier cambio que hagas en `data.js` será reflejado automáticamente en la UI, en los grafos y en el algoritmo de sintonía al refrescar la página.

## Agregar o Modificar Localidades

### 1. Agregar una nueva localidad y sus conexiones
Debes modificar `GRAFO`.

```javascript
// Antes
export const GRAFO = {
  L9: { conexiones: ["L5", "L8"], tablas: ["Alumno1b", "Carrera"] }
};

// Después: Nueva L10 agregada y L9 enlazada a L10
export const GRAFO = {
  L9: { conexiones: ["L5", "L8", "L10"], tablas: ["Alumno1b", "Carrera"] },
  L10: { conexiones: ["L9"], tablas: ["Materia"] }
};
```
**Cambio manual adicional:** Debes agregar `L10` al estado habilitado global `ESTADO_INICIAL.localidadesHabilitadas`.

### 2. Mover tablas a otra localidad
Simplemente modifica el arreglo `tablas` de la respectiva llave en `GRAFO`.

```javascript
L1: { conexiones: ["L2", "L5"], tablas: ["Alumno1a", "Materia", "Califica"] }
```

## Cambiar Tablas Lógicas o Fragmentos

### 3. Agregar un nuevo campo a una tabla (Ej: agregar "Edad" a Carrera)
1. Agrégalo en `TABLAS_LOGICAS.Carrera.campos`.
2. Actualiza el índice invertido `CAMPO_A_FRAGMENTOS` para que el algoritmo pueda mapearlo al físico.

```javascript
export const TABLAS_LOGICAS = {
  Carrera: { campos: ["Cvecarr", "Nomcarr", "Añocarr", "Edad"] },
};

export const CAMPO_A_FRAGMENTOS = {
  // ...
  "Edad": ["Carrera"]
};
```

## Cambios Estéticos y UI

### 4. Cambiar el color base de una tabla
Modifica la constante de diseño `COLORES_TABLA`. Todo en la interfaz se ajustará.

```javascript
// Cambiando Maestro a rosa brillante
export const COLORES_TABLA = {
  Maestro:  { bg: "#EC4899", border: "#BE185D", text: "#FFFFFF" }
};
```

### 5. Modificar Localidades de inicio
Encuentra `ESTADO_INICIAL` en el mismo archivo.

```javascript
export const ESTADO_INICIAL = {
  localidadActiva: "L5", // Ahora el usuario inicia en L5
  localidadesHabilitadas: ["L1", "L2", "L3", "L4", "L6", "L7", "L8", "L9"] // L5 apagada por default, omitiéndola
};
```

### 6. Ajustar física y rebotes en el diagrama
Para que las burbujas tengan menos "rebote elástico", cambia la restitución.

```javascript
export const FISICA_ER = {
  FRICTION:     0.88,
  RESTITUTION:  0.2, // Reducido de 0.6
  THRESHOLD:    0.5
};
```
