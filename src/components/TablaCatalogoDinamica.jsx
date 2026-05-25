import React, { useEffect, useRef, useState } from 'react';
import { Minus, Table2 } from 'lucide-react';
import { getColorForTable } from '../data';

const TablaCatalogoDinamica = ({ results }) => {
  const [viewState, setViewState] = useState('compact'); 
  const viewStateRef = useRef(viewState);
  useEffect(() => { viewStateRef.current = viewState; }, [viewState]);

  const expandido = viewState === 'expanded';
  const minimized = viewState === 'minimized' || viewState === 'restoring';
  const compact = viewState === 'compact' || viewState === 'minimizing' || viewState === 'expanded';

  useEffect(() => {
    const handleKey = (e) => { 
      if (e.key === "Escape" && viewState === "expanded") setViewState('compact'); 
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewState]);

  const handleMinimize = (e) => {
    e.stopPropagation();
    setViewState('minimizing');
    setTimeout(() => {
      setViewState('minimized');
    }, 220);
  };

  const handleRestore = () => {
    setViewState('restoring');
    setTimeout(() => {
      setViewState('compact');
    }, 220);
  };

  const widgetW = expandido ? '480px' : '280px';
  const widgetH = expandido ? '60vh' : '260px';

  let containerAnimClass = '';
  if (viewState === 'compact' && viewStateRef.current !== 'expanded') containerAnimClass = 'anim-compact-in-cat';
  if (viewState === 'minimizing') containerAnimClass = 'anim-compact-out-cat';

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

  const fixedPositionStyle = expandido 
    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    : { bottom: '24px', left: '24px' };

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
        className={`fixed z-[999] will-change-transform flex flex-col ${expandido ? 'transition-all duration-300 ease-out' : ''}`}
        style={fixedPositionStyle}
      >
        {compact && (
          <div 
            className={`bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-white/50 flex flex-col overflow-hidden ${containerAnimClass} ${expandido ? 'transition-all duration-300 ease-out' : ''}`}
            style={{ 
              width: widgetW,
              maxHeight: widgetH,
              height: expandido ? widgetH : 'auto',
              opacity: expandido ? 1 : 0.95
            }}
          >
            {/* Header Controles */}
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 pointer-events-none">
                <Table2 size={18} className="text-primary" />
                <span className="text-sm font-bold text-slate-800">
                  Catálogo Consulta {expandido ? "— ⛶" : ""}
                </span>
              </div>
              
              {/* Botón Minimizar */}
              {!expandido && (
                <button
                  onClick={handleMinimize}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                  title="Minimizar"
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Contenido Tabla */}
            <div className="flex-1 overflow-auto bg-white">
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
            className={`flex items-center justify-center cursor-pointer w-[48px] h-[48px] rounded-full bg-white border-2 border-slate-200 shadow-md text-[1.2rem] select-none ${viewState === 'minimized' ? 'anim-minimize-in-cat' : 'anim-minimize-out-cat'}`}
            onClick={handleRestore}
          >
            📋
          </div>
        )}
      </div>
    </>
  );
};

export default TablaCatalogoDinamica;
