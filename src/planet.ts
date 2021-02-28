import { Point } from './geometry/primitives';
import { TectonicLOD } from './tectonics/tectonicLOD';

class Planet {
  protected _points: Point[];
  protected _LOD: TectonicLOD[];
  radius: number;
  seed: number;
  nodeDensity: number;

  constructor(radius: number, seed: number, nodeDensity: number) {
    // initialize point array
    this._points = new Array<Point>(12);
    this.radius = radius;
    this.seed = seed;
    this.nodeDensity = nodeDensity;

    // initialize LOD at zero
    this._updateLOD(0);
  }

  // set new seed and regenerate mesh
  changeSeed(newSeed: number): void {
    this.seed = newSeed;
    let LODLevel = this._LOD.length - 1;
    this._LOD = undefined;
    this._updateLOD(LODLevel);
  }

  // get the set seed
  getSeed(): number {
    return this.seed;
  }

  // get the highest LOD level generated
  getLODLevel(): number {
    return this._LOD.length - 1;
  }

  protected _updateLOD(LODLevel: number): void {
    if (this._LOD == undefined) {
      // generate LOD 0
      this._LOD = [new TectonicLOD(this._points, this.radius, this.seed, this.nodeDensity)];
    }

    // generate each new LOD up to LODLevel from the last LODLevel
    // starting at LOD.length
    for (let i = this._LOD.length; i <= LODLevel; ++i) {
      this._LOD.push(
        new TectonicLOD(
          this._points,
          this.radius,
          this.seed,
          this.nodeDensity,
          this._LOD[i - 1] as TectonicLOD
        )
      );
    }
  }

  getUpdatedLODMesh(LODLevel: number) {
    this._updateLOD(LODLevel);
    return this._LOD[LODLevel].meshData;
  }
}

export { Planet };
