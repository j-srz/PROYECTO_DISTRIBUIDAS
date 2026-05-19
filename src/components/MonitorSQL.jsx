import React from 'react';
import { Terminal } from 'lucide-react';

const MonitorSQL = ({ query }) => {
  return (
    <div className="w-full bg-slate-900 rounded-xl shadow-inner border border-slate-700 overflow-hidden mb-6 flex flex-col">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
        <Terminal size={16} className="text-primary-light" />
        <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Monitor SQL</span>
      </div>
      <div className="p-4 md:p-6 bg-slate-900">
        <code className="text-green-400 font-mono text-sm md:text-base break-all">
          {query || 'Esperando construcción de consulta...'}
        </code>
      </div>
    </div>
  );
};

export default MonitorSQL;
