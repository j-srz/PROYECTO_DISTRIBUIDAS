import React, { useState, useMemo, useEffect } from 'react';
import MonitorSQL from './components/MonitorSQL';
import Constructor from './components/Constructor';
import ResultadosPlan from './components/ResultadosPlan';
import MinimapaGrafo from './components/MinimapaGrafo';
import { simulateTuning } from './utils/tuningAlgorithm';
import { ESTADO_INICIAL } from './data';

function App() {
  const [selectedTables, setSelectedTables] = useState(ESTADO_INICIAL.consulta.tablas);
  const [selectedFields, setSelectedFields] = useState(ESTADO_INICIAL.consulta.campos);
  const [condition, setCondition] = useState(ESTADO_INICIAL.consulta.condicion);

  const [currentLocation, setCurrentLocation] = useState(ESTADO_INICIAL.localidadActiva);
  const [activeNodes, setActiveNodes] = useState(ESTADO_INICIAL.localidadesHabilitadas);

  const [tuningResults, setTuningResults] = useState(null);

  // Clear results on graph changes
  useEffect(() => {
    setTuningResults(null);
  }, [currentLocation, activeNodes]);

  const toggleTable = (table) => {
    if (selectedTables.includes(table)) {
      const newTables = selectedTables.filter(t => t !== table);
      setSelectedTables(newTables);

      const newFields = selectedFields.filter(f => f.tabla !== table);
      setSelectedFields(newFields);

      if (condition.tabla === table) {
        setCondition({ tabla: '', field: '', operator: ESTADO_INICIAL.consulta.condicion.operator, value: '' });
      }
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  const toggleField = (campo, tabla) => {
    const yaSeleccionado = selectedFields.some(f => f.tabla === tabla && f.campo === campo);
    
    if (yaSeleccionado) {
      const nuevos = selectedFields.filter(f => !(f.tabla === tabla && f.campo === campo));
      setSelectedFields(nuevos);
      if (!nuevos.some(f => f.tabla === tabla)) {
        setSelectedTables(prev => prev.filter(t => t !== tabla));
      }
    } else {
      setSelectedFields(prev => [...prev, { tabla, campo }]);
      if (!selectedTables.includes(tabla)) {
        setSelectedTables(prev => [...prev, tabla]);
      }
    }
  };

  const handleReset = () => {
    setCurrentLocation(ESTADO_INICIAL.localidadActiva);
    setActiveNodes(ESTADO_INICIAL.localidadesHabilitadas);
    setSelectedTables(ESTADO_INICIAL.consulta.tablas);
    setSelectedFields(ESTADO_INICIAL.consulta.campos);
    setCondition(ESTADO_INICIAL.consulta.condicion);
    setTuningResults(null);
  };

  const sqlQuery = useMemo(() => {
    let query = 'SELECT ';
    
    if (selectedFields.length > 0) {
      query += selectedFields.map(f => `${f.tabla}.${f.campo}`).join(', ');
    } else {
      query += '*';
    }

    if (selectedTables.length > 0) {
      query += ' FROM ' + selectedTables.join(', ');
    } else {
      query += ' FROM ...';
    }

    if (condition.field && condition.value) {
      const fieldStr = condition.tabla ? `${condition.tabla}.${condition.field}` : condition.field;
      query += ` WHERE ${fieldStr} ${condition.operator} ${condition.value}`;
    }

    return query;
  }, [selectedTables, selectedFields, condition]);

  const handleExecute = () => {
    const result = simulateTuning({
      currentLocation,
      activeNodes,
      selectedTables,
      selectedFields,
      condition
    });
    setTuningResults(result);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans pb-32">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              Constructor de Consultas
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Base de Datos Distribuida</p>
          </div>
          <button 
            onClick={handleReset}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg shadow transition-colors"
          >
            Restablecer
          </button>
        </header>

        {/* Top Zone - Monitor SQL */}
        <MonitorSQL query={sqlQuery} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          {/* Left Column - Constructor */}
          <div className="lg:col-span-8">
            <Constructor 
              selectedTables={selectedTables}
              setSelectedTables={setSelectedTables}
              toggleTable={toggleTable}
              selectedFields={selectedFields}
              setSelectedFields={setSelectedFields}
              toggleField={toggleField}
              condition={condition}
              setCondition={setCondition}
              onExecute={handleExecute}
            />
          </div>

          {/* Right Column - Resultados Plan */}
          <div className="lg:col-span-4">
            <ResultadosPlan results={tuningResults} />
          </div>
        </div>

      </div>

      {/* Floating Widget */}
      <MinimapaGrafo 
        currentLocation={currentLocation}
        setCurrentLocation={setCurrentLocation}
        activeNodes={activeNodes}
        setActiveNodes={setActiveNodes}
      />
    </div>
  );
}

export default App;
