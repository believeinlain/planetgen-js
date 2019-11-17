
import { Icosphere } from './geometry/icosphere';
import { TectonicLOD } from './tectonics/tectonicLOD';

class Planet extends Icosphere {

  constructor (newRadius: number, LODLevel: number = 0) {
    super(newRadius, LODLevel);
  }

  protected _updateLOD(LODLevel: number): void {
    if (this._LOD == undefined) {
      // generate LOD 0
      this._LOD = [new TectonicLOD(this._radius, this._points)];
    }

    // generate each new LOD up to LODLevel from the last LODLevel
    // starting at LOD.length
    for (let i=this._LOD.length; i<=LODLevel; ++i) {
      this._LOD.push(new TectonicLOD(this._radius, this._points, this._LOD[i-1] as TectonicLOD));
    }
  }
};

export { Planet };
