
import { Icosphere } from './geometry/icosphere';
import { TectonicLOD } from './tectonics/tectonicLOD';

class Planet extends Icosphere {
  constructor (newRadius: number, newSeed: number, newNodeDensity: number) {
    super({radius: newRadius, seed: newSeed, nodeDensity: newNodeDensity} );
  }

  // set new seed and regenerate mesh
  changeSeed(newSeed: number): void {
    this._options.seed = newSeed;
    let LODLevel = this._LOD.length-1;
    this._LOD = undefined;
    this._updateLOD(LODLevel);
  }

  // get the set seed
  getSeed(): number {
    return this._options.seed;
  }

  // get the highest LOD level generated
  getLODLevel(): number {
    return this._LOD.length - 1;
  }

  protected _updateLOD(LODLevel: number): void {
    if (this._LOD == undefined) {
      // generate LOD 0
      this._LOD = [new TectonicLOD(this._points, this._options)];
    }

    // generate each new LOD up to LODLevel from the last LODLevel
    // starting at LOD.length
    for (let i=this._LOD.length; i<=LODLevel; ++i) {
      this._LOD.push(new TectonicLOD(this._points, this._options, this._LOD[i-1] as TectonicLOD));
    }
  }
};

export { Planet };
