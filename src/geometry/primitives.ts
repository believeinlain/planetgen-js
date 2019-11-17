
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
  // get the face opposite the one given (assumes face given touches this edge)
  getFaceAdjacentTo(face: Face): Face {
    return (face == this.faces[0]) ? this.faces[1] : this.faces[0];
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

// define drawtypes for debugdraw
enum DrawType {
  DebugNormal,
    DebugLink,
    DebugNode,
}

class Face {
  // index references to defining points in master points array
  // and edges in LOD edge array
  points: Point[];
  edges: Edge[];

  // drawtype for debugdraw
  drawType: DrawType;

  // references to keep track of following subdivision
  subFaces: Face[];
  constructor(newPoints: Point[]) {
    this.points = newPoints;
    this.edges = new Array<Edge>();
    this.drawType = DrawType.DebugNode;
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
    let topUV;
    let leftUV;
    let rightUV;
    if (this.drawType == DrawType.DebugNode) {
      //	console.log("DrawType Node");
	topUV = { u: 0.25, v: 1 };
	leftUV = { u: 0, v: 0.5 };
	rightUV = { u: 0.5, v: 0.5 };
    } else if (this.drawType == DrawType.DebugLink) {
      //	console.log("DrawType Link");
	topUV = { u: 0.25, v: 0.5 };
	leftUV = { u: 0, v: 0 };
	rightUV = { u: 0.5, v: 0 };
    } else {
      //	console.log("DrawType Normal");
	topUV = { u: 0.75, v: 1 };
	leftUV = { u: 0.5, v: 0.5 };
	rightUV = { u: 1, v: 0.5 };
    } 
    let UVArray = [topUV.u, topUV.v, leftUV.u, leftUV.v, rightUV.u, rightUV.v];
    //    console.log("UVs: "+UVArray);
    return UVArray;
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

export { Point, Face, Edge, DrawType };
