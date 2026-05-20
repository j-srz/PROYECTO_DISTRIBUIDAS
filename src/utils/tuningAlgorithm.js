import { GRAFO, CAMPO_A_FRAGMENTOS, FRAGMENTOS_ALUMNO, TABLAS_LOGICAS } from '../data.js';

function cleanValue(val) {
  return val ? val.replace(/['"]/g, '').trim() : '';
}

export function simulateTuning({ currentLocation, activeNodes, selectedTables, selectedFields, condition }) {
  if (selectedTables.length === 0) {
    return { success: false, message: 'Seleccione al menos una tabla.', results: [] };
  }

  // Paso 1 — Determinar fragmentos necesarios
  let requiredFragments = new Set();

  let fieldsToProcess = selectedFields;
  // Si no hay campos seleccionados explícitamente (SELECT *), procesamos todos los de las tablas
  if (fieldsToProcess.length === 0) {
    fieldsToProcess = selectedTables.flatMap(t => 
      TABLAS_LOGICAS[t].campos.map(c => ({ tabla: t, campo: c }))
    );
  }

  for (const { tabla, campo } of fieldsToProcess) {
    if (tabla === 'Alumno') {
      const fragments = CAMPO_A_FRAGMENTOS[campo];
      if (fragments) {
        for (const frag of fragments) {
          requiredFragments.add(frag);
        }
      }
    } else {
      // Para cualquier otra tabla, el fragmento ES la tabla misma
      requiredFragments.add(tabla);
    }
  }

  // Paso 2 — Aplicar sintonía por condición de fragmentación
  if (condition && condition.field && condition.operator && condition.value) {
    const valStr = cleanValue(condition.value).toLowerCase();
    
    for (const frag of Array.from(requiredFragments)) {
      if (FRAGMENTOS_ALUMNO[frag] && FRAGMENTOS_ALUMNO[frag].condicion) {
        const condString = FRAGMENTOS_ALUMNO[frag].condicion;
        // Asume formato "Campo = 'Valor'"
        const parts = condString.split('=');
        if (parts.length === 2) {
          const fragField = parts[0].trim();
          const fragVal = cleanValue(parts[1]).toLowerCase();
          
          if (condition.field === fragField) {
            // Evaluamos la eliminación del fragmento si es lógicamente imposible que tenga los datos
            if (condition.operator === '=' && valStr !== fragVal) {
              requiredFragments.delete(frag);
            } else if (condition.operator === '<>' && valStr === fragVal) {
              requiredFragments.delete(frag);
            }
          }
        }
      }
    }
  }

  const results = [];
  let allFound = true;

  // Paso 3 & 4 — Verificar disponibilidad y calcular BFS
  for (const fragment of Array.from(requiredFragments)) {
    const closest = findClosestNode(fragment, currentLocation, activeNodes);
    if (closest) {
      results.push({
        fragment,
        node: closest.node,
        distance: closest.distance
      });
    } else {
      allFound = false;
      results.push({
        fragment,
        node: 'Inaccesible',
        distance: -1
      });
    }
  }

  // Ordenar resultados para mostrarlos agrupados/ordenados
  results.sort((a, b) => a.node.localeCompare(b.node) || a.fragment.localeCompare(b.fragment));

  return {
    success: allFound,
    message: allFound ? 'Consulta Ejecutable: Sí' : 'No es posible realizar la consulta',
    results
  };
}

function findClosestNode(fragment, startNode, activeNodes) {
  const queue = [{ node: startNode, distance: 0 }];
  const visited = new Set([startNode]);

  let closestNodes = [];
  let minDistance = -1;

  while (queue.length > 0) {
    const { node, distance } = queue.shift();

    if (minDistance !== -1 && distance > minDistance) {
      break;
    }

    if (activeNodes.includes(node) && GRAFO[node].tablas.includes(fragment)) {
      if (minDistance === -1) {
        minDistance = distance;
      }
      if (distance === minDistance) {
        closestNodes.push({ node, distance });
      }
    }

    const neighbors = GRAFO[node].conexiones || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor) && activeNodes.includes(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, distance: distance + 1 });
      }
    }
  }

  if (closestNodes.length > 0) {
    // Si hay empate, seleccionamos cualquiera (el primero)
    return closestNodes[0];
  }

  return null;
}
