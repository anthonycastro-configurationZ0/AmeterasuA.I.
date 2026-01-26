import { FractalFieldseerFusion } from '../simulation';
import type { SimulationConfig } from '../types';

const defaultConfig: SimulationConfig = {
    syntropyTarget: 0.5,
    initialMass: 1.0,
    initialCoupling: 0.1,
    width: 50,
    height: 50,
};

const simulation = new FractalFieldseerFusion(defaultConfig);

export default simulation;
