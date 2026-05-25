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

export const FRAGMENTOS_ALUMNO = {
  Alumno1a: { campos: ["NoCtrl", "Nom", "Ap", "Am", "Dom", "Tel"], condicion: "Titulo = 'Lic'" },
  Alumno1b: { campos: ["NoCtrl", "Cvecarr", "Sem", "Prom", "Titulo"], condicion: "Titulo = 'Lic'" },
  Alumno2a: { campos: ["NoCtrl", "Nom", "Ap", "Am", "Dom", "Tel"], condicion: "Titulo = 'Ing'" },
  Alumno2b: { campos: ["NoCtrl", "Cvecarr", "Sem", "Prom", "Titulo"], condicion: "Titulo = 'Ing'" }
};

export const TABLAS_LOGICAS = {
  Alumno: { campos: ["NoCtrl", "Nom", "Ap", "Am", "Dom", "Tel", "Cvecarr", "Sem", "Prom", "Titulo"] },
  Carrera: { campos: ["Cvecarr", "Nomcarr", "Añocarr"] },
  Materia: { campos: ["Cvemat", "Nommat", "Creditos"] },
  Maestro: { campos: ["Cvemaestro", "Nommaestro", "Apmaestro", "Ammaestro", "Grado"] },
  Califica: { campos: ["NoCtrl", "Cvemat", "Cvemaestro", "Calificacion", "Oportunidad"] }
};

export const CAMPO_A_FRAGMENTOS = {
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
};

export const ESTADO_INICIAL = {
  localidadActiva: "L1",
  localidadesHabilitadas: ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9"],
  consulta: {
    tablas: [],
    campos: [],
    condicion: { tabla: "", field: "", operator: "=", value: "" }
  }
};

export const OPERADORES = ["<", ">", "=", "<>", ">=", "<="];

export const COLORES_TABLA = {
  Alumno:   { bg: "#4F86F7", border: "#2563EB", text: "#FFFFFF" }, // azul
  Carrera:  { bg: "#F97316", border: "#EA580C", text: "#FFFFFF" }, // naranja
  Materia:  { bg: "#10B981", border: "#059669", text: "#FFFFFF" }, // verde
  Maestro:  { bg: "#8B5CF6", border: "#7C3AED", text: "#FFFFFF" }, // violeta
  Califica: { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF" }  // rojo
};

export const getColorForTable = (nombre) => {
  const esFragmentoAlumno = Object.keys(FRAGMENTOS_ALUMNO).includes(nombre);
  return esFragmentoAlumno ? COLORES_TABLA["Alumno"] : COLORES_TABLA[nombre];
};

export const POSICIONES_INICIALES_ER = {
  Alumno:   { x: 40,  y: 60  },
  Carrera:  { x: 340, y: 60  },
  Califica: { x: 190, y: 240 },
  Materia:  { x: 40,  y: 420 },
  Maestro:  { x: 340, y: 420 }
};

export const POSICION_DEFAULT_ER = { x: 20, y: 20 };

export const FISICA_ER = {
  FRICTION:     0.88,
  RESTITUTION:  0.6,
  THRESHOLD:    0.5
};

export const FEATURE_FLAGS = {
  displayGraphicSelect: true
};
