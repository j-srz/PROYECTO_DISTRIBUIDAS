import React, { useEffect, useRef, useState } from 'react';
import { Settings2, Power, Minus } from 'lucide-react';
import { GRAFO, getColorForTable } from '../data';

const FRICTION = 0.88;
const RESTITUTION = 0.6;
const THRESHOLD = 0.5;

const MinimapaGrafo = ({ currentLocation, setCurrentLocation, activeNodes, setActiveNodes }) => {
  const [viewState, setViewState] = useState('compact'); // 'compact' | 'expanded' | 'minimizing' | 'minimized' | 'restoring'
  const widgetRef = useRef(null);
  
  const viewStateRef = useRef(viewState);
  useEffect(() => { viewStateRef.current = viewState; }, [viewState]);

  const expandido = viewState === 'expanded';
  const minimized = viewState === 'minimized' || viewState === 'restoring';
  const compact = viewState === 'compact' || viewState === 'minimizing' || viewState === 'expanded';

  const physicsState = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    isDragging: false,
    hasDragged: false,
    dragStartPos: { x: 0, y: 0 },
    lastPointer: { x: 0, y: 0, time: 0 },
    animationFrameId: null
  });

  const updateTransform = () => {
    if (widgetRef.current && viewStateRef.current !== 'expanded') {
      widgetRef.current.style.transform = `translate(${physicsState.current.x}px, ${physicsState.current.y}px)`;
      widgetRef.current.style.top = '0px';
      widgetRef.current.style.left = '0px';
    } else if (widgetRef.current && viewStateRef.current === 'expanded') {
      widgetRef.current.style.transform = 'translate(-50%, -50%)';
      widgetRef.current.style.top = '50%';
      widgetRef.current.style.left = '50%';
    }
  };

  useEffect(() => {
    if (widgetRef.current && viewState === 'compact') {
      const w = 350; 
      const nodesCount = Object.keys(GRAFO).length;
      const rowsCount = Math.ceil(nodesCount / 3);
      const h = Math.max(300, rowsCount * 100 + 80); 
      
      physicsState.current.x = window.innerWidth - w - 24;
      physicsState.current.y = window.innerHeight - h - 24;
      updateTransform();
    }
    
    const onResize = () => {
      if (viewStateRef.current === 'expanded') return;
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

  useEffect(() => {
    updateTransform();
  }, [viewState]);

  useEffect(() => {
    const handleKey = (e) => { 
      if (e.key === "Escape" && viewState === "expanded") setViewState('compact'); 
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewState]);

  const physicsLoop = () => {
    const state = physicsState.current;
    if (state.isDragging || viewStateRef.current === 'expanded' || viewStateRef.current === 'minimizing' || viewStateRef.current === 'restoring') return;

    state.vx *= FRICTION;
    state.vy *= FRICTION;
    state.x += state.vx;
    state.y += state.vy;

    const w = widgetRef.current.offsetWidth;
    const h = widgetRef.current.offsetHeight;
    const maxX = window.innerWidth - w;
    const maxY = window.innerHeight - h;

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
    if (viewState === 'expanded' || viewState === 'minimizing' || viewState === 'restoring') return;
    e.stopPropagation();
    stopPhysics();
    const state = physicsState.current;
    state.isDragging = true;
    state.hasDragged = false;
    state.dragStartPos = { x: e.clientX, y: e.clientY };
    state.lastPointer = { x: e.clientX, y: e.clientY, time: performance.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (viewState === 'expanded' || viewState === 'minimizing' || viewState === 'restoring') return;
    const state = physicsState.current;
    if (!state.isDragging) return;

    const dx = e.clientX - state.lastPointer.x;
    const dy = e.clientY - state.lastPointer.y;
    
    if (Math.abs(e.clientX - state.dragStartPos.x) > 3 || Math.abs(e.clientY - state.dragStartPos.y) > 3) {
      state.hasDragged = true;
    }

    const now = performance.now();
    const dt = now - state.lastPointer.time;

    state.x += dx;
    state.y += dy;

    if (dt > 0) {
      const instVx = (dx / dt) * 16.6;
      const instVy = (dy / dt) * 16.6;
      state.vx = state.vx * 0.5 + instVx * 0.5;
      state.vy = state.vy * 0.5 + instVy * 0.5;
    }

    state.lastPointer = { x: e.clientX, y: e.clientY, time: now };
    updateTransform();
  };

  const handlePointerUp = (e) => {
    if (viewState === 'expanded' || viewState === 'minimizing' || viewState === 'restoring') return;
    const state = physicsState.current;
    if (!state.isDragging) return;
    state.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    state.animationFrameId = requestAnimationFrame(physicsLoop);
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    setViewState('minimizing');
    setTimeout(() => {
      const state = physicsState.current;
      if (widgetRef.current) {
        state.x = state.x + 350 - 52;
        updateTransform();
      }
      setViewState('minimized');
    }, 220);
  };

  const handleRestore = () => {
    setViewState('restoring');
    setTimeout(() => {
      const state = physicsState.current;
      state.x = state.x - 350 + 52;
      const maxX = window.innerWidth - 350;
      if (state.x < 0) state.x = 0;
      if (state.x > maxX) state.x = maxX;
      updateTransform();
      setViewState('compact');
    }, 220);
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
  const scale = expandido ? 2.5 : 1.25;
  
  const getNodeCoord = (nodeId) => {
    const index = nodes.indexOf(nodeId);
    if (index === -1) return { x: 0, y: 0 };
    const col = index % 3;
    const row = Math.floor(index / 3);
    return { 
      x: (40 * scale) + col * (80 * scale), 
      y: (40 * scale) + row * (80 * scale) 
    };
  };

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
  const gridW = 240 * scale;
  const gridH = Math.max(240 * scale, rowsCount * (80 * scale));
  const widgetW = expandido ? '75vw' : '350px';

  let containerAnimClass = '';
  if (viewState === 'compact' && viewStateRef.current !== 'expanded') containerAnimClass = 'anim-compact-in';
  if (viewState === 'minimizing') containerAnimClass = 'anim-compact-out';

  return (
    <>
      <style>{`
        @keyframes minimizeIn {
          0% { transform: scale(0.5); opacity: 0; transform-origin: center; }
          100% { transform: scale(1); opacity: 1; transform-origin: center; }
        }
        @keyframes minimizeOut {
          0% { transform: scale(1); opacity: 1; transform-origin: center; }
          100% { transform: scale(0.5); opacity: 0; transform-origin: center; }
        }
        @keyframes compactIn {
          0% { transform: scale(0.5); opacity: 0; transform-origin: top right; }
          100% { transform: scale(1); opacity: 1; transform-origin: top right; }
        }
        @keyframes compactOut {
          0% { transform: scale(1); opacity: 1; transform-origin: top right; }
          100% { transform: scale(0.5); opacity: 0; transform-origin: top right; }
        }
        .anim-compact-in { animation: compactIn 0.22s ease forwards; transform-origin: top right; }
        .anim-compact-out { animation: compactOut 0.22s ease forwards; transform-origin: top right; }
        .anim-minimize-in { animation: minimizeIn 0.22s ease forwards; transform-origin: center; }
        .anim-minimize-out { animation: minimizeOut 0.22s ease forwards; transform-origin: center; }
      `}</style>

      {/* Overlay de blur */}
      <div
        className="fixed inset-0 z-[998] pointer-events-none"
        style={{
          backdropFilter: expandido ? "blur(6px)" : "none",
          background: "rgba(0,0,0,0.35)",
          opacity: expandido ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: expandido ? 'auto' : 'none'
        }}
        onClick={() => { if(expandido) setViewState('compact'); }}
      />

      <div 
        ref={widgetRef}
        className={`fixed z-[999] will-change-transform flex flex-col ${expandido ? 'transition-all duration-300 ease-out' : ''}`}
        style={{ touchAction: 'none' }}
      >
        {compact && (
          <div 
            className={`bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-white/50 flex flex-col overflow-hidden ${containerAnimClass} ${expandido ? 'transition-all duration-300 ease-out' : ''}`}
            style={{ 
              width: widgetW,
              opacity: expandido ? 1 : 0.95
            }}
          >
            {/* Header Controles */}
            <div 
              className={`flex items-center justify-between p-4 pb-3 border-b border-slate-200 ${!expandido ? 'cursor-grab active:cursor-grabbing' : ''}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="flex items-center gap-2 pointer-events-none">
                <Settings2 size={18} className="text-primary" />
                <span className="text-sm font-bold text-slate-800">
                  Red Distribuida {expandido ? "(Modo Extendido)" : ""}
                </span>
              </div>
              
              {/* Botón Minimizar */}
              {!expandido && (
                <button
                  onClick={handleMinimize}
                  className="absolute top-1.5 right-2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  title="Minimizar Grafo"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Grafo / Grid contenedor */}
            <div 
              className="p-5 flex-1 overflow-auto flex items-center justify-center relative"
              onPointerDown={stopPhysics}
            >
              <div 
                className="relative bg-slate-50/50 rounded-xl border border-slate-100"
                style={{ width: gridW, height: gridH }}
              >
                {/* SVG Aristas */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${gridW} ${gridH}`}>
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
                         strokeWidth={active ? (3 * scale) : (2 * scale)}
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

                  let nodeClasses = "absolute rounded-lg flex flex-col items-center justify-start font-bold cursor-pointer transition-all duration-300 group ";
                  
                  if (isCurrent) {
                    nodeClasses += "bg-primary text-white shadow-lg shadow-primary/50 ring-4 ring-primary/20 ring-offset-1 z-20 ";
                  } else if (isActive) {
                    nodeClasses += "bg-white border-2 border-slate-500 text-slate-700 shadow-sm hover:scale-105 hover:shadow-lg hover:border-primary hover:text-primary z-10 ";
                  } else {
                    nodeClasses += "bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 opacity-60 z-10 hover:scale-105 hover:opacity-100 hover:shadow-md hover:border-slate-400 ";
                  }

                  return (
                    <div 
                      key={node} 
                      className={nodeClasses}
                      style={{ 
                        left: x, 
                        top: y, 
                        transform: 'translate(-50%, -50%)', 
                        touchAction: 'none',
                        width: 68 * scale,
                        fontSize: 9 * scale
                      }}
                      onClick={(e) => { e.stopPropagation(); setCurrentLocation(node); }}
                    >
                      {isCurrent && (
                        <div className="absolute inset-0 rounded-lg animate-pulse-ring pointer-events-none"></div>
                      )}
                      
                      <div className="w-full text-center border-b border-inherit bg-black/5" style={{ padding: `${scale * 2}px 0` }}>
                        {node}
                      </div>
                      <div className="flex flex-col w-full" style={{ padding: `${scale * 3}px`, gap: `${scale * 2}px` }}>
                        {nodeTables.map(t => {
                          const color = getColorForTable(t);
                          return (
                            <span 
                              key={t} 
                              className="block text-center leading-[1.2] truncate w-full" 
                              style={{ 
                                backgroundColor: color.bg, 
                                color: color.text,
                                padding: `0 ${scale * 2}px`,
                                borderRadius: `${scale * 3}px`,
                                fontSize: `${8 * scale}px`
                              }}
                              title={t}
                            >
                              {t}
                            </span>
                          );
                        })}
                      </div>
                      
                      {/* Botón de encendido/apagado */}
                      <button 
                        onClick={(e) => toggleNode(e, node)}
                        className={`absolute rounded-full border ${isActive ? 'bg-green-100 border-green-300 text-green-600' : 'bg-red-100 border-red-300 text-red-500'} hover:scale-125 transition-transform z-30 shadow-sm ${expandido ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        style={{
                          bottom: `-${8 * scale}px`,
                          right: `-${8 * scale}px`,
                          padding: `${scale * 2}px`
                        }}
                        title={isActive ? "Deshabilitar nodo" : "Habilitar nodo"}
                      >
                        <Power size={10 * scale} strokeWidth={3} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botón de Expansión/Colapso */}
            <button
              onClick={() => setViewState(expandido ? 'compact' : 'expanded')}
              style={{
                position: "absolute", 
                bottom: 12, 
                right: 12,
                opacity: expandido ? 1 : 0.18,
                background: expandido ? '#f1f5f9' : 'transparent',
                border: expandido ? '1px solid #cbd5e1' : 'none',
                borderRadius: '8px',
                cursor: "pointer",
                width: expandido ? '40px' : '32px',
                height: expandido ? '40px' : '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                fontSize: '1.3rem',
                transition: "all 0.25s ease",
                zIndex: 1000
              }}
              onMouseEnter={e => { if (!expandido) e.currentTarget.style.opacity = 1; }}
              onMouseLeave={e => { if (!expandido) e.currentTarget.style.opacity = 0.18; }}
              title={expandido ? "Contraer Grafo" : "Expandir Grafo"}
            >
              {expandido ? '✕' : '⛶'}
            </button>
          </div>
        )}

        {minimized && (
          <div
            className={`flex items-center justify-center cursor-grab active:cursor-grabbing w-[52px] h-[52px] rounded-full bg-white border-2 border-slate-200 shadow-md text-[1.4rem] select-none ${viewState === 'minimized' ? 'anim-minimize-in' : 'anim-minimize-out'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => {
              handlePointerUp(e);
              if (!physicsState.current.hasDragged) handleRestore();
            }}
            onPointerCancel={handlePointerUp}
          >
            🌐
          </div>
        )}
      </div>
    </>
  );
};

export default MinimapaGrafo;
