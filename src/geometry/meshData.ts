
import { Face } from '../geometry/primitives';

class MeshData {
  positions: Float32Array;
  indices: Uint32Array;
  uvs: Float32Array;
  colors: Float32Array;

  constructor (faces: Face[]) {
    // allocate space for each array
    this.positions = new Float32Array(faces.length*9);
    this.indices = new Uint32Array(faces.length*3);
    this.uvs = new Float32Array(faces.length*6);
    this.colors = new Float32Array(faces.length*12);

    // generate meshData for this LOD
    let faceIndex = 0;
    let pointIndex = 0;
    for (let face of faces) {
      let faceUVs = face.getDebugUVs();
      let facePoints = face.getPointArray();

      for (let point of facePoints) {
        // add a unique vertex for each point of each face to allow UV mapping
        this.positions[3*pointIndex] = point.x;
        this.positions[3*pointIndex+1] = point.y;
        this.positions[3*pointIndex+2] = point.z;
        // add a color for each point of each face (if set)
        let color = point.data.color;
        if (!color) color = {r:1, g:1, b:1, a:1};
        this.colors[4*pointIndex] = color.r;
        this.colors[4*pointIndex+1] = color.g;
        this.colors[4*pointIndex+2] = color.b;
        this.colors[4*pointIndex+3] = color.a;
        // add indices in the same order as we added the points
        this.indices[pointIndex] = pointIndex;
        pointIndex++;
      }
      // add uvs for each face 
      // [topUV.u, topUV.v, leftUV.u, leftUV.v, rightUV.u, rightUV.v]
      for (let i=0; i<6; i++) {
        this.uvs[6*faceIndex+i] = faceUVs[i];
      }
      faceIndex++;
    }
  }
}

export { MeshData };