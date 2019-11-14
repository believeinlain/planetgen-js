
import { Point, Face, Edge } from './primitives';
import { Icosahedron } from './icosahedron';

class SphereLOD {
  points: Array<Point>; // stores a reference to the master vertex array
  edges: Array<Edge>; // this LOD's edge array
  faces: Array<Face>; // this LOD's face array
  radius: number;
  numPoints: number; // number of points that belong to this LOD
  facesAsVertexIndexArray: number[]; // array of vertex indices comprising all faces

  // subdivide an existing LOD or create LOD 0
  constructor (newRadius: number, pointsRef: Array<Point>, priorLOD?: SphereLOD) {
    // copy reference to master vertex array
    this.points = pointsRef;
    // create edge and face arrays for current LOD
    this.edges = new Array<Edge>();
    this.faces = new Array<Face>();

    this.radius = newRadius;

    if (priorLOD) {
      // subdivide the prior LOD

      // iterate through edges to subdivide
      for (let edge of priorLOD.edges) {
	// add a new point for each edge at the midpoint
	let point0 = edge.points[0];
	let point1 = edge.points[1];
	let midpoint = new Point(
	  point0.x+(point1.x-point0.x)/2,
	  point0.y+(point1.y-point0.y)/2,
	  point0.z+(point1.z-point0.z)/2
	);

	// shift the new point so it's radius from the origin
	let distToOrigin = Math.sqrt(midpoint.x*midpoint.x+midpoint.y*midpoint.y+midpoint.z*midpoint.z);
	let scaleFactor = this.radius/distToOrigin;
	midpoint.x *= scaleFactor;
	midpoint.y *= scaleFactor;
	midpoint.z *= scaleFactor;

	// add it to the master points array
	midpoint.vertexIndex = this.points.push(midpoint) - 1;

	// create new subdivided edges
	let subEdge0 = new Edge([edge.points[0], midpoint]);
	let subEdge1 = new Edge([edge.points[1], midpoint]);
	this.edges.push(subEdge0);
	this.edges.push(subEdge1);

	// add references to new submembers of this edge
	edge.midpoint = midpoint;
	edge.subEdges = [subEdge0, subEdge1];
      }

      // iterate through faces to subdivide
      for (let face of priorLOD.faces) {
	let point0 = face.points[0];
	let point1 = face.points[1];
	let point2 = face.points[2];
	// label edge references by connecting points
	let edge01;
	let edge12;
	let edge20;
	// find edges by connecting points
	for (let edge of face.edges) {
	  // assign edge01 to the edge that connects between point0 and point1
	  if (edge.connectsPoints(point0, point1)) edge01 = edge;
	  // assign edge12 to the edge that connects between point1 and point2
	  if (edge.connectsPoints(point1, point2)) edge12 = edge;
	  // assign edge20 to the edge that connects between point2 and point0
	  if (edge.connectsPoints(point2, point0)) edge20 = edge;
	}

	// label midpoints
	let midpoint01 = edge01.midpoint;
	let midpoint12 = edge12.midpoint;
	let midpoint20 = edge20.midpoint;

	// create new faces
	let newFace0 = new Face([point0, midpoint01, midpoint20]);
	let newFace1 = new Face([point1, midpoint12, midpoint01]);
	let newFace2 = new Face([point2, midpoint20, midpoint12]);
	let newFace3 = new Face([midpoint01, midpoint12, midpoint20]);
	this.faces.push(newFace0, newFace1, newFace2, newFace3);

	// add new faces to subFaces
	face.subFaces = [newFace0, newFace1, newFace2, newFace3];

	// create new inside edges
	let midEdge0 = new Edge([midpoint01, midpoint20]);
	let midEdge1 = new Edge([midpoint12, midpoint01]);
	let midEdge2 = new Edge([midpoint20, midpoint12]);
	this.edges.push(midEdge0, midEdge1, midEdge2);

	// link up faces and edges to allow further subdivision
	Face.linkFaceToEdgesByRef(
	  newFace0,
	  edge01.getSubEdgeAdjacentTo(point0),
	  edge20.getSubEdgeAdjacentTo(point0),
	  midEdge0
	);
	Face.linkFaceToEdgesByRef(
	  newFace1,
	  edge01.getSubEdgeAdjacentTo(point1),
	  edge12.getSubEdgeAdjacentTo(point1),
	  midEdge1
	);
	Face.linkFaceToEdgesByRef(
	  newFace2,
	  edge12.getSubEdgeAdjacentTo(point2),
	  edge20.getSubEdgeAdjacentTo(point2),
	  midEdge2
	);
	Face.linkFaceToEdgesByRef(
	  newFace3,
	  midEdge0,
	  midEdge1,
	  midEdge2
	);
      }
    
    } else {
      Icosahedron.generatePrimitives(this.radius, this.points, this.edges, this.faces);
    }

    // set numPoints to number of points in master points array after construction
    this.numPoints = this.points.length;

    // generate vertex index array
    this.facesAsVertexIndexArray = new Array<number>();
    for (let face of this.faces) {
      for (let i=0; i<3; i++) {
	this.facesAsVertexIndexArray.push(face.points[i].vertexIndex);
      }
    }
  }
};

export { SphereLOD };
