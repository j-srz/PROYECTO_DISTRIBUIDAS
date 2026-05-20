import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  TABLAS_LOGICAS, 
  POSICIONES_INICIALES_ER, 
  POSICION_DEFAULT_ER, 
  FISICA_ER, 
  getColorForTable 
} from '../data';

const DiagramaER = ({ selectedTables, setSelectedTables, selectedFields, setSelectedFields }) => {
  const lienzaRef = useRef(null);
  const animFrameRef = useRef(null);
  const velocidades = useRef({});
  const dragState = useRef(null);

  // Inicializar posiciones
  const [posiciones, setPosiciones] = useState(() => {
    const pos = {};
    Object.keys(TABLAS_LOGICAS).forEach(tabla => {
      pos[tabla] = POSICIONES_INICIALES_ER[tabla] ?? POSICION_DEFAULT_ER;
      velocidades.current[tabla] = { vx: 0, vy: 0 };
    });
    return pos;
  });

  // Inferir relaciones
  const relaciones = useMemo(() => {
    const tablas = Object.keys(TABLAS_LOGICAS);
    const resultado = [];
    for (let i = 0; i < tablas.length; i++) {
      for (let j = i + 1; j < tablas.length; j++) {
        const camposA = TABLAS_LOGICAS[tablas[i]].campos;
        const camposB = TABLAS_LOGICAS[tablas[j]].campos;
        const comunes = camposA.filter(c => camposB.includes(c));
        comunes.forEach(campo => {
          resultado.push({ tablaA: tablas[i], tablaB: tablas[j], campoComun: campo });
        });
      }
    }
    return resultado;
  }, []);

  // Cleanup de physics al desmontar
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const calcularLimites = (tabla) => {
    if (!lienzaRef.current) return { maxX: 1000, maxY: 1000 };
    const rect = lienzaRef.current.getBoundingClientRect();
    // Aproximar ancho/alto del nodo. El ancho es fijo w-48 (192px), el alto varía por los campos
    const nodoEl = document.getElementById(`nodo-er-${tabla}`);
    const w = nodoEl ? nodoEl.offsetWidth : 192;
    const h = nodoEl ? nodoEl.offsetHeight : 200;
    return {
      maxX: rect.width - w,
      maxY: rect.height - h
    };
  };

  const iniciarFisica = (tabla, vx0, vy0) => {
    velocidades.current[tabla] = { vx: vx0, vy: vy0 };

    const tick = () => {
      const { vx, vy } = velocidades.current[tabla];

      if (Math.abs(vx) < FISICA_ER.THRESHOLD && Math.abs(vy) < FISICA_ER.THRESHOLD) {
        return;
      }

      setPosiciones(prev => {
        const limites = calcularLimites(tabla);
        let nx = prev[tabla].x + vx;
        let ny = prev[tabla].y + vy;
        let nvx = vx * FISICA_ER.FRICTION;
        let nvy = vy * FISICA_ER.FRICTION;

        if (nx < 0) { nx = 0; nvx = Math.abs(nvx) * FISICA_ER.RESTITUTION; }
        if (nx > limites.maxX) { nx = limites.maxX; nvx = -Math.abs(nvx) * FISICA_ER.RESTITUTION; }

        if (ny < 0) { ny = 0; nvy = Math.abs(nvy) * FISICA_ER.RESTITUTION; }
        if (ny > limites.maxY) { ny = limites.maxY; nvy = -Math.abs(nvy) * FISICA_ER.RESTITUTION; }

        velocidades.current[tabla] = { vx: nvx, vy: nvy };
        return { ...prev, [tabla]: { x: nx, y: ny } };
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const handlePointerDown = (e, tabla) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const rect = lienzaRef.current.getBoundingClientRect();
    const ptrX = e.clientX - rect.left;
    const ptrY = e.clientY - rect.top;
    const nodoX = posiciones[tabla].x;
    const nodoY = posiciones[tabla].y;

    dragState.current = {
      tabla,
      offsetX: ptrX - nodoX,
      offsetY: ptrY - nodoY,
      historial: [{ x: ptrX, y: ptrY, t: performance.now() }]
    };
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current) return;
    const { tabla, offsetX, offsetY, historial } = dragState.current;
    
    const rect = lienzaRef.current.getBoundingClientRect();
    const ptrX = e.clientX - rect.left;
    const ptrY = e.clientY - rect.top;

    let nx = ptrX - offsetX;
    let ny = ptrY - offsetY;

    const limites = calcularLimites(tabla);
    if (nx < 0) nx = 0;
    if (nx > limites.maxX) nx = limites.maxX;
    if (ny < 0) ny = 0;
    if (ny > limites.maxY) ny = limites.maxY;

    historial.push({ x: ptrX, y: ptrY, t: performance.now() });
    if (historial.length > 5) historial.shift();

    setPosiciones(prev => ({ ...prev, [tabla]: { x: nx, y: ny } }));
  };

  const handlePointerUp = (e) => {
    if (!dragState.current) return;
    const { tabla, historial } = dragState.current;
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (historial.length >= 2) {
      const oldest = historial[0];
      const newest = historial[historial.length - 1];
      const dt = newest.t - oldest.t;
      if (dt > 0) {
        // Velocidad en px/frame (asumiendo 60fps, ~16.6ms per frame)
        const vx0 = ((newest.x - oldest.x) / dt) * 16.6;
        const vy0 = ((newest.y - oldest.y) / dt) * 16.6;
        iniciarFisica(tabla, vx0, vy0);
      }
    }
  };

  const toggleAllFromTable = (tabla) => {
    const camposTabla = TABLAS_LOGICAS[tabla].campos;
    const camposSeleccionadosDeTabla = selectedFields.filter(f => f.tabla === tabla);

    let nuevosCampos;
    let nuevasTablas = [...selectedTables];

    if (camposSeleccionadosDeTabla.length > 0) {
      // Deseleccionar todos
      nuevosCampos = selectedFields.filter(f => f.tabla !== tabla);
      nuevasTablas = nuevasTablas.filter(t => t !== tabla);
    } else {
      // Seleccionar todos
      const todos = camposTabla.map(c => ({ tabla, campo: c }));
      nuevosCampos = [...selectedFields, ...todos];
      if (!nuevasTablas.includes(tabla)) nuevasTablas.push(tabla);
    }

    setSelectedFields(nuevosCampos);
    setSelectedTables(nuevasTablas);
  };

  const toggleGraphicField = (campo, tabla) => {
    const isSelected = selectedFields.some(f => f.tabla === tabla && f.campo === campo);
    let nuevosCampos;
    let nuevasTablas = [...selectedTables];

    if (isSelected) {
      nuevosCampos = selectedFields.filter(f => !(f.tabla === tabla && f.campo === campo));
      // Checar si quedan campos de esa tabla
      const quedan = nuevosCampos.some(f => f.tabla === tabla);
      if (!quedan) {
        nuevasTablas = nuevasTablas.filter(t => t !== tabla);
      }
    } else {
      nuevosCampos = [...selectedFields, { tabla, campo }];
      if (!nuevasTablas.includes(tabla)) nuevasTablas.push(tabla);
    }

    setSelectedFields(nuevosCampos);
    setSelectedTables(nuevasTablas);
  };

  const cx = (tabla) => {
    const el = document.getElementById(`nodo-er-${tabla}`);
    const w = el ? el.offsetWidth : 192;
    return posiciones[tabla].x + w / 2;
  };

  const cy = (tabla) => {
    const el = document.getElementById(`nodo-er-${tabla}`);
    const h = el ? el.offsetHeight : 200;
    return posiciones[tabla].y + h / 2;
  };

  return (
    <div 
      ref={lienzaRef} 
      className="relative w-full h-[600px] bg-slate-50/50 rounded-xl border border-border overflow-hidden shadow-inner"
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {relaciones.map((rel, i) => {
          const x1 = cx(rel.tablaA);
          const y1 = cy(rel.tablaA);
          const x2 = cx(rel.tablaB);
          const y2 = cy(rel.tablaB);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4 3" />
              <rect x={mx - 24} y={my - 10} width="48" height="20" fill="#f8fafc" rx="4" />
              <text x={mx} y={my + 4} fontSize="10" fill="#6B7280" textAnchor="middle" fontWeight="bold">
                {rel.campoComun}
              </text>
            </g>
          );
        })}
      </svg>

      {Object.keys(TABLAS_LOGICAS).map(tabla => {
        const color = getColorForTable(tabla);
        const pos = posiciones[tabla];
        const camposTabla = TABLAS_LOGICAS[tabla].campos;
        const seleccionados = selectedFields.filter(f => f.tabla === tabla).length;
        const total = camposTabla.length;
        
        const isTotal = seleccionados === total;
        const isPartial = seleccionados > 0 && seleccionados < total;

        let headerStyle = {};
        if (isTotal) {
          headerStyle = { backgroundColor: color.bg, color: '#ffffff', borderColor: color.bg };
        } else if (isPartial) {
          // Usando rgba para opacidad en el fondo
          const rgba = hexToRgba(color.bg, 0.12);
          headerStyle = { backgroundColor: rgba, color: color.bg, borderColor: color.bg };
        } else {
          headerStyle = { backgroundColor: '#ffffff', color: color.bg, borderColor: color.border };
        }

        return (
          <div 
            id={`nodo-er-${tabla}`}
            key={tabla}
            className="absolute w-48 rounded-lg shadow-sm border bg-white flex flex-col z-10 transition-shadow hover:shadow-md"
            style={{ left: pos.x, top: pos.y, borderColor: color.border }}
          >
            <div 
              className="p-3 border-b cursor-grab active:cursor-grabbing rounded-t-[7px] border-b-inherit flex justify-between items-center"
              style={{ ...headerStyle, touchAction: 'none' }}
              onPointerDown={(e) => handlePointerDown(e, tabla)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onDoubleClick={() => toggleAllFromTable(tabla)}
            >
              <div 
                className="font-bold flex-1"
                onClick={(e) => { e.stopPropagation(); toggleAllFromTable(tabla); }}
              >
                {tabla}
              </div>
              <div className="text-xs opacity-70 cursor-default">
                {seleccionados}/{total}
              </div>
            </div>
            
            <div className="flex flex-col p-2 gap-1 max-h-[240px] overflow-y-auto">
              {camposTabla.map(campo => {
                const isSelected = selectedFields.some(f => f.tabla === tabla && f.campo === campo);
                return (
                  <div 
                    key={campo} 
                    className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                    onClick={() => toggleGraphicField(campo, tabla)}
                  >
                    <div 
                      className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 transition-colors ${isSelected ? '' : 'bg-transparent'}`}
                      style={{ 
                        borderColor: color.bg, 
                        backgroundColor: isSelected ? color.bg : 'transparent' 
                      }}
                    />
                    <span 
                      className="text-xs font-medium truncate"
                      style={{ color: isSelected ? color.bg : '#475569' }}
                    >
                      {campo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Helper hex to rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default DiagramaER;
