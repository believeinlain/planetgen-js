
import { Point, Face, Edge } from './primitives';

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

    this.radius = newRadius;

    if (priorLOD) {
      // subdivide the prior LOD
      
      // create edge and face arrays for current LOD
      this.edges = new Array<Edge>();
      this.faces = new Array<Face>();

      // iterate through edges to subdivide
      for (let edge of priorLOD.edges) {
	// add a new point for each edge at the midpoint
	let point0 = edge.points[0];
	let point1 = edge.points[1];
	let midpoint = {
	  x:point0.x+(point1.x-point0.x)/2,
	  y:point0.y+(point1.y-point0.y)/2,
	  z:point0.z+(point1.z-point0.z)/2
	};

	// shift the new point so it's radius from the origin
	let distToOrigin = Math.sqrt(midpoint.x*midpoint.x+midpoint.y*midpoint.y+midpoint.z*midpoint.z);
	let scaleFactor = this.radius/distToOrigin;
	midpoint.x *= scaleFactor;
	midpoint.y *= scaleFactor;
	midpoint.z *= scaleFactor;

	// add it to the master points array
	this.points.push(midpoint);

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

	// create new inside edges
	let midEdge0 = new Edge([midpoint01, midpoint20]);
	let midEdge1 = new Edge([midpoint12, midpoint01]);
	let midEdge2 = new Edge([midpoint20, midpoint12]);
	this.edges.push(midEdge0, midEdge1, midEdge2);

	// link up faces and edges to allow further subdivision
	this.linkFaceToEdgesByRef(
	  newFace0,
	  edge01.getSubEdgeAdjacentTo(point0),
	  edge20.getSubEdgeAdjacentTo(point0),
	  midEdge0
	);
	this.linkFaceToEdgesByRef(
	  newFace1,
	  edge01.getSubEdgeAdjacentTo(point1),
	  edge12.getSubEdgeAdjacentTo(point1),
	  midEdge1
	);
	this.linkFaceToEdgesByRef(
	  newFace2,
	  edge12.getSubEdgeAdjacentTo(point2),
	  edge20.getSubEdgeAdjacentTo(point2),
	  midEdge2
	);
	this.linkFaceToEdgesByRef(
	  newFace3,
	  midEdge0,
	  midEdge1,
	  midEdge2
	);
      }
    
    } else {
      // make an icosahedron as LOD 0
      this.edges = new Array<Edge>(30);
      this.faces = new Array<Face>(20);

      // top point
      this.points[0] = {x:0, y:0, z:this.radius};
      // bottom point
      this.points[11] = {x:0, y:0, z:-this.radius};

      let latitudeAngle = Math.atan(0.5);
      let longitudeAngle = 0.628319; //36 degrees

      // top ring is the opposite side of a triangle with hypotenuse radius and angle latitudeAngle
      let topRingHeight = this.radius*Math.sin(latitudeAngle);
      let topRingRadius = this.radius*Math.cos(latitudeAngle);

      let i: number;

      //top ring [1 - 5]
      for(i=0; i<5; i++) {
	// offset is the point's position relative to the center
	let offset: Point = {
	  x:topRingRadius*Math.cos(longitudeAngle*i*2), 
	  y:topRingRadius*Math.sin(longitudeAngle*i*2), 
	  z:topRingHeight};
	// add points 1 through 5
	this.points[1+i] = offset;
      }

      //bottom ring [6 - 10]
      for(i=0; i<5; i++) {
	// offset is the point's position relative to the origin
	let offset: Point = {
	  x:topRingRadius*Math.cos(longitudeAngle*(i*2-1)), 
	  y:topRingRadius*Math.sin(longitudeAngle*(i*2-1)), 
	  z:-topRingHeight};
	// add points 6 through 10
	this.points[6+i] = offset;
      }

      // NOTE: this is a lot of repeated code, but trust me it's way more confusing
      // to do this with for loops, since with the code laid out like this you can quickly
      // lookup which edges connect which vertices and which edges are adjacent to which faces

      // add top edges connecting to top vertex
      this.edges[0] = this.createEdge([0, 1]);
      this.edges[1] = this.createEdge([0, 2]);
      this.edges[2] = this.createEdge([0, 3]);
      this.edges[3] = this.createEdge([0, 4]);
      this.edges[4] = this.createEdge([0, 5]);

      // add top ring of edges
      this.edges[5] = this.createEdge([1, 2]);
      this.edges[6] = this.createEdge([2, 3]);
      this.edges[7] = this.createEdge([3, 4]);
      this.edges[8] = this.createEdge([4, 5]);
      this.edges[9] = this.createEdge([5, 1]);

      // add middle zigzag edges
      this.edges[10] = this.createEdge([6, 1]);
      this.edges[11] = this.createEdge([1, 7]);
      this.edges[12] = this.createEdge([7, 2]);
      this.edges[13] = this.createEdge([2, 8]);
      this.edges[14] = this.createEdge([8, 3]);
      this.edges[15] = this.createEdge([3, 9]);
      this.edges[16] = this.createEdge([9, 4]);
      this.edges[17] = this.createEdge([4, 10]);
      this.edges[18] = this.createEdge([10, 5]);
      this.edges[19] = this.createEdge([5, 6]);

      // add bottom ring of edges
      this.edges[20] = this.createEdge([6, 7]);
      this.edges[21] = this.createEdge([7, 8]);
      this.edges[22] = this.createEdge([8, 9]);
      this.edges[23] = this.createEdge([9, 10]);
      this.edges[24] = this.createEdge([10, 6]);

      // add bottom edges connecting to bottom vertex
      this.edges[25] = this.createEdge([11, 6]);
      this.edges[26] = this.createEdge([11, 7]);
      this.edges[27] = this.createEdge([11, 8]);
      this.edges[28] = this.createEdge([11, 9]);
      this.edges[29] = this.createEdge([11, 10]);

      // top faces
      this.faces[0] = this.createFace([2, 1, 0]);
      this.faces[1] = this.createFace([3, 2, 0]);
      this.faces[2] = this.createFace([4, 3, 0]);
      this.faces[3] = this.createFace([5, 4, 0]);
      this.faces[4] = this.createFace([1, 5, 0]);
      this.linkFaceToEdges(0, 0, 1, 5);
      this.linkFaceToEdges(1, 1, 2, 6);
      this.linkFaceToEdges(2, 2, 3, 7);
      this.linkFaceToEdges(3, 3, 4, 8);
      this.linkFaceToEdges(4, 4, 0, 9);

      // ring faces
      this.faces[5] = this.createFace([7, 6, 1]);
      this.faces[6] = this.createFace([7, 1, 2]);
      this.faces[7] = this.createFace([8, 7, 2]);
      this.faces[8] = this.createFace([8, 2, 3]);
      this.faces[9] = this.createFace([9, 8, 3]);
      this.faces[10] = this.createFace([9, 3, 4]);
      this.faces[11] = this.createFace([10, 9, 4]);
      this.faces[12] = this.createFace([10, 4, 5]);
      this.faces[13] = this.createFace([6, 10, 5]);
      this.faces[14] = this.createFace([6, 5, 1]);
      this.linkFaceToEdges(5, 20, 10, 11);
      this.linkFaceToEdges(6, 5, 11, 12);
      this.linkFaceToEdges(7, 21, 12, 13);
      this.linkFaceToEdges(8, 6, 13, 14);
      this.linkFaceToEdges(9, 22, 14, 15);
      this.linkFaceToEdges(10, 7, 15, 16);
      this.linkFaceToEdges(11, 23, 16, 17);
      this.linkFaceToEdges(12, 8, 17, 18);
      this.linkFaceToEdges(13, 24, 18, 19);
      this.linkFaceToEdges(14, 9, 19, 10);

      // bottom faces
      this.faces[15] = this.createFace([6, 7, 11]);
      this.faces[16] = this.createFace([7, 8, 11]);
      this.faces[17] = this.createFace([8, 9, 11]);
      this.faces[18] = this.createFace([9, 10, 11]);
      this.faces[19] = this.createFace([10, 6, 11]);
      this.linkFaceToEdges(15, 25, 26, 20);
      this.linkFaceToEdges(16, 26, 27, 21);
      this.linkFaceToEdges(17, 27, 28, 22);
      this.linkFaceToEdges(18, 28, 29, 23);
      this.linkFaceToEdges(19, 29, 25, 24);
    }

    // set numPoints to number of points in master points array after construction
    this.numPoints = this.points.length;

    // generate vertex index array
    this.facesAsVertexIndexArray = new Array<number>();
    for (let face of this.faces) {
      for (let i=0; i<3; i++) {
	this.facesAsVertexIndexArray.push(this.points.indexOf(face.points[i]));
      }
    }
  }

  // give face a reference to adjacent edges and vice versa
  // takes array indices rather than references
  linkFaceToEdges(face: number, edge0: number, edge1: number, edge2: number): void {
    // get references and call function with references
    this.linkFaceToEdgesByRef(this.faces[face], this.edges[edge0], this.edges[edge1], this.edges[edge2]);
  }
  // takes references
  linkFaceToEdgesByRef(face: Face, edge0: Edge, edge1: Edge, edge2: Edge): void {
    // give face a link to edges
    face.edges.push(edge0, edge1, edge2);
    // give edges links to face
    edge0.faces.push(face);
    edge1.faces.push(face);
    edge2.faces.push(face);
  }

  // create an edge from points in the master point array by index
  createEdge(pointIndex: number[]): Edge {
    let pointArray = [
      this.points[pointIndex[0]],
      this.points[pointIndex[1]]
    ];
    return new Edge(pointArray);
  }
  // create face from points in the master point array by index
  createFace(pointIndex: number[]): Face {
    let pointArray = [
      this.points[pointIndex[0]],
      this.points[pointIndex[1]],
      this.points[pointIndex[2]]
    ];
    return new Face(pointArray);
  }
}

export { SphereLOD };
