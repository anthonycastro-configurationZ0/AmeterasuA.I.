import { useState, useRef, useCallback, useEffect } from 'react';
import simulationService from '../services/simulationService';
import type { SimulationOutput, SimulationData, HistoryData, SimulationConfig } from '../types';

const getInitialState = (): SimulationData => {
    const sim = simulationService; // Use the singleton instance
    return {
        metrics: {
            mean_ameterasu: 0,
            mean_matter: 0,
            mean_gauge: 0,
            energy_density: 0,
            chaos_metric: 0,
            stability: 0,
            mi_loss: 0
        },
        fields: {
            matter: sim.field.matter_field,
            gauge: sim.field.gauge_field,
            ameterasu: sim.field.ameterasu_field
        },
        parameters: {
            mass: sim.field.mass,
            coupling: sim.field.coupling,
            learningRate: sim.mi.learning_rate,
            time: 0
        }
    };
};

export const useSimulation = (config: SimulationConfig) => {
    const simulationRef = useRef(simulationService); // Use the singleton instance
    const [simulationData, setSimulationData] = useState<SimulationData>(() => getInitialState());
    const [isRunning, setIsRunning] = useState(false);
    const animationFrameId = useRef<number | null>(null);
    const [history, setHistory] = useState<HistoryData[]>([]);

    const runCycle = useCallback((external_data: number[] = []) => {
        const newData: SimulationOutput = simulationRef.current.run_cycle(external_data);
        
        if (!newData.error) {
             setSimulationData({
                metrics: {
                    stability: newData.stability,
                    mi_loss: newData.mi_feedback.mi_loss,
                    energy_density: newData.patterns.energy_density,
                    chaos_metric: newData.patterns.chaos_metric,
                    mean_ameterasu: newData.patterns.mean_ameterasu,
                    mean_matter: newData.patterns.mean_matter,
                    mean_gauge: newData.patterns.mean_gauge,
                },
                parameters: {
                    time: newData.time,
                    mass: simulationRef.current.field.mass,
                    coupling: simulationRef.current.field.coupling,
                    learningRate: simulationRef.current.mi.learning_rate,
                },
                fields: newData.fields
            });
            
            setHistory(prevHistory => {
                const newEntry: HistoryData = {
                    time: newData.time,
                    stability: newData.stability,
                    mi_loss: newData.mi_feedback.mi_loss,
                    energy_density: newData.patterns.energy_density,
                };
                const updatedHistory = [...prevHistory, newEntry];
                return updatedHistory.length > 200 ? updatedHistory.slice(-200) : updatedHistory;
            });
        }
        
        return newData;
    }, []);


    const simulationLoop = useCallback(() => {
        runCycle([]);
        animationFrameId.current = requestAnimationFrame(simulationLoop);
    }, [runCycle]);

    const startSimulation = useCallback(() => {
        if (isRunning) return;
        setIsRunning(true);
        animationFrameId.current = requestAnimationFrame(simulationLoop);
    }, [isRunning, simulationLoop]);

    const stopSimulation = useCallback(() => {
        if (!isRunning) return;
        setIsRunning(false);
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
    }, [isRunning]);

    const stepSimulation = useCallback(() => {
        if (isRunning) return;
        runCycle([]);
    }, [isRunning, runCycle]);
    
    const triggerCycle = useCallback((external_data: number[]): SimulationOutput | null => {
        if (isRunning) return null; // Don't allow external trigger if simulation is running
        return runCycle(external_data);
    }, [isRunning, runCycle]);

    const resetSimulation = useCallback(() => {
        stopSimulation();
        simulationRef.current.reset(config);
        const initialState = getInitialState();
        setSimulationData(initialState);
        setHistory([]);
    }, [stopSimulation, config]);

    // Effect to handle live update of syntropy target without a full reset
    useEffect(() => {
      simulationRef.current.field.syntropy_target = config.syntropyTarget;
    }, [config.syntropyTarget]);
    
    // Effect to handle full reset when fundamental parameters change
    useEffect(() => {
        resetSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.initialMass, config.initialCoupling, config.width, config.height]);


    return { 
        simulationData, 
        isRunning, 
        startSimulation, 
        stopSimulation, 
        resetSimulation, 
        stepSimulation, 
        triggerCycle,
        history,
    };
};
