
import { SphereLOD } from './sphereLOD';
import { Point, Face } from './primitives';

class Icosphere {
  points: Point[];
  LOD: SphereLOD[];
  radius: number;

  constructor (newRadius: number, LODLevel: number = 0) {
    this.radius = newRadius;
    // initialize point array
    this.points = new Array<Point>(12);

    // generate LOD 0
    this.LOD = [new SphereLOD(this.radius, this.points)];

    this.updateLOD(LODLevel);
  }

  // returns a promise to be fulfilled when the updated LOD mesh in generated
  getUpdatedLODMeshAsync(LODLevel: number) {
    return new Promise<{vertices: number[], faces: number[], UVs: number[]}>( (resolve, reject) => {
      this.updateLOD(LODLevel);
      resolve({ 
	vertices: this._getVertices(LODLevel), 
	faces: this._getFaces(LODLevel),
	UVs: this._getUVs(LODLevel) 
      });
    });
  }

  // returns vertices in the same order as points[]
  private _getVertices(LODLevel: number): number[] {
    let result = new Array<number>();

    // Add points up to desired LOD's numpoints which should be the size of the master
    // points array just after that LODLevel was constructed
    for (let i=0; i<this.LOD[LODLevel].numPoints; ++i) {
      // add a value each for x, y, and z of the current point
      result.push(this.points[i].x, this.points[i].y, this.points[i].z);
    }
    return result;
  }

  // returns faces as a list of vertex indices, where each three represents a clockwise face
  private _getFaces(LODLevel: number): number[] {

    // get the array of vertex indices representing the faces of the desired LOD level
    return this.LOD[LODLevel].facesAsVertexIndexArray;
  }

  // returns list of debug UVs
  private _getUVs(LODLevel: number): number[] {
    let result = new Array<number>();
    for (let face of this.LOD[LODLevel].faces) {
      //      console.log("Got UVs for face "+this.LOD[LODLevel].faces.indexOf(face));
      result = result.concat(face.getDebugUVs());
    }
    return result;
  }

  updateLOD(LODLevel: number): void {
    // generate each new LOD up to LODLevel from the last LODLevel
    // starting at LOD.length
    for (let i=this.LOD.length; i<=LODLevel; ++i) {
      this.LOD.push(new SphereLOD(this.radius, this.points, this.LOD[i-1]));
    }
  }
};

export { Icosphere };
