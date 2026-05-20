import React, { useState } from 'react';
import { Database, Tags, Filter, Zap, List, Share2 } from 'lucide-react';
import { TABLAS_LOGICAS, OPERADORES, getColorForTable, FEATURE_FLAGS } from '../data';
import DiagramaER from './DiagramaER';

const Constructor = ({ 
  selectedTables, 
  setSelectedTables,
  toggleTable, 
  selectedFields, 
  setSelectedFields,
  toggleField,
  condition,
  setCondition,
  onExecute
}) => {
  const tablesList = Object.keys(TABLAS_LOGICAS);
  const [viewMode, setViewMode] = useState('list');

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Toggle de Modo (Opcional por Feature Flag) */}
      {FEATURE_FLAGS.displayGraphicSelect && (
        <div className="flex justify-center mb-2">
          <div className="bg-slate-200 p-1 rounded-lg flex items-center shadow-inner">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-primary shadow' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List size={16} />
              Modo Lista
            </button>
            <button
              onClick={() => setViewMode('graphic')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all ${
                viewMode === 'graphic' 
                  ? 'bg-white text-primary shadow' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Share2 size={16} />
              Modo Gráfico
            </button>
          </div>
        </div>
      )}

      {/* Modo Lista */}
      {viewMode === 'list' && (
        <>
          {/* Sección Tablas */}
          <section className="bg-surface rounded-xl shadow-sm border border-border p-5 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Database size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-text">Selección de Tablas (FROM)</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tablesList.map(table => {
                const isSelected = selectedTables.includes(table);
                const color = getColorForTable(table);
                return (
                  <button
                    key={table}
                    onClick={() => toggleTable(table)}
                    style={{
                      backgroundColor: isSelected ? color.bg : '#ffffff',
                      borderColor: isSelected ? color.border : color.bg,
                      color: isSelected ? color.text : color.bg,
                      borderWidth: '2px'
                    }}
                    className={`p-3 rounded-lg transition-all duration-200 font-bold text-sm
                      ${isSelected ? 'shadow-sm scale-[1.02]' : 'hover:opacity-80'}
                    `}
                  >
                    {table}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Sección Campos */}
          <section className="bg-surface rounded-xl shadow-sm border border-border p-5 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Tags size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-text">Selección de Campos (SELECT)</h2>
            </div>
            <div className="flex flex-col gap-3">
              {selectedTables.length === 0 ? (
                <p className="text-sm text-slate-400">Seleccione al menos una tabla para ver sus campos.</p>
              ) : (
                selectedTables.map(table => {
                  const camposTabla = TABLAS_LOGICAS[table].campos;
                  const color = getColorForTable(table);
                  
                  return (
                    <div key={table} className="flex flex-col gap-2 p-3 rounded-lg border bg-white shadow-sm" style={{ borderLeftWidth: '4px', borderLeftColor: color.bg }}>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: color.bg }}>{table}</span>
                      <div className="flex flex-wrap gap-2">
                        {camposTabla.map(field => {
                          const isSelected = selectedFields.some(f => f.tabla === table && f.campo === field);
                          return (
                            <button
                              key={field}
                              onClick={() => toggleField(field, table)}
                              style={{
                                backgroundColor: isSelected ? color.bg : 'transparent',
                                borderColor: color.bg,
                                color: isSelected ? color.text : color.bg,
                                borderWidth: '1.5px'
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 border
                                ${isSelected ? 'shadow-md scale-105' : 'hover:opacity-70'}
                              `}
                            >
                              {field}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}

      {/* Modo Gráfico */}
      {viewMode === 'graphic' && (
        <DiagramaER 
          selectedTables={selectedTables}
          setSelectedTables={setSelectedTables}
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
        />
      )}

      {/* Sección Condición (Siempre visible) */}
      <section className="bg-surface rounded-xl shadow-sm border border-border p-5 transition-all hover:shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-primary" />
          <h2 className="text-lg font-semibold text-text">Condición (WHERE)</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            className="flex-1 p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-shadow"
            value={condition.tabla && condition.field ? `${condition.tabla}.${condition.field}` : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) setCondition({...condition, tabla: '', field: ''});
              else {
                const [t, f] = val.split('.');
                setCondition({...condition, tabla: t, field: f});
              }
            }}
          >
            <option value="">Seleccione campo...</option>
            {selectedFields.map(f => (
              <option key={`${f.tabla}.${f.campo}`} value={`${f.tabla}.${f.campo}`}>
                {f.tabla}.{f.campo}
              </option>
            ))}
          </select>
          
          <select 
            className="w-full sm:w-24 p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-shadow"
            value={condition.operator}
            onChange={(e) => setCondition({...condition, operator: e.target.value})}
          >
            {OPERADORES.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>

          <input 
            type="text" 
            placeholder="Valor..." 
            className="flex-1 p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-shadow"
            value={condition.value}
            onChange={(e) => setCondition({...condition, value: e.target.value})}
          />
        </div>
      </section>

      {/* Botón de Acción */}
      <button 
        onClick={onExecute}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2 text-lg mt-2 group"
      >
        <Zap size={24} className="group-hover:scale-110 transition-transform" />
        Ejecutar
      </button>

    </div>
  );
};

export default Constructor;
