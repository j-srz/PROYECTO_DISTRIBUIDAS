import React from 'react';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { getColorForTable } from '../data';

const ResultadosPlan = ({ results }) => {
  return (
    <div className="h-full bg-surface rounded-xl shadow-sm border border-border p-5 flex flex-col transition-all hover:shadow-md">
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <Activity size={20} className="text-primary" />
        <h2 className="text-xl font-bold text-text">Ejecución</h2>
      </div>

      {!results ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Activity size={48} className="mb-4 opacity-20" />
          <p>Ejecutar</p>
        </div>
      ) : (
        <>
          <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 shadow-sm border ${results.posible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {results.posible ? (
              <CheckCircle2 size={24} className="text-green-500" />
            ) : (
              <AlertCircle size={24} className="text-red-500" />
            )}
            <span className={`font-semibold text-lg ${results.posible ? 'text-green-700' : 'text-red-700'}`}>
              {results.posible ? 'Consulta Ejecutable: Sí' : results.razon}
            </span>
          </div>

          {results.posible && results.plan && results.plan.length > 0 && (
            <div className="flex-1 overflow-auto rounded-lg border border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-text-muted text-sm uppercase tracking-wider">
                    <th className="p-3 border-b border-border font-medium">Localidad</th>
                    <th className="p-3 border-b border-border font-medium">Tabla / Fragm.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {results.plan.map((r, i) => {
                    const color = getColorForTable(r.tabla);
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-600 font-medium">
                          {r.localidad}
                        </td>
                        <td className="p-3 font-medium flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color.bg }}></span>
                          <span style={{ color: color.bg }}>{r.tabla}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      
    </div>
  );
};

export default ResultadosPlan;
