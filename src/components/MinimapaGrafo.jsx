import React, { useEffect, useRef } from 'react';
import { Settings2, Power } from 'lucide-react';
import { GRAFO, getColorForTable } from '../data';

const FRICTION = 0.88;
const RESTITUTION = 0.6;
const THRESHOLD = 0.5;

const MinimapaGrafo = ({ currentLocation, setCurrentLocation, activeNodes, setActiveNodes }) => {
  const widgetRef = useRef(null);
  const physicsState = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    isDragging: false,
    lastPointer: { x: 0, y: 0, time: 0 },
    animationFrameId: null
  });

  const updateTransform = () => {
    if (widgetRef.current) {
      widgetRef.current.style.transform = `translate(${physicsState.current.x}px, ${physicsState.current.y}px)`;
    }
  };

  useEffect(() => {
    // Posición inicial (esquina inferior derecha aprox.)
    if (widgetRef.current) {
      const w = widgetRef.current.offsetWidth;
      const h = widgetRef.current.offsetHeight;
      physicsState.current.x = window.innerWidth - w - 24;
      physicsState.current.y = window.innerHeight - h - 24;
      updateTransform();
    }
    
    const onResize = () => {
      const state = physicsState.current;
      if (!widgetRef.current) return;
      const w = widgetRef.current.offsetWidth;
      const h = widgetRef.current.offsetHeight;
      const maxX = window.innerWidth - w;
      const maxY = window.innerHeight - h;
      if (state.x > maxX) state.x = maxX;
      if (state.y > maxY) state.y = maxY;
      updateTransform();
    };
    
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const physicsLoop = () => {
    const state = physicsState.current;
    if (state.isDragging) return;

    state.vx *= FRICTION;
    state.vy *= FRICTION;
    state.x += state.vx;
    state.y += state.vy;

    const w = widgetRef.current.offsetWidth;
    const h = widgetRef.current.offsetHeight;
    const maxX = window.innerWidth - w;
    const maxY = window.innerHeight - h;

    // Colisión elástica con los bordes
    if (state.x <= 0) {
      state.x = 0;
      state.vx *= -RESTITUTION;
    } else if (state.x >= maxX) {
      state.x = maxX;
      state.vx *= -RESTITUTION;
    }

    if (state.y <= 0) {
      state.y = 0;
      state.vy *= -RESTITUTION;
    } else if (state.y >= maxY) {
      state.y = maxY;
      state.vy *= -RESTITUTION;
    }

    updateTransform();

    if (Math.abs(state.vx) > THRESHOLD || Math.abs(state.vy) > THRESHOLD) {
      state.animationFrameId = requestAnimationFrame(physicsLoop);
    } else {
      state.animationFrameId = null;
    }
  };

  const stopPhysics = () => {
    const state = physicsState.current;
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
      state.vx = 0;
      state.vy = 0;
    }
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    stopPhysics();
    const state = physicsState.current;
    state.isDragging = true;
    state.lastPointer = { x: e.clientX, y: e.clientY, time: performance.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const state = physicsState.current;
    if (!state.isDragging) return;

    const dx = e.clientX - state.lastPointer.x;
    const dy = e.clientY - state.lastPointer.y;
    const now = performance.now();
    const dt = now - state.lastPointer.time;

    state.x += dx;
    state.y += dy;

    if (dt > 0) {
      // Promedio móvil para suavizar la velocidad instantánea
      const instVx = (dx / dt) * 16.6;
      const instVy = (dy / dt) * 16.6;
      state.vx = state.vx * 0.5 + instVx * 0.5;
      state.vy = state.vy * 0.5 + instVy * 0.5;
    }

    state.lastPointer = { x: e.clientX, y: e.clientY, time: now };
    updateTransform();
  };

  const handlePointerUp = (e) => {
    const state = physicsState.current;
    if (!state.isDragging) return;
    state.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    state.animationFrameId = requestAnimationFrame(physicsLoop);
  };

  const toggleNode = (e, node) => {
    e.stopPropagation();
    if (activeNodes.includes(node)) {
      setActiveNodes(activeNodes.filter(n => n !== node));
    } else {
      setActiveNodes([...activeNodes, node]);
    }
  };

  const nodes = Object.keys(GRAFO);
  
  // Función para obtener coordenadas dinámicas en grilla de 3 columnas
  const getNodeCoord = (nodeId) => {
    const index = nodes.indexOf(nodeId);
    if (index === -1) return { x: 0, y: 0 };
    const col = index % 3;
    const row = Math.floor(index / 3);
    return { x: 40 + col * 80, y: 40 + row * 80 };
  };

  // Calcular aristas estrictamente a partir de GRAFO para que coincidan topológicamente
  const edges = [];
  const addedEdges = new Set();
  nodes.forEach(node => {
    GRAFO[node].conexiones.forEach(target => {
      const key = [node, target].sort().join('-');
      if (!addedEdges.has(key)) {
        addedEdges.add(key);
        edges.push([node, target]);
      }
    });
  });

  const rowsCount = Math.ceil(nodes.length / 3);
  const gridHeight = Math.max(240, rowsCount * 80);

  return (
    <div 
      ref={widgetRef}
      onPointerDown={stopPhysics} // Cualquier clic en la ventana detiene la física
      className="fixed top-0 left-0 z-50 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl border border-white/50 p-5 w-[280px] flex flex-col will-change-transform"
    >
      
      {/* Controles (Barra de título arrastrable) */}
      <div 
        className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Settings2 size={18} className="text-primary" />
          <span className="text-sm font-bold text-slate-800">Red</span>
        </div>
      </div>

      {/* Grafo / Grid */}
      <div 
        className="relative w-[240px] bg-slate-50/50 rounded-xl border border-slate-100 mx-auto overflow-hidden"
        style={{ height: `${gridHeight}px` }}
      >
        
        {/* SVG Aristas */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 240 ${gridHeight}`}>
           {edges.map(([n1, n2], i) => {
             const active = activeNodes.includes(n1) && activeNodes.includes(n2);
             const p1 = getNodeCoord(n1);
             const p2 = getNodeCoord(n2);
             return (
               <line 
                 key={i}
                 x1={p1.x} 
                 y1={p1.y} 
                 x2={p2.x} 
                 y2={p2.y} 
                 stroke={active ? '#94a3b8' : '#e2e8f0'} 
                 strokeWidth={active ? "3" : "2"}
                 strokeDasharray={active ? "none" : "4 4"}
                 className="transition-all duration-300"
               />
             )
           })}
        </svg>

        {/* Nodos */}
        {nodes.map(node => {
          const isCurrent = node === currentLocation;
          const isActive = activeNodes.includes(node);
          const { x, y } = getNodeCoord(node);
          const nodeTables = GRAFO[node].tablas;

          let nodeClasses = "absolute w-[68px] rounded-lg flex flex-col items-center justify-start text-[9px] font-bold cursor-pointer transition-all duration-300 group ";
          
          if (isCurrent) {
            nodeClasses += "bg-primary text-white shadow-lg shadow-primary/50 ring-4 ring-primary/20 ring-offset-1 z-20 ";
          } else if (isActive) {
            nodeClasses += "bg-white border-2 border-slate-500 text-slate-700 shadow-sm hover:scale-110 hover:shadow-lg hover:border-primary hover:text-primary z-10 ";
          } else {
            nodeClasses += "bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 opacity-60 z-10 hover:scale-110 hover:opacity-100 hover:shadow-md hover:border-slate-400 ";
          }

          return (
            <div 
              key={node} 
              className={nodeClasses}
              style={{ left: x, top: y, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
              onClick={(e) => { e.stopPropagation(); setCurrentLocation(node); }}
            >
              {isCurrent && (
                <div className="absolute inset-0 rounded-lg animate-pulse-ring pointer-events-none"></div>
              )}
              
              <div className="w-full text-center py-1 border-b border-inherit bg-black/5">
                {node}
              </div>
              <div className="flex flex-col w-full px-1 py-[3px] gap-[3px]">
                {nodeTables.map(t => {
                  const color = getColorForTable(t);
                  return (
                    <span 
                      key={t} 
                      className="block text-center leading-[1.2] truncate w-full px-0.5 rounded-[3px] text-[8px]" 
                      style={{ backgroundColor: color.bg, color: color.text }}
                      title={t}
                    >
                      {t}
                    </span>
                  );
                })}
              </div>
              
              {/* Botón de encendido/apagado (Toggle) */}
              <button 
                onClick={(e) => toggleNode(e, node)}
                className={`absolute -bottom-2 -right-2 p-1 rounded-full border ${isActive ? 'bg-green-100 border-green-300 text-green-600' : 'bg-red-100 border-red-300 text-red-500'} hover:scale-125 transition-transform z-30 shadow-sm opacity-0 group-hover:opacity-100`}
                title={isActive ? "Deshabilitar nodo" : "Habilitar nodo"}
              >
                <Power size={10} strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MinimapaGrafo;
