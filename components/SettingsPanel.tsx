import React from 'react';
import type { AppSettings } from '../types';
import Icon from './Icon';

interface SettingsPanelProps {
    settings: AppSettings;
    onChange: (newSettings: AppSettings) => void;
    onClose: () => void;
    onResetSimulation: () => void;
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; description: string; }> = 
({ label, value, min, max, step, onChange, description }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-1">{label} <span className="font-bold text-violet-300">{value}</span></label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
        />
        <p className="text-xs text-slate-400 mt-1">{description}</p>
    </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange, onClose, onResetSimulation }) => {
    
    const handleAiChange = (key: keyof AppSettings['ai'], value: number) => {
        onChange({ ...settings, ai: { ...settings.ai, [key]: value } });
    };

    const handleSimChange = (key: keyof AppSettings['simulation'], value: number) => {
        onChange({ ...settings, simulation: { ...settings.simulation, [key]: value } });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-20" onClick={onClose} aria-hidden="true"></div>
            <div 
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900/80 backdrop-blur-md rounded-lg shadow-2xl shadow-indigo-900/50 ring-1 ring-violet-500/30 z-30 overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
            >
                <div className="p-6 border-b border-violet-800/60 flex justify-between items-center">
                    <h2 id="settings-title" className="text-xl font-semibold text-slate-100">Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close settings">
                        <Icon name="x-circle" className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-violet-300 border-b border-violet-700/50 pb-2 mb-4">AI Personality</h3>
                        <Slider
                            label="Creativity (Temperature)"
                            value={settings.ai.temperature}
                            min={0} max={1} step={0.1}
                            onChange={(e) => handleAiChange('temperature', parseFloat(e.target.value))}
                            description="Higher values make responses more random and creative; lower values are more focused."
                        />
                        <Slider
                            label="Verbosity (Max Tokens)"
                            value={settings.ai.maxOutputTokens}
                            min={256} max={4096} step={64}
                            onChange={(e) => handleAiChange('maxOutputTokens', parseInt(e.target.value, 10))}
                            description="Controls the maximum length of the AI's response."
                        />
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-violet-300 border-b border-violet-700/50 pb-2 mb-4">Simulation Parameters</h3>
                         <Slider
                            label="Syntropy Target"
                            value={settings.simulation.syntropyTarget}
                            min={0} max={1} step={0.05}
                            onChange={(e) => handleSimChange('syntropyTarget', parseFloat(e.target.value))}
                            description="The baseline stability the 'Ameterasu' field seeks. Higher values promote order."
                        />
                        <Slider
                            label="Initial Mass"
                            value={settings.simulation.initialMass}
                            min={0.5} max={2.0} step={0.1}
                            onChange={(e) => handleSimChange('initialMass', parseFloat(e.target.value))}
                            description="Fundamental field inertia. Higher mass resists change. (Requires Reset)"
                        />
                         <Slider
                            label="Initial Coupling"
                            value={settings.simulation.initialCoupling}
                            min={0.05} max={1.0} step={0.05}
                            onChange={(e) => handleSimChange('initialCoupling', parseFloat(e.target.value))}
                            description="Strength of interaction between fields. Higher values increase volatility. (Requires Reset)"
                        />
                        <div className="mt-4 text-center">
                             <button
                                onClick={onResetSimulation}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-md shadow-lg transition-colors"
                             >
                                Reset Simulation to Apply Changes
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsPanel;
