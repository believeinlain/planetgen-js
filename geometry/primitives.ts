
class Point { 
  x: number; 
  y: number; 
  z: number;
  vertexIndex: number;
  constructor(newX: number, newY: number, newZ: number, index?: number) {
    this.x = newX;
    this.y = newY;
    this.z = newZ;
    this.vertexIndex = index;
  }
};

class Edge {
  // index references to defining points in master points array
  // and faces in LOD face array
  points: Point[];
  faces: Face[];

  // references to keep track of while performing and following subdivision
  subEdges: Edge[];
  midpoint: Point;
  constructor(newPoints: Point[]) {
    this.points = newPoints;
    this.faces = new Array<Face>();
  }

  // returns true if this edge connects point0 and point1 in either direction
  connectsPoints(point0: Point, point1: Point): boolean {
    return ( (this.points[0] == point0 && this.points[1] == point1)
	  || (this.points[0] == point1 && this.points[1] == point0) );
  }
  // returns this edge's subEdge that connects point0 and point1
  // returns undefined if does not exist
  getSubEdgeBetween(point0: Point, point1: Point): Edge {
    if (typeof this.subEdges == undefined) return undefined;
    for (let subEdge of this.subEdges) {
      if (subEdge.connectsPoints(point0, point1)) return subEdge;
    }
    return undefined;
  }
  // returns this edge's subedge adjacent to given endpoint
  getSubEdgeAdjacentTo(point: Point): Edge {
    return this.getSubEdgeBetween(point, this.midpoint);
  }

  // create an edge from points in the master point array by index
  static createEdge(pointIndex: number[], points: Point[]): Edge {
    let pointArray = [
      points[pointIndex[0]],
      points[pointIndex[1]]
    ];
    return new Edge(pointArray);
  }
};

class Face {
  // index references to defining points in master points array
  // and edges in LOD edge array
  points: Point[];
  edges: Edge[];
  // references to keep track of following subdivision
  subFaces: Face[];
  constructor(newPoints: Point[]) {
    this.points = newPoints;
    this.edges = new Array<Edge>();
  }

  // create face from points in the master point array by index
  static createFace(pointIndex: number[], points: Point[]): Face {
    let pointArray = [
      points[pointIndex[0]],
      points[pointIndex[1]],
      points[pointIndex[2]]
    ];
    return new Face(pointArray);
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
    edge0.faces.push(face);
    edge1.faces.push(face);
    edge2.faces.push(face);
  }
};

export { Point, Face, Edge };
