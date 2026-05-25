# Proyecto: Transparencia de Repetición y Fragmentación — Requerimientos Funcionales

---

## 1. Datos de la Base de Datos Distribuida

### 1.1 Esquema de tablas originales

```json
{
  "tablas": {
    "Alumno": {
      "campos": ["NoCtrl", "Nom", "Ap", "Am", "Dom", "Tel", "Cvecarr", "Sem", "Prom", "Titulo"],
      "descripcion": {
        "NoCtrl": "Número de control",
        "Nom": "Nombre del alumno",
        "Ap": "Apellido paterno",
        "Am": "Apellido materno",
        "Dom": "Domicilio",
        "Tel": "Teléfono",
        "Cvecarr": "Clave de carrera",
        "Sem": "Semestre",
        "Prom": "Promedio",
        "Titulo": "Título (Lic o Ing)"
      }
    },
    "Carrera": {
      "campos": ["Cvecarr", "Nomcarr", "Añocarr"],
      "descripcion": {
        "Cvecarr": "Clave de carrera",
        "Nomcarr": "Nombre de carrera",
        "Añocarr": "Año de inicio de la carrera"
      }
    },
    "Materia": {
      "campos": ["Cvemat", "Nommat", "Creditos"],
      "descripcion": {
        "Cvemat": "Clave de materia",
        "Nommat": "Nombre de materia",
        "Creditos": "Créditos de la materia"
      }
    },
    "Maestro": {
      "campos": ["Cvemaestro", "Nommaestro", "Apmaestro", "Ammaestro", "Grado"],
      "descripcion": {
        "Cvemaestro": "Clave del maestro",
        "Nommaestro": "Nombre del maestro",
        "Apmaestro": "Apellido paterno",
        "Ammaestro": "Apellido materno",
        "Grado": "Último grado académico"
      }
    },
    "Califica": {
      "campos": ["NoCtrl", "Cvemat", "Cvemaestro", "Calificacion", "Oportunidad"],
      "descripcion": {
        "NoCtrl": "Número de control",
        "Cvemat": "Clave de materia",
        "Cvemaestro": "Clave del maestro",
        "Calificacion": "Calificación del alumno en la materia",
        "Oportunidad": "Oportunidad en la que se evaluó"
      }
    }
  }
}
```

---

### 1.2 Criterios de fragmentación de la tabla Alumno

La tabla `Alumno` se fragmenta horizontal y verticalmente. El usuario **no sabe** que está fragmentada; para él solo existe la tabla `Alumno`.

```json
{
  "fragmentos": {
    "Alumno1a": {
      "campos": ["NoCtrl", "Nom", "Ap", "Am", "Dom", "Tel"],
      "condicion": "Titulo = 'Lic'"
    },
    "Alumno1b": {
      "campos": ["NoCtrl", "Cvecarr", "Sem", "Prom", "Titulo"],
      "condicion": "Titulo = 'Lic'"
    },
    "Alumno2a": {
      "campos": ["NoCtrl", "Nom", "Ap", "Am", "Dom", "Tel"],
      "condicion": "Titulo = 'Ing'"
    },
    "Alumno2b": {
      "campos": ["NoCtrl", "Cvecarr", "Sem", "Prom", "Titulo"],
      "condicion": "Titulo = 'Ing'"
    }
  }
}
```

> **Nota importante:** El campo `Titulo` aparece únicamente en los fragmentos `b` (`Alumno1b` y `Alumno2b`). Los fragmentos `a` contienen los datos personales y los fragmentos `b` los datos académicos.

---

### 1.3 Tabla catálogo — distribución por localidad

Esta es la estructura de datos central que la aplicación debe manejar internamente (tabla catálogo). Define qué tablas/fragmentos existen en cada localidad y cómo están conectadas las localidades entre sí.

```json
{
  "localidades": {
    "L1": {
      "conexiones": ["L2", "L5"],
      "tablas": ["Alumno1a", "Materia", "Califica"]
    },
    "L2": {
      "conexiones": ["L1", "L3"],
      "tablas": ["Alumno1b", "Carrera"]
    },
    "L3": {
      "conexiones": ["L2", "L6"],
      "tablas": ["Alumno2a", "Maestro"]
    },
    "L4": {
      "conexiones": ["L5", "L7"],
      "tablas": ["Alumno2b", "Maestro"]
    },
    "L5": {
      "conexiones": ["L1", "L4", "L6", "L9"],
      "tablas": ["Alumno2b", "Materia"]
    },
    "L6": {
      "conexiones": ["L3", "L5"],
      "tablas": ["Alumno1a", "Califica"]
    },
    "L7": {
      "conexiones": ["L4", "L8"],
      "tablas": ["Materia", "Califica"]
    },
    "L8": {
      "conexiones": ["L7", "L9"],
      "tablas": ["Alumno2a", "Maestro"]
    },
    "L9": {
      "conexiones": ["L5", "L8"],
      "tablas": ["Alumno1b", "Carrera"]
    }
  }
}
```

> **Consideraciones del grafo:**
> - Todas las líneas de comunicación son equivalentes en distancia y características.
> - Las líneas de comunicación no sufren fallos.
> - Los equipos (nodos) tampoco fallan; solo se pueden habilitar/deshabilitar sus bases de datos.

---

## 2. Requerimientos Funcionales

### RF-01: Visualización permanente del grafo de distribución

- La aplicación debe mostrar en todo momento el grafo de distribución de la base de datos tal como se describe en la sección 1.3.
- El grafo debe reflejar de forma visual el estado actual de cada localidad (habilitada / deshabilitada).
- El nodo que representa la localidad actual del usuario debe estar visualmente diferenciado.
- El grafo **no desaparece** mientras el usuario interactúa con el resto de la aplicación.

---

### RF-02: Selección y cambio de localidad del usuario

- Por defecto, la localidad activa del usuario es **L1**.
- El usuario puede cambiar su localidad en cualquier momento sin perder el estado de la consulta en construcción.
- La localidad seleccionada se usará como punto de origen para el cálculo de distancias/sintonía en el proceso de resolución (RF-05).

---

### RF-03: Habilitar y deshabilitar bases de datos por localidad

- Por defecto, todas las bases de datos de todas las localidades están **habilitadas**.
- El usuario puede deshabilitar la base de datos de una localidad específica.
- Una localidad deshabilitada **no puede ser usada** como fuente de datos en la resolución de la consulta.
- El usuario puede volver a habilitarla en cualquier momento.
- Deshabilitar una base de datos no implica que la localidad desaparezca del grafo; el nodo sigue visible pero marcado como inactivo.

---

### RF-04: Constructor de consulta

La consulta se construye en tres pasos secuenciales. El usuario no escribe SQL; todo es por selección.

#### RF-04a: Selección de tablas (equivalente al FROM)

- El usuario puede seleccionar **una o más** de las siguientes tablas lógicas:
  - `Alumno`, `Maestro`, `Materia`, `Carrera`, `Califica`
- La tabla `Alumno` se presenta como una sola entidad al usuario. La fragmentación es transparente.
- La selección de tablas determina qué campos estarán disponibles en el siguiente paso.

#### RF-04b: Selección de campos (equivalente al SELECT)

- A partir de las tablas seleccionadas en RF-04a, el usuario puede elegir **uno o más campos** de cada tabla.
- Solo se muestran los campos de las tablas ya seleccionadas.
- El mapeo interno de campos a fragmentos es el siguiente:

```json
{
  "campoAFragmento": {
    "NoCtrl":      ["Alumno1a", "Alumno1b", "Alumno2a", "Alumno2b"],
    "Nom":         ["Alumno1a", "Alumno2a"],
    "Ap":          ["Alumno1a", "Alumno2a"],
    "Am":          ["Alumno1a", "Alumno2a"],
    "Dom":         ["Alumno1a", "Alumno2a"],
    "Tel":         ["Alumno1a", "Alumno2a"],
    "Cvecarr":     ["Alumno1b", "Alumno2b"],
    "Sem":         ["Alumno1b", "Alumno2b"],
    "Prom":        ["Alumno1b", "Alumno2b"],
    "Titulo":      ["Alumno1b", "Alumno2b"],
    "Nomcarr":     ["Carrera"],
    "Añocarr":     ["Carrera"],
    "Cvemat":      ["Materia", "Califica"],
    "Nommat":      ["Materia"],
    "Creditos":    ["Materia"],
    "Cvemaestro":  ["Maestro", "Califica"],
    "Nommaestro":  ["Maestro"],
    "Apmaestro":   ["Maestro"],
    "Ammaestro":   ["Maestro"],
    "Grado":       ["Maestro"],
    "Calificacion":["Califica"],
    "Oportunidad": ["Califica"]
  }
}
```

#### RF-04c: Definición de condición simple (equivalente al WHERE)

- El usuario define **una única condición simple** con la forma:  
  `<campo> <operador> <valor>`
- Los operadores disponibles son: `<`, `>`, `=`, `<>`, `>=`, `<=`
- El campo debe provenir de los campos seleccionados en RF-04b.
- El valor es ingresado libremente por el usuario (texto o número).
- La condición puede estar vacía (consulta sin WHERE).
- **No** se requiere definir condiciones de join entre tablas; se asumen automáticamente.

---

### RF-05: Proceso de resolución de la consulta

Una vez completados los pasos RF-04a, RF-04b y RF-04c, el usuario ejecuta el proceso. El sistema debe:

#### RF-05a: Determinar si la consulta es posible

Verificar si existe al menos una localidad habilitada que contenga cada fragmento necesario para satisfacer la consulta. Si algún fragmento requerido no está disponible en ninguna localidad habilitada, la consulta **no es posible** y se informa al usuario.

#### RF-05b: Aplicar lógica de sintonía por condición de fragmentación

Cuando la condición del WHERE involucra el campo `Titulo`:

- Si `Titulo = 'Lic'` → solo se necesitan los fragmentos `Alumno1a` y/o `Alumno1b` (no los `2a`/`2b`).
- Si `Titulo = 'Ing'` → solo se necesitan los fragmentos `Alumno2a` y/o `Alumno2b` (no los `1a`/`1b`).
- Si la condición no involucra `Titulo` (p. ej. `Nom = 'Pedro'`) → se necesitan **ambos** fragmentos correspondientes (tanto `_1_` como `_2_`), ya que cualquier alumno podría cumplir la condición.

Esta lógica reduce el conjunto de fragmentos requeridos cuando es posible deducirlo del criterio de fragmentación.

#### RF-05c: Construir la Tabla Catálogo Dinámica y Calcular Localidades Óptimas

El sistema construye una **Tabla Catálogo Dinámica** con todos los fragmentos disponibles en la red actual:
1. Determina todas las localidades habilitadas y extrae todos los fragmentos que contienen.
2. Calcula la distancia desde la localidad actual del usuario hasta cada candidato usando el grafo de conexiones (BFS).
3. Ordena la tabla por fragmento y luego por menor distancia.
4. Para determinar el plan final, el sistema itera esta tabla y selecciona la primera fila encontrada para cada fragmento **requerido** (lo que garantiza la menor distancia al usuario). En caso de empate, la primera opción es elegida.

#### RF-05d: Presentar el resultado

El sistema muestra:

1. **Si la consulta es posible o no.**
2. Si es posible: un plan de ejecución (`ResultadosPlan`) con las localidades y fragmentos óptimos elegidos.
3. **El Catálogo Dinámico**: Un widget flotante que despliega *todos* los fragmentos habilitados ordenados por distancia, atenuando los que no son requeridos e iluminando la selección óptima del plan.
4. **No se muestra el resultado de la consulta** (no se ejecuta un SELECT real sobre los datos).

---

### RF-06: Persistencia del estado entre interacciones

- El usuario puede cambiar de localidad (RF-02), habilitar/deshabilitar bases de datos (RF-03) o modificar la consulta (RF-04) **sin tener que reiniciar desde cero**.
- El estado de la consulta en construcción se conserva entre estas acciones.
- Debe existir una opción para **restablecer todo al estado inicial** (localidad L1, todas las BDs habilitadas, consulta vacía).

---

## 3. Casos de ejemplo para validación

### Ejemplo 1 — Condición sobre Titulo = 'Ing'

- Localidad del usuario: L1
- Todas las BDs habilitadas
- Tablas seleccionadas: `Alumno`, `Carrera`
- Campos seleccionados: `Nom` (de Alumno), `Titulo` (de Alumno), `Nomcarr` (de Carrera)
- Condición: `Titulo = 'Ing'`

**Resultado esperado:**

| Localidad | Tabla    |
|-----------|----------|
| L3        | Alumno2a |
| L5        | Alumno2b |
| L2        | Carrera  |

**Justificación:** `Nom` está en `Alumno1a` y `Alumno2a`, pero como la condición es `Titulo = 'Ing'` se descarta `Alumno1a`. `Titulo` está en `Alumno1b` y `Alumno2b`, por la misma razón se descarta `Alumno1b`. Las localidades más cercanas a L1 que tienen esos fragmentos son L3 (Alumno2a), L5 (Alumno2b) y L2 (Carrera).

---

### Ejemplo 2 — Condición sobre campo no discriminante (Nom = 'Pedro')

- Localidad del usuario: L1
- Todas las BDs habilitadas
- Tablas seleccionadas: `Alumno`, `Carrera`
- Campos seleccionados: `Nom` (de Alumno), `Titulo` (de Alumno), `Nomcarr` (de Carrera)
- Condición: `Nom = 'Pedro'`

**Resultado esperado:**

| Localidad | Tabla    |
|-----------|----------|
| L1        | Alumno1a |
| L2        | Alumno1b |
| L3        | Alumno2a |
| L5        | Alumno2b |
| L2        | Carrera  |

**Justificación:** Como la condición no involucra `Titulo`, no se puede descartar ningún fragmento; se requieren los cuatro fragmentos de `Alumno`. Las localidades más cercanas son las indicadas.

---

### Ejemplo 3 — Sin campo Titulo en SELECT

- Localidad del usuario: L1
- Todas las BDs habilitadas
- Tablas seleccionadas: `Alumno`, `Carrera`
- Campos seleccionados: `Nom` (de Alumno), `Nomcarr` (de Carrera)
- Condición: `Nom = 'Pedro'`

**Resultado esperado:**

| Localidad | Tabla    |
|-----------|----------|
| L1        | Alumno1a |
| L3        | Alumno2a |
| L2        | Carrera  |

**Justificación:** Al no seleccionar `Titulo`, no se necesitan los fragmentos `b`. Solo se necesita `Nom`, que está en `Alumno1a` y `Alumno2a`. La condición no permite descartar ninguno.

---

## 4. Restricciones y supuestos

- Las líneas de comunicación son equivalentes (mismo peso para cálculo de distancia).
- Las líneas de comunicación no fallan.
- Los equipos (nodos) no fallan; solo se deshabilitan/habilitan sus bases de datos.
- Las condiciones de join entre tablas se asumen automáticas y no las define el usuario.
- Solo se soporta **una condición simple** en el WHERE (no condiciones compuestas con AND/OR).
- La aplicación **no ejecuta** las consultas sobre datos reales; solo resuelve el plan de ejecución distribuido.
- Cualquier aspecto no especificado debe aclararse con el maestro.