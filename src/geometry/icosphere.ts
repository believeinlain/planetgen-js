
import { SphereLOD } from './sphereLOD';
import { Point, Face } from './primitives';

class Icosphere {
  protected _points: Point[];
  protected _LOD: SphereLOD[];
  protected _options: any;

  // options allows for additional parameters to be passed to children of SphereLOD
  constructor (options: any) {
    this._options = options;

    // initialize point array
    this._points = new Array<Point>(12);

    // initialize LOD at zero
    this._updateLOD(0);
  }

  getUpdatedLODMesh(LODLevel: number) {
    this._updateLOD(LODLevel);
    return this._LOD[LODLevel].meshData;
  }

  protected _updateLOD(LODLevel: number): void {
    if (this._LOD == undefined) {
      // generate LOD 0
      this._LOD = [new SphereLOD(this._points, this._options)];
    }

    // generate each new LOD up to LODLevel from the last LODLevel
    // starting at LOD.length
    for (let i=this._LOD.length; i<=LODLevel; ++i) {
      this._LOD.push(new SphereLOD(this._points, this._options, this._LOD[i-1]));
    }
  }
};

export { Icosphere };
