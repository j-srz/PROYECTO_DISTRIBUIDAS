import { GRAFO, CAMPO_A_FRAGMENTOS, FRAGMENTOS_ALUMNO, TABLAS_LOGICAS } from '../data.js';

function cleanValue(val) {
  return val ? val.replace(/['"]/g, '').trim() : '';
}

// Precálculo inmutable de distancias al cargar el módulo
const DISTANCIAS = precalcularDistancias(GRAFO);

function precalcularDistancias(grafo) {
  const localidades = Object.keys(grafo);
  const distancias = {};

  localidades.forEach(origen => {
    distancias[origen] = bfs(grafo, origen);
  });

  return distancias;
}

function bfs(grafo, origen) {
  const visitados = { [origen]: 0 };
  const cola = [origen];

  while (cola.length > 0) {
    const actual = cola.shift();
    grafo[actual].conexiones.forEach(vecino => {
      if (visitados[vecino] === undefined) {
        visitados[vecino] = visitados[actual] + 1;
        cola.push(vecino);
      }
    });
  }

  return visitados;
}

export function construirTablaCatalogoDinamica(localidadesHabilitadas, localidadActiva, grafo, distancias) {
  const filas = [];
  const fragmentosDisponibles = new Set();
  
  for (const loc of localidadesHabilitadas) {
    if (grafo[loc] && grafo[loc].tablas) {
      for (const t of grafo[loc].tablas) {
        fragmentosDisponibles.add(t);
      }
    }
  }

  for (const fragmento of Array.from(fragmentosDisponibles)) {
    const candidatas = localidadesHabilitadas.filter(loc =>
      grafo[loc].tablas.includes(fragmento)
    );

    candidatas.forEach(localidad => {
      filas.push({
        fragmento,
        localidad,
        distancia: distancias[localidadActiva][localidad]
      });
    });
  }

  // Ordenar: por fragmento, luego por distancia ascendente
  filas.sort((a, b) =>
    a.fragmento.localeCompare(b.fragmento) || a.distancia - b.distancia
  );

  return filas;
}

export function simulateTuning({ currentLocation, activeNodes, selectedTables, selectedFields, condition }) {
  if (selectedTables.length === 0) {
    return { posible: false, razon: 'Seleccione al menos una tabla.' };
  }

  // Paso 1 — Fragmentos requeridos
  let fragmentosRequeridos = new Set();
  
  let camposAProcesar = selectedFields;
  if (camposAProcesar.length === 0) {
    camposAProcesar = selectedTables.flatMap(t => 
      TABLAS_LOGICAS[t].campos.map(c => ({ tabla: t, campo: c }))
    );
  }

  for (const { tabla, campo } of camposAProcesar) {
    if (tabla === 'Alumno') {
      const fragmentosFisicos = CAMPO_A_FRAGMENTOS[campo];
      if (fragmentosFisicos) {
        for (const frag of fragmentosFisicos) {
          fragmentosRequeridos.add(frag);
        }
      }
    } else {
      fragmentosRequeridos.add(tabla);
    }
  }

  // Paso 2 — Sintonía por fragmentación
  if (condition && condition.field === 'Titulo' && condition.value) {
    const valorLimpio = cleanValue(condition.value).toLowerCase();
    
    if (valorLimpio === 'lic') {
      fragmentosRequeridos.delete('Alumno2a');
      fragmentosRequeridos.delete('Alumno2b');
    } else if (valorLimpio === 'ing') {
      fragmentosRequeridos.delete('Alumno1a');
      fragmentosRequeridos.delete('Alumno1b');
    }
  }

  // Paso 3 — Tabla Catálogo Dinámica
  const tablaCatalogo = construirTablaCatalogoDinamica(activeNodes, currentLocation, GRAFO, DISTANCIAS);

  // Paso 4 — Verificación de disponibilidad
  for (const fragmento of Array.from(fragmentosRequeridos)) {
    if (!tablaCatalogo.some(f => f.fragmento === fragmento)) {
      return { 
        posible: false, 
        tablaCatalogo,
        razon: `El fragmento '${fragmento}' no está disponible en ninguna localidad habilitada.`,
        fragmentosRequeridos: Array.from(fragmentosRequeridos)
      };
    }
  }

  // Paso 5 — Elegir Óptimos
  const plan = [];
  const fragmentosProcesados = new Set();
  
  for (const fila of tablaCatalogo) {
    if (fragmentosRequeridos.has(fila.fragmento) && !fragmentosProcesados.has(fila.fragmento)) {
      plan.push({ 
        localidad: fila.localidad, 
        tabla: fila.fragmento 
      });
      fragmentosProcesados.add(fila.fragmento);
    }
  }

  // Ordenar el plan para mostrarlo de forma consistente
  plan.sort((a, b) => a.localidad.localeCompare(b.localidad) || a.tabla.localeCompare(b.tabla));

  // Resultado (Éxito)
  return {
    posible: true,
    tablaCatalogo,
    plan,
    fragmentosRequeridos: Array.from(fragmentosRequeridos)
  };
}
