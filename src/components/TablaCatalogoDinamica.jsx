import React, { useEffect, useRef, useState } from 'react';
import { Minus, Table2 } from 'lucide-react';
import { getColorForTable } from '../data';

const FRICTION = 0.88;
const RESTITUTION = 0.6;
const THRESHOLD = 0.5;

const TablaCatalogoDinamica = ({ results }) => {
  const [viewState, setViewState] = useState('compact'); 
  const widgetRef = useRef(null);
  
  const viewStateRef = useRef(viewState);
  useEffect(() => { viewStateRef.current = viewState; }, [viewState]);

  const expandido = viewState === 'expanded';
  const minimized = viewState === 'minimized' || viewState === 'restoring';
  const compact = viewState === 'compact' || viewState === 'minimizing' || viewState === 'expanded';

  const physicsState = useRef({
    x: 24, // Margen izquierdo
    y: 0,  // Se calculará en useEffect
    vx: 0,
    vy: 0,
    isDragging: false,
    hasDragged: false,
    dragStartPos: { x: 0, y: 0 },
    lastPointer: { x: 0, y: 0, time: 0 },
    animationFrameId: null,
    initialized: false
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
    if (widgetRef.current && viewState === 'compact' && !physicsState.current.initialized) {
      const h = widgetRef.current.offsetHeight || 260; 
      physicsState.current.y = window.innerHeight - h - 24;
      physicsState.current.initialized = true;
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
  }, [results]); // Se re-evalúa si cambian los resultados (ej. primera ejecución)

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
        state.x = state.x + 280 / 2 - 24;
        updateTransform();
      }
      setViewState('minimized');
    }, 220);
  };

  const handleRestore = () => {
    setViewState('restoring');
    setTimeout(() => {
      const state = physicsState.current;
      state.x = state.x - 280 / 2 + 24;
      const maxX = window.innerWidth - 280;
      if (state.x < 0) state.x = 0;
      if (state.x > maxX) state.x = maxX;
      updateTransform();
      setViewState('compact');
    }, 220);
  };

  const widgetW = expandido ? '480px' : '280px';
  const widgetH = expandido ? '60vh' : '260px';

  let containerAnimClass = '';
  if (viewState === 'compact' && viewStateRef.current !== 'expanded') containerAnimClass = 'anim-compact-in';
  if (viewState === 'minimizing') containerAnimClass = 'anim-compact-out';

  // Si no hay resultados, o no es posible, o no hay tabla catálogo, no se muestra
  if (!results || !results.posible || !results.tablaCatalogo || results.tablaCatalogo.length === 0) return null;

  const renderFilas = () => {
    let currentFragment = null;
    return results.tablaCatalogo.map((fila, index) => {
      const isFirst = fila.fragmento !== currentFragment;
      currentFragment = fila.fragmento;
      const color = getColorForTable(fila.fragmento);

      const isRequerido = results.fragmentosRequeridos && results.fragmentosRequeridos.includes(fila.fragmento);
      const isElegida = isFirst && isRequerido;

      return (
        <tr key={index} className={`border-b border-slate-100 last:border-0 ${!isRequerido ? 'opacity-50' : ''}`} style={{ backgroundColor: isElegida ? `${color.bg}15` : 'transparent' }}>
          <td className="p-2 text-sm" style={{ color: color.bg, fontWeight: 500 }}>
            {fila.fragmento}
          </td>
          <td className="p-2 text-sm text-slate-600 font-medium">
            {fila.localidad}
          </td>
          <td className="p-2 text-sm text-slate-500 whitespace-nowrap">
            {fila.distancia} salto{fila.distancia !== 1 ? 's' : ''}
          </td>
        </tr>
      );
    });
  };

  return (
    <>
      <style>{`
        @keyframes minimizeInCat {
          0% { transform: scale(0.5); opacity: 0; transform-origin: center; }
          100% { transform: scale(1); opacity: 1; transform-origin: center; }
        }
        @keyframes minimizeOutCat {
          0% { transform: scale(1); opacity: 1; transform-origin: center; }
          100% { transform: scale(0.5); opacity: 0; transform-origin: center; }
        }
        @keyframes compactInCat {
          0% { transform: scale(0.5); opacity: 0; transform-origin: bottom left; }
          100% { transform: scale(1); opacity: 1; transform-origin: bottom left; }
        }
        @keyframes compactOutCat {
          0% { transform: scale(1); opacity: 1; transform-origin: bottom left; }
          100% { transform: scale(0.5); opacity: 0; transform-origin: bottom left; }
        }
        .anim-compact-in-cat { animation: compactInCat 0.22s ease forwards; transform-origin: bottom left; }
        .anim-compact-out-cat { animation: compactOutCat 0.22s ease forwards; transform-origin: bottom left; }
        .anim-minimize-in-cat { animation: minimizeInCat 0.22s ease forwards; transform-origin: center; }
        .anim-minimize-out-cat { animation: minimizeOutCat 0.22s ease forwards; transform-origin: center; }
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
            className={`bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-white/50 flex flex-col overflow-hidden ${containerAnimClass ? containerAnimClass + '-cat' : ''} ${expandido ? 'transition-all duration-300 ease-out' : ''}`}
            style={{ 
              width: widgetW,
              maxHeight: widgetH,
              height: expandido ? widgetH : 'auto',
              opacity: expandido ? 1 : 0.95
            }}
          >
            {/* Header Controles */}
            <div 
              className={`flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50/50 ${!expandido ? 'cursor-grab active:cursor-grabbing' : ''}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="flex items-center gap-2 pointer-events-none">
                <Table2 size={18} className="text-primary" />
                <span className="text-sm font-bold text-slate-800">
                  Consulta {expandido ? "— ⛶" : ""}
                </span>
              </div>
              
              {/* Botón Minimizar */}
              {!expandido && (
                <button
                  onClick={handleMinimize}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                  title="Minimizar"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Contenido Tabla */}
            <div 
              className="flex-1 overflow-auto bg-white"
              onPointerDown={stopPhysics}
            >
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                  <tr>
                    <th className="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fragmento</th>
                    <th className="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Local.</th>
                    <th className="p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dist.</th>
                  </tr>
                </thead>
                <tbody>
                  {renderFilas()}
                </tbody>
              </table>
            </div>

            {/* Botón de Expansión/Colapso */}
            <button
              onClick={() => setViewState(expandido ? 'compact' : 'expanded')}
              style={{
                position: "absolute", 
                bottom: 8, 
                right: 8,
                opacity: expandido ? 1 : 0.18,
                background: expandido ? '#f1f5f9' : 'transparent',
                border: expandido ? '1px solid #cbd5e1' : 'none',
                borderRadius: '6px',
                cursor: "pointer",
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                fontSize: '1rem',
                transition: "all 0.25s ease",
                zIndex: 1000
              }}
              onMouseEnter={e => { if (!expandido) e.currentTarget.style.opacity = 1; }}
              onMouseLeave={e => { if (!expandido) e.currentTarget.style.opacity = 0.18; }}
              title={expandido ? "Contraer" : "Expandir"}
            >
              {expandido ? '✕' : '⛶'}
            </button>
          </div>
        )}

        {minimized && (
          <div
            className={`flex items-center justify-center cursor-grab active:cursor-grabbing w-[48px] h-[48px] rounded-full bg-white border-2 border-slate-200 shadow-md text-[1.2rem] select-none ${viewState === 'minimized' ? 'anim-minimize-in-cat' : 'anim-minimize-out-cat'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => {
              handlePointerUp(e);
              if (!physicsState.current.hasDragged) handleRestore();
            }}
            onPointerCancel={handlePointerUp}
          >
            📋
          </div>
        )}
      </div>
    </>
  );
};

export default TablaCatalogoDinamica;
