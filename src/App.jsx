import React, { useState, useMemo, useEffect } from 'react';
import MonitorSQL from './components/MonitorSQL';
import Constructor from './components/Constructor';
import ResultadosPlan from './components/ResultadosPlan';
import MinimapaGrafo from './components/MinimapaGrafo';
import { simulateTuning } from './utils/tuningAlgorithm';
import { ESTADO_INICIAL, TABLAS_LOGICAS, OPERADORES } from './data';

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

      // Clean up fields and condition that are no longer available
      const availableFieldsSet = new Set(
        newTables.flatMap(t => TABLAS_LOGICAS[t].campos)
      );

      const newFields = selectedFields.filter(f => availableFieldsSet.has(f));
      setSelectedFields(newFields);

      if (condition.field && !availableFieldsSet.has(condition.field)) {
        setCondition({ field: '', operator: ESTADO_INICIAL.consulta.condicion.operador, value: '' });
      }
    } else {
      setSelectedTables([...selectedTables, table]);
    }
  };

  const toggleField = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
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
      query += selectedFields.join(', ');
    } else {
      query += '*';
    }

    if (selectedTables.length > 0) {
      query += ' FROM ' + selectedTables.join(', ');
    } else {
      query += ' FROM ...';
    }

    if (condition.field && condition.value) {
      query += ` WHERE ${condition.field} ${condition.operator} ${condition.value}`;
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
              toggleTable={toggleTable}
              selectedFields={selectedFields}
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
