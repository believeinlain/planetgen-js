
import { Face } from '../geometry/primitives';

var seedrandom = require('seedrandom');

class FaultLink {
  location: Face;
  connection: FaultLink[];
};

class FaultNode extends FaultLink {
};

class Tectonics {
  nodes: FaultNode[];
  rng;

  constructor(seed: number, faces: Face[]) {
    this.rng = seedrandom(seed);
  }
};

export { Tectonics };
