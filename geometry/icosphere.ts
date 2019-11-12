
import { SphereLOD } from './sphereLOD';
import { Point, Face } from './primitives';

class Icosphere {
  points: Array<Point>;
  LOD: Array<SphereLOD>;
  radius: number;

  constructor (newRadius: number, LODLevel: number = 0) {
    this.radius = newRadius;
    // initialize point array
    this.points = new Array(12);

    // generate LOD 0
    this.LOD = [new SphereLOD(this.radius, this.points)];

    this.updateLOD(LODLevel);
  }

  // returns vertices in the same order as points[]
  getVertices(LODLevel: number): number[] {
    let result: number[] = new Array();

    this.updateLOD(LODLevel);

    // Add points up to desired LOD's numpoints which should be the size of the master
    // points array just after that LODLevel was constructed
    for (let i=0; i<this.LOD[LODLevel].numPoints; ++i) {
      // add a value each for x, y, and z of the current point
      result.push(this.points[i].x, this.points[i].y, this.points[i].z);
    }
    return result;
  }

  // returns faces as a list of vertex indices, where each three represents a clockwise face
  getFaces(LODLevel: number): number[] {
    let result: number[] = new Array();

    this.updateLOD(LODLevel);

    // loop through all faces of requested LOD level
    for (let face of this.LOD[LODLevel].faces) {
      for (let i=0; i<3; i++) {
	// TODO: Move indexing to be performed during LOD generation to speed up selection
	result.push(this.points.indexOf(face.points[i]));
      }
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
}

export { Icosphere };
