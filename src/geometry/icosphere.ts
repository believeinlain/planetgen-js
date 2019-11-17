
import { SphereLOD } from './sphereLOD';
import { Point, Face } from './primitives';

class Icosphere {
  protected _points: Point[];
  protected _LOD: SphereLOD[];
  protected _radius: number;

  constructor (newRadius: number, LODLevel: number = 0) {
    this._radius = newRadius;

    // initialize point array
    this._points = new Array<Point>(12);

    // initialize LOD at specified level
    this._updateLOD(LODLevel);
  }

  // returns a promise to be fulfilled when the updated LOD mesh in generated
  getUpdatedLODMeshAsync(LODLevel: number) {
    return new Promise<{vertices: number[], indices: number[], uvs: number[]}>( (resolve, reject) => {
      this._updateLOD(LODLevel);
      resolve( this._LOD[LODLevel].meshData );
    });
  }

  protected _updateLOD(LODLevel: number): void {
    if (this._LOD == undefined) {
      // generate LOD 0
      this._LOD = [new SphereLOD(this._radius, this._points)];
    }

    // generate each new LOD up to LODLevel from the last LODLevel
    // starting at LOD.length
    for (let i=this._LOD.length; i<=LODLevel; ++i) {
      this._LOD.push(new SphereLOD(this._radius, this._points, this._LOD[i-1]));
    }
  }
};

export { Icosphere };
