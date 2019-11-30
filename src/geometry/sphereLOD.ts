
import { Point, Face, Edge } from './primitives';
import { Icosahedron } from './icosahedron';

class SphereLOD {
  points: Point[]; // stores a reference to the master vertex array
  edges: Edge[]; // this LOD's edge array
  faces: Face[]; // this LOD's face array
  radius: number;

  meshData = { vertices: [], indices: [], uvs: [] };

  // subdivide an existing LOD or create LOD 0
  constructor (newRadius: number, pointsRef: Point[], options: any, priorLOD?: SphereLOD) {
    // initialize variables
    this._initialize(newRadius, pointsRef, options);

    if (priorLOD)
      // subdivide the prior LOD
      this._subdivide(priorLOD);
    else
      // generate LOD 0
      this._generate();

    // generate meshData for this LOD
    let i=0;
    for (let face of this.faces) {
      for (let point of face.points) {
	// add a unique vertex for each point of each face to allow UV mapping
	this.meshData.vertices.push(point.x, point.y, point.z);
	// add indices in the same order as we added the points
	this.meshData.indices.push(i++);
      }
      // add uvs for each face
      this.meshData.uvs.push(...face.getDebugUVs());
    }
  }

  protected _initialize(newRadius: number, pointsRef: Point[], options: any): void {
    this.radius = newRadius;
    // copy reference to master vertex array
    this.points = pointsRef;
    // create edge and face arrays for current LOD
    this.edges = new Array<Edge>();
    this.faces = new Array<Face>();
  }

  protected _generate(): void {
    Icosahedron.generatePrimitives(this.radius, this.points, this.edges, this.faces);
  }

  // construct primitives from priorLOD
  protected _subdivide(priorLOD: SphereLOD): void {
    // iterate through edges to subdivide
    priorLOD.edges.forEach(edge => this._subdivideEdge(edge));

    // iterate through faces to subdivide
    priorLOD.faces.forEach(face => this._subdivideFace(face));
  }

  protected _subdivideEdge(edge: Edge): void {
    // add a new point for each edge at the midpoint
    let point0 = edge.getPoint(0);
    let point1 = edge.getPoint(1);
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
    this.points.push(midpoint);

    // create new subdivided edges
    let subEdge0 = new Edge([point0, midpoint]);
    let subEdge1 = new Edge([point1, midpoint]);
    this.edges.push(subEdge0);
    this.edges.push(subEdge1);

    // add references to new submembers of this edge
    edge.midpoint = midpoint;
    edge.subEdges = [subEdge0, subEdge1];
  }

  protected _subdivideFace(face: Face): void {
    let point0 = face.points[0];
    let point1 = face.points[1];
    let point2 = face.points[2];
    // label edge references by connecting points
    let {edge01, edge12, edge20} = face.getEdgesByPoints();

    // label midpoints
    let midpoint01 = edge01.midpoint;
    let midpoint12 = edge12.midpoint;
    let midpoint20 = edge20.midpoint;

    // create new faces
    let newFaces = [
      new Face([point0, midpoint01, midpoint20]),
      new Face([point1, midpoint12, midpoint01]),
      new Face([point2, midpoint20, midpoint12]),
      new Face([midpoint01, midpoint12, midpoint20])
    ];
    this.faces.push(...newFaces);

    // add new faces to subFaces
    face.subFaces = newFaces;

    // create new inside edges
    let midEdges = [
      new Edge([midpoint01, midpoint20]),
      new Edge([midpoint12, midpoint01]),
      new Edge([midpoint20, midpoint12])
    ];
    this.edges.push(...midEdges);

    // link up faces and edges to allow further subdivision
    Face.linkFaceToEdgesByRef(
      newFaces[0],
      edge01.getSubEdgeAdjacentTo(point0),
      edge20.getSubEdgeAdjacentTo(point0),
      midEdges[0]
    );
    Face.linkFaceToEdgesByRef(
      newFaces[1],
      edge01.getSubEdgeAdjacentTo(point1),
      edge12.getSubEdgeAdjacentTo(point1),
      midEdges[1]
    );
    Face.linkFaceToEdgesByRef(
      newFaces[2],
      edge12.getSubEdgeAdjacentTo(point2),
      edge20.getSubEdgeAdjacentTo(point2),
      midEdges[2]
    );
    Face.linkFaceToEdgesByRef(
      newFaces[3],
      midEdges[0],
      midEdges[1],
      midEdges[2]
    );
  }
};

export { SphereLOD };
