import type { SimulationState, SimulationOutput, SimulationConfig } from '../types';

class ModularIntelligence {
    weights1: number[][];
    weights2: number[][];
    learning_rate: number; 

    constructor(input_size = 6, hidden_size = 10) {
        this.weights1 = Array.from({ length: input_size }, () =>
            Array.from({ length: hidden_size }, () => Math.random() * 0.2 - 0.1)
        );
        this.weights2 = Array.from({ length: hidden_size }, () =>
            Array.from({ length: 2 }, () => Math.random() * 0.2 - 0.1)
        );
        this.learning_rate = 0.01;
    }

    private relu(x: number): number {
        return Math.max(0, x);
    }

    forward(inputs: number[]): number[] {
        const hidden = new Array(this.weights1[0].length).fill(0);
        for (let i = 0; i < hidden.length; i++) {
            for (let j = 0; j < inputs.length; j++) {
                hidden[i] += inputs[j] * this.weights1[j][i];
            }
            hidden[i] = this.relu(hidden[i]);
        }

        const outputs = [0, 0];
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < hidden.length; j++) {
                outputs[i] += hidden[j] * this.weights2[j][i];
            }
        }
        return outputs;
    }

    train(inputs: number[], targets: number[]): number {
        const hidden = new Array(this.weights1[0].length).fill(0);
        for (let i = 0; i < hidden.length; i++) {
            for (let j = 0; j < inputs.length; j++) {
                hidden[i] += inputs[j] * this.weights1[j][i];
            }
            hidden[i] = this.relu(hidden[i]);
        }
        const outputs = [0, 0];
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < hidden.length; j++) {
                outputs[i] += hidden[j] * this.weights2[j][i];
            }
        }

        const output_errors = [targets[0] - outputs[0], targets[1] - outputs[1]];
        const hidden_errors = new Array(hidden.length).fill(0);
        for (let i = 0; i < hidden.length; i++) {
            for (let j = 0; j < 2; j++) {
                hidden_errors[i] += output_errors[j] * this.weights2[i][j];
            }
        }

        for (let i = 0; i < hidden.length; i++) {
            for (let j = 0; j < 2; j++) {
                this.weights2[i][j] += this.learning_rate * output_errors[j] * hidden[i];
            }
        }

        for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < hidden.length; j++) {
                if (hidden[j] > 0) {
                    this.weights1[i][j] += this.learning_rate * hidden_errors[j] * inputs[i];
                }
            }
        }

        return ((targets[0] - outputs[0]) ** 2 + (targets[1] - outputs[1]) ** 2) / 2;
    }
}

class ParticleField {
    name: string;
    width: number;
    height: number;
    level: number;
    mass: number;
    coupling: number;
    gauge_field: number[][];
    matter_field: number[][];
    ameterasu_field: number[][];
    dt: number = 0.01;
    dx: number = 0.5;
    hbar: number = 1.0;
    c: number = 1.0;
    g: number = 0.1;
    gamma: number = 0.5;
    alpha: number = 0.1;
    beta: number = 0.1;
    syntropy_target: number;

    constructor(name: string, width: number, height: number, syntropy_target: number, mass: number, coupling: number, level = 0) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.level = level;
        this.mass = mass;
        this.coupling = coupling;
        this.syntropy_target = syntropy_target;
        this.resetFields();
    }

    resetFields() {
      this.gauge_field = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => Math.random() * 0.02 - 0.01));
      this.matter_field = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => Math.random() * 0.2 - 0.1));
      this.ameterasu_field = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => Math.random() * 0.2 - 0.1));
    }

    private safeIndex(coord: number, max: number): number {
        return (coord + max) % max;
    }

    update_matter_field(): number[][] {
        const psi = this.matter_field;
        const psi_new = psi.map(row => [...row]);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const psi_curr = psi[y][x];
                
                const psi_up = psi[this.safeIndex(y - 1, this.height)][x];
                const psi_down = psi[this.safeIndex(y + 1, this.height)][x];
                const psi_left = psi[y][this.safeIndex(x - 1, this.width)];
                const psi_right = psi[y][this.safeIndex(x + 1, this.width)];
                const laplacian = (psi_up + psi_down + psi_left + psi_right - 4 * psi_curr) / (this.dx ** 2);
                
                const dpsi_dt = this.gamma * laplacian + this.alpha * psi_curr - this.beta * (psi_curr ** 3);
                psi_new[y][x] = psi_curr + dpsi_dt * this.dt;
            }
        }
        this.matter_field = psi_new;
        return this.matter_field;
    }
    
    update_gauge_field(): number[][] {
        const A = this.gauge_field;
        const A_new = A.map(row => [...row]);
        const J_ameterasu = this.ameterasu_field.map(row => row.map(phi => this.coupling * phi));

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const A_curr = A[y][x];

                const A_up = A[this.safeIndex(y - 1, this.height)][x];
                const A_down = A[this.safeIndex(y + 1, this.height)][x];
                const A_left = A[y][this.safeIndex(x - 1, this.width)];
                const A_right = A[y][this.safeIndex(x + 1, this.width)];
                const d2A_d2x = (A_up + A_down + A_left + A_right - 4 * A_curr) / (this.dx ** 2);

                A_new[y][x] = A_curr + this.dt * (this.c ** 2 * d2A_d2x - J_ameterasu[y][x]);
            }
        }
        this.gauge_field = A_new;
        return this.gauge_field;
    }

    update_ameterasu_field(inputs: number[]): { phi_new: number[][], stability: number } {
        const phi_A = this.ameterasu_field;
        const phi_new = phi_A.map(row => [...row]);
        const source = (inputs.length > 0) ? inputs.reduce((a, b) => a + b, 0) / inputs.length : 0;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const phi_curr = phi_A[y][x];
                
                const phi_up = phi_A[this.safeIndex(y - 1, this.height)][x];
                const phi_down = phi_A[this.safeIndex(y + 1, this.height)][x];
                const phi_left = phi_A[y][this.safeIndex(x - 1, this.width)];
                const phi_right = phi_A[y][this.safeIndex(x + 1, this.width)];
                const d2phi_dx2 = (phi_up + phi_down + phi_left + phi_right - 4 * phi_curr) / (this.dx ** 2);

                const dV_dphi = this.mass ** 2 * phi_curr;
                const dI_dphi = this.g * this.gauge_field[y][x] ** 2;
                const d2phi_dt2 = this.c ** 2 * d2phi_dx2 - dV_dphi + this.coupling * dI_dphi + source;
                
                const syntropy_adjustment = (this.syntropy_target - phi_curr) * 0.01;
                phi_new[y][x] = phi_curr + this.dt * d2phi_dt2 + syntropy_adjustment;
            }
        }
        this.ameterasu_field = phi_new;
        
        const flat_phi = phi_new.flat();
        const mean = flat_phi.reduce((a, b) => a + b, 0) / flat_phi.length;
        const variance = flat_phi.reduce((sum, val) => sum + (val - mean) ** 2, 0) / flat_phi.length;
        const stability = Math.min(1.0, 1.0 / (1.0 + 10 * variance));

        return { phi_new, stability };
    }
}


export class FractalFieldseerFusion {
    field: ParticleField;
    mi: ModularIntelligence;
    time: number;
    patterns: any[];
    substrate: string;

    constructor(config: SimulationConfig) {
        this.field = new ParticleField("Root Field", config.width, config.height, config.syntropyTarget, config.initialMass, config.initialCoupling);
        this.mi = new ModularIntelligence();
        this.time = 0;
        this.patterns = [];
        this.substrate = 'Von Neumann (Simulated 2D)';
    }

    reset(config: SimulationConfig) {
        this.field = new ParticleField("Root Field", config.width, config.height, config.syntropyTarget, config.initialMass, config.initialCoupling);
        this.mi = new ModularIntelligence();
        this.time = 0;
    }

    saveState(): SimulationState {
        return {
            miWeights1: this.mi.weights1,
            miWeights2: this.mi.weights2,
            fieldMass: this.field.mass,
            fieldCoupling: this.field.coupling,
            time: this.time,
            patterns: this.patterns,
        };
    }

    loadState(state: SimulationState) {
        if (!state) return;
        if (state.miWeights1) this.mi.weights1 = state.miWeights1;
        if (state.miWeights2) this.mi.weights2 = state.miWeights2;
        if (state.fieldMass) this.field.mass = state.fieldMass;
        if (state.fieldCoupling) this.field.coupling = state.fieldCoupling;
        if (state.time) this.time = state.time;
        // Gracefully handle missing patterns array to prevent crash on load
        this.patterns = state.patterns || [];
    }

    run_cycle(external_data: number[]): SimulationOutput {
        try {
            const psi = this.field.update_matter_field();
            const A = this.field.update_gauge_field();
            const { phi_new: phi_A, stability } = this.field.update_ameterasu_field(external_data);

            const flat_phi = phi_A.flat();
            const flat_A = A.flat();
            const flat_psi = psi.flat();

            const patterns = {
                "mean_ameterasu": flat_phi.reduce((a, b) => a + b, 0) / flat_phi.length,
                "mean_matter": flat_psi.reduce((a, b) => a + b, 0) / flat_psi.length,
                "mean_gauge": flat_A.reduce((a, b) => a + b, 0) / flat_A.length,
                "energy_density": flat_phi.reduce((sum, phi) => sum + (0.5 * this.field.mass ** 2 * phi ** 2), 0) / flat_phi.length,
                "chaos_metric": Math.sqrt(flat_A.reduce((s, x) => s + x ** 2, 0)) / (this.field.coupling + 1e-6),
            };

            const mi_inputs = [
                stability,
                patterns["mean_ameterasu"],
                patterns["mean_matter"],
                patterns["mean_gauge"],
                patterns["energy_density"],
                patterns["chaos_metric"]
            ];

            const mi_targets = stability < 0.4 ? [0.01, -0.01] : [0.0, 0.0];
            this.mi.learning_rate = 0.001 + (1 - stability) * 0.05;
            const mi_loss = this.mi.train(mi_inputs, mi_targets);
            const mi_adjustments = this.mi.forward(mi_inputs);

            const mass_adjustment = mi_adjustments[0] * 0.01;
            const coupling_adjustment = mi_adjustments[1] * 0.01;

            this.field.mass = Math.max(0.5, Math.min(2.0, this.field.mass + mass_adjustment));
            this.field.coupling = Math.max(0.05, Math.min(1.0, this.field.coupling + coupling_adjustment));

            this.time += 1;

            const simState = {
                substrate: this.substrate,
                time: this.time,
                stability: stability,
                patterns: patterns,
                mi_feedback: {
                    mi_loss: mi_loss,
                    mass_adjustment: mass_adjustment,
                    coupling_adjustment: coupling_adjustment,
                },
                fields: {
                    matter: this.field.matter_field,
                    gauge: this.field.gauge_field,
                    ameterasu: this.field.ameterasu_field,
                }
            };
            this.patterns.push(simState);
            if (this.patterns.length > 200) {
                this.patterns.shift();
            }
            return simState;

        } catch (e) {
            const error = e instanceof Error ? e.message : "Unknown simulation error";
            console.error("Simulation cycle error:", e);
            // Return a default error state
            return {
                error: error,
                substrate: this.substrate,
                time: this.time,
                stability: 0,
                patterns: {},
                mi_feedback: { mi_loss: 0, mass_adjustment: 0, coupling_adjustment: 0 },
                fields: { matter: [], gauge: [], ameterasu: [] }
            };
        }
    }
}
