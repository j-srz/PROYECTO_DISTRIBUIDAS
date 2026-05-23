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

  const plan = [];

  // Paso 3 & 4 — Verificación de disponibilidad y Localidad más cercana
  for (const fragmento of Array.from(fragmentosRequeridos)) {
    let localidadElegida = null;
    let minimaDistancia = Infinity;

    // Buscar en qué localidades habilitadas existe
    for (const candidata of activeNodes) {
      if (GRAFO[candidata].tablas.includes(fragmento)) {
        const distancia = DISTANCIAS[currentLocation][candidata];
        
        if (distancia !== undefined && distancia < minimaDistancia) {
          minimaDistancia = distancia;
          localidadElegida = candidata;
        }
      }
    }

    if (!localidadElegida) {
      return { 
        posible: false, 
        razon: `El fragmento '${fragmento}' no está disponible en ninguna localidad habilitada.` 
      };
    }

    plan.push({ 
      localidad: localidadElegida, 
      tabla: fragmento 
    });
  }

  // Ordenar el plan para mostrarlo de forma consistente
  plan.sort((a, b) => a.localidad.localeCompare(b.localidad) || a.tabla.localeCompare(b.tabla));

  // Paso 5 — Resultado (Éxito)
  return {
    posible: true,
    plan
  };
}
