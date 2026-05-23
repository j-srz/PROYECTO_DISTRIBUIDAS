# Algoritmo de Sintonía

## Propósito

El algoritmo de sintonía (`tuningAlgorithm.js`) es el corazón del motor de consultas distribuidas de este proyecto. Su propósito es tomar una consulta abstracta del usuario (tablas lógicas, campos y condición `WHERE`), y transformarla en un **plan de ejecución físico**.

En bases de datos distribuidas, la "sintonía" se encarga de determinar exactamente qué fragmentos físicos se necesitan y desde qué localidades habilitadas deben ser obtenidos, optimizando la distancia de red (saltos) respecto a la localidad que está ejecutando la consulta.

## Modelo del Sistema

El sistema modela una red de 9 localidades interconectadas, cada una almacenando un subconjunto de fragmentos de datos. El grafo de la red se define de la siguiente manera:

```text
        [L2]———[L3]
         |      |
  [L1]———[L5]———[L6]
          | \
         /   \
      [L4]   [L9]
        |      |
      [L7]———[L8]
```

## Fragmentación de Alumno

En este sistema, la tabla lógica **Alumno** no existe físicamente como una unidad. Ha sido dividida mediante **fragmentación híbrida** (horizontal y vertical combinadas) en 4 fragmentos:

- `Alumno1a`: Datos personales para alumnos de Licenciatura (`Titulo = 'Lic'`).
- `Alumno1b`: Datos académicos para alumnos de Licenciatura (`Titulo = 'Lic'`).
- `Alumno2a`: Datos personales para alumnos de Ingeniería (`Titulo = 'Ing'`).
- `Alumno2b`: Datos académicos para alumnos de Ingeniería (`Titulo = 'Ing'`).

El usuario final nunca ve esta fragmentación. El motor la maneja de forma completamente transparente.

## Precálculo de Distancias

**El grafo de distancias es fijo e inmutable.** Las distancias (saltos de red) se calculan una sola vez al inicializar el módulo (`precalcularDistancias`). 

> [!IMPORTANT]
> Una localidad deshabilitada **NO** bloquea las rutas. Sigue funcionando como un nodo intermedio (router) en la red para el tráfico de red, simplemente no puede usarse como origen de datos para una consulta. 

Por lo tanto, la matriz de distancias completa es constante sin importar cuántas localidades el usuario encienda o apague:

|   | L1 | L2 | L3 | L4 | L5 | L6 | L7 | L8 | L9 |
|---|----|----|----|----|----|----|----|----|----|
| **L1** | 0 | 1 | 2 | 2 | 1 | 2 | 3 | 3 | 2 |
| **L2** | 1 | 0 | 1 | 3 | 2 | 2 | 4 | 4 | 3 |
| **L3** | 2 | 1 | 0 | 3 | 2 | 1 | 4 | 4 | 3 |
| **L4** | 2 | 3 | 3 | 0 | 1 | 2 | 1 | 2 | 2 |
| **L5** | 1 | 2 | 2 | 1 | 0 | 1 | 2 | 2 | 1 |
| **L6** | 2 | 2 | 1 | 2 | 1 | 0 | 3 | 3 | 2 |
| **L7** | 3 | 4 | 4 | 1 | 2 | 3 | 0 | 1 | 2 |
| **L8** | 3 | 4 | 4 | 2 | 2 | 3 | 1 | 0 | 1 |
| **L9** | 2 | 3 | 3 | 2 | 1 | 2 | 2 | 1 | 0 |

## Los 5 Pasos del Algoritmo

El algoritmo funciona en un pipeline lineal estricto de 5 pasos:

### Paso 1 — Fragmentos Requeridos
Determina qué piezas físicas de información (fragmentos o tablas enteras) se necesitan con base en los campos seleccionados.

```javascript
Si campo es de la tabla "Alumno":
  fragmentos_requeridos.add(CAMPO_A_FRAGMENTOS[campo])
Sino:
  fragmentos_requeridos.add(tabla_entera)
```

**Ejemplo:**
- Entrada: `[{ tabla: 'Alumno', campo: 'Nom' }]`
- Salida Paso 1: `Set { 'Alumno1a', 'Alumno2a' }`

### Paso 2 — Sintonía por Fragmentación
Filtra lógicamente los fragmentos basándose en la condición del `WHERE`. Si la condición establece que `Titulo = 'Lic'`, es imposible que los fragmentos tipo 2 (que contienen `'Ing'`) tengan información útil, así que se excluyen.

```javascript
Si condicion.campo == 'Titulo':
  Si condicion.valor == 'lic': 
    eliminar 'Alumno2a' y 'Alumno2b'
  Si condicion.valor == 'ing': 
    eliminar 'Alumno1a' y 'Alumno1b'
```

**Ejemplo:**
- Entrada: `Set { 'Alumno1a', 'Alumno2a' }`, Condición: `Titulo = 'Lic'`
- Salida Paso 2: `Set { 'Alumno1a' }`

### Paso 3 — Verificación de Disponibilidad
Por cada fragmento resultante, verifica si está disponible en *alguna* localidad habilitada. Si alguno de los fragmentos necesarios no existe en ninguna localidad habilitada, la consulta se marca como **Inviable** y el algoritmo se detiene de inmediato.

### Paso 4 — Localidad más Cercana por Fragmento
Si la consulta es viable, busca para cada fragmento la localidad que lo contiene y que tenga la menor distancia respecto a la `localidadActiva` del usuario, consultando la matriz O(1). En caso de empate en distancia, la primera opción es elegida.

```javascript
Por cada fragmento:
  localidadElegida = candidata con menor DISTANCIAS[localidadActiva][candidata]
```

### Paso 5 — Resultado Final
Construye la respuesta formal esperada por el UI en el formato `{ posible, plan }` o `{ posible, razon }`.

**Ejemplo Éxito:**
```json
{ 
  "posible": true, 
  "plan": [
    { "localidad": "L1", "tabla": "Alumno1a" },
    { "localidad": "L3", "tabla": "Alumno2a" }
  ] 
}
```

## Casos Especiales (Edge Cases)

- **Condición WHERE vacía**: El Paso 2 se omite y el motor requerirá *todos* los fragmentos que tengan los campos solicitados para unir los resultados más tarde.
- **Todas las localidades apagadas**: El Paso 3 detendrá de inmediato la ejecución retornando `posible: false`.
- **Localidad activa tiene el fragmento**: La distancia en el Paso 4 consultará `DISTANCIAS[Lx][Lx]` dando `0` y siendo elegida de forma óptima.
- **Múltiples tablas solicitan el mismo fragmento**: Al utilizar un objeto `Set`, el Paso 1 consolida las peticiones por lo que ningún fragmento se procesa ni se solicita dos veces en el plan final.
