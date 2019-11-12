
type Point = { x: number, y: number, z: number };
class Face {
  // index references to defining points in master points array
  // and edges in LOD edge array
  points: Point[];
  edges: Edge[];
  constructor(newPoints: Point[]) {
    this.points = newPoints;
    this.edges = new Array<Edge>();
  }
};
class Edge {
  // index references to defining points in master points array
  // and faces in LOD face array
  points: Point[];
  faces: Face[];

  // references to keep track of while performing subdivision
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
};

export { Point, Face, Edge };
