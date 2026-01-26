import type { Content } from '@google/genai';

// Core Types for Chat
export enum Role {
    USER = 'user',
    BOT = 'model', // Matches Gemini API roles
}

export interface Message {
    id: string;
    role: Role;
    content: string;
}

// Types for Application Settings
export interface AiSettings {
    temperature: number; // 0.0 to 1.0, for creativity
    maxOutputTokens: number; // e.g., 1024, for verbosity
}

export interface SimulationSettings {
    syntropyTarget: number; // 0.0 to 1.0
    initialMass: number; // 0.5 to 2.0
    initialCoupling: number; // 0.05 to 1.0
}

export interface AppSettings {
    ai: AiSettings;
    simulation: SimulationSettings;
}

// Types for Simulation
export interface SimulationState {
    miWeights1: number[][];
    miWeights2: number[][];
    fieldMass: number;
    fieldCoupling: number;
    time: number;
    patterns: any[];
}

export interface SimulationConfig {
    syntropyTarget: number;
    initialMass: number;
    initialCoupling: number;
    width: number;
    height: number;
}


export interface SimulationOutput {
    substrate: string;
    time: number;
    stability: number;
    patterns: {
        [key: string]: number;
    };
    mi_feedback: {
        mi_loss: number;
        mass_adjustment: number;
        coupling_adjustment: number;
    };
    fields: {
        matter: number[][];
        gauge: number[][];
        ameterasu: number[][];
    };
    error?: string;
}

// Type for Gemini Chat History
export type GeminiHistory = Content[];


// UI-facing simulation data structures
export interface SimulationMetrics {
    stability: number;
    mi_loss: number;
    energy_density: number;
    chaos_metric: number;
    mean_ameterasu: number;
    mean_matter: number;
    mean_gauge: number;
}

export interface SimulationParameters {
    time: number;
    mass: number;
    coupling: number;
    learningRate: number;
}

export interface HistoryData {
    time: number;
    stability: number;
    mi_loss: number;
    energy_density: number;
}

// The comprehensive data structure managed by the useSimulation hook
export interface SimulationData {
    metrics: SimulationMetrics;
    parameters: SimulationParameters;
    fields: {
        matter: number[][];
        gauge: number[][];
        ameterasu: number[][];
    };
}
