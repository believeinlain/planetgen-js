
class Point { 
  x: number; 
  y: number; 
  z: number;
  constructor(newX: number, newY: number, newZ: number) {
    this.x = newX;
    this.y = newY;
    this.z = newZ;
  }
};

class Edge {
  private _points: Point[];
  private _faces: Face[];

  // references to keep track of while performing and following subdivision
  subEdges: Edge[];
  midpoint: Point;

  constructor(pointArray: Point[], pointIndices?: number[]) {
    this._faces = new Array<Face>();
    if (pointIndices === undefined) {
      // if we don't have indices, create an edge from the points given
      this._points = pointArray;
    } else {
      // if we do have indices, create an edge from looking up the indices in the given array
      this._points = [ pointArray[pointIndices[0]], pointArray[pointIndices[1]] ];
    }
  }

  getPoint(index: number): Point {
    return this._points[index];
  }

  hasPoint(point: Point): boolean {
    return !(this._points.indexOf(point) === -1);
  }

  getFace(index: number): Face {
    return this._faces[index];
  }

  addFace(face: Face): void {
    this._faces.push(face);
  }

  getFaceArray(): Face[] {
    return [...this._faces];
  }

  // returns true if this edge connects point0 and point1 in either direction
  connectsPoints(point0: Point, point1: Point): boolean {
    return ( (this._points[0] === point0 && this._points[1] === point1)
	  || (this._points[0] === point1 && this._points[1] === point0) );
  }
  // returns this edge's subEdge that connects point0 and point1
  // returns undefined if does not exist
  getSubEdgeBetween(point0: Point, point1: Point): Edge {
    if (typeof this.subEdges === undefined) return undefined;
    for (let subEdge of this.subEdges) {
      if (subEdge.connectsPoints(point0, point1)) return subEdge;
    }
    return undefined;
  }
  // returns this edge's subedge adjacent to given endpoint
  getSubEdgeAdjacentTo(point: Point): Edge {
    return this.getSubEdgeBetween(point, this.midpoint);
  }
  // get the face opposite the one given (assumes face given touches this edge)
  getFaceAdjacentTo(face: Face): Face {
    return (face === this._faces[0]) ? this._faces[1] : this._faces[0];
  }

  // return the point that this edge shares with other,
  // else return undefined
  getSharedPoint(other: Edge): Point {
    for (let point of this._points) {
      if (other.hasPoint(point)) return point;
    }
    return undefined;
  }
};

class Face {
  // references to defining points in master points array
  // and edges in LOD edge array
  points: Point[];
  edges: Edge[];
  debugUVs: number[];

  // references to keep track of following subdivision
  subFaces: Face[];
  constructor(pointArray: Point[], pointIndices?: number[]) {
    this.edges = new Array<Edge>();
    if (pointIndices === undefined) {
      // if we don't have indices, create a face from the points given
      this.points = pointArray;
    } else {
      // if we do have indices, create a face from looking up the indices in the given array
      this.points = [
	pointArray[pointIndices[0]],
	pointArray[pointIndices[1]],
	pointArray[pointIndices[2]]
      ];
    }
    // set 'normal' uvs as the default
    let topUV = { u: 0.75, v: 1 };
    let leftUV = { u: 0.5, v: 0.5 };
    let rightUV = { u: 1, v: 0.5 };
    this.debugUVs = [topUV.u, topUV.v, leftUV.u, leftUV.v, rightUV.u, rightUV.v];
  }

  // get all faces adjacent to this one
  getAdjacentFaces(): Face[] {
    let result = new Array<Face>();
    for (let edge of this.edges) {
      result.push(edge.getFaceAdjacentTo(this));
    }
    return result;
  }

  // returns UV coordinates for debugdraw
  getDebugUVs(): number[] {
    return this.debugUVs;
  }

  getEdgesByPoints(): {edge01: Edge, edge12: Edge, edge20:Edge} {
    // label edge references by connecting points
    let edge01;
    let edge12;
    let edge20;
    // find edges by connecting points
    for (let edge of this.edges) {
      // assign edge01 to the edge that connects between point0 and point1
      if (edge.connectsPoints(this.points[0], this.points[1])) edge01 = edge;
      // assign edge12 to the edge that connects between point1 and point2
      if (edge.connectsPoints(this.points[1], this.points[2])) edge12 = edge;
      // assign edge20 to the edge that connects between point2 and point0
      if (edge.connectsPoints(this.points[2], this.points[0])) edge20 = edge;
    }
    return {edge01, edge12, edge20};
  }

  // give face a reference to adjacent edges and vice versa
  // takes array indices rather than references
  static linkFaceToEdges(face: number, edge0: number, edge1: number, edge2: number, edges: Edge[], faces: Face[]): void {
    // get references and call function with references
    Face.linkFaceToEdgesByRef(faces[face], edges[edge0], edges[edge1], edges[edge2]);
  }

  // takes references
  static linkFaceToEdgesByRef(face: Face, edge0: Edge, edge1: Edge, edge2: Edge): void {
    // give face a link to edges
    face.edges.push(edge0, edge1, edge2);
    // give edges links to face
    edge0.addFace(face);
    edge1.addFace(face);
    edge2.addFace(face);
  }
};

export { Point, Face, Edge };
