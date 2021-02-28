import { Point } from './geometry/primitives';
import { TectonicLOD } from './tectonics/tectonicLOD';

// allow for seeded rng
var seedrandom = require('seedrandom');

class Planet {
  protected _points: Point[];
  protected _LOD: TectonicLOD[];
  radius: number;
  private _seed: number;
  private _rng: any;
  nodeDensity: number;

  constructor(radius: number, seed: number, nodeDensity: number) {
    // initialize point array
    this._points = new Array<Point>(12);
    this.radius = radius;
    this._seed = seed;
    this._rng = seedrandom(seed); // seeded random number generator
    this.nodeDensity = nodeDensity;
    this._LOD = [];

    // initialize LOD at zero
    this._updateLOD(0);
  }

  get seed(): number{
    return this._seed;
  }

  // set new seed and regenerate all LOD levels
  changeSeed(seed: number, LODLevel: number): void {
    this._seed = seed;
    this._rng = seedrandom(seed);
    this._LOD = [];
    this._updateLOD(LODLevel);
  }

  // get the highest LOD level generated
  getMaxLODLevel(): number {
    return this._LOD.length - 1;
  }

  protected _updateLOD(LODLevel: number): void {
    // generate each new LOD up to LODLevel from the last LODLevel
    // starting at LOD.length
    for (let i = this._LOD.length; i <= LODLevel; ++i) {
      console.log(`Generating LOD level ${i}:`);
      this._LOD.push(
        new TectonicLOD(
          this._points,
          this.radius,
          this._rng,
          this.nodeDensity,
          (this._LOD.length > 0) ? this._LOD[i - 1] : null
        )
      );
      console.log(`Faces: ${this._LOD[i].faces.length}, Points: ${this._points.length}.`);
    }
  }

  getUpdatedLODMesh(LODLevel: number) {
    this._updateLOD(LODLevel);
    return this._LOD[LODLevel].meshData;
  }
}

export { Planet };
