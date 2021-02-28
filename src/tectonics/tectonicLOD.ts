import { Point, Edge, Face } from '../geometry/primitives';
import { MeshData } from '../geometry/meshData';
import { Icosahedron } from '../geometry/icosahedron';
import { FaultLink } from '../tectonics/faultLink';

class TectonicLOD {
  points: Point[]; // stores a reference to the master vertex array
  edges: Edge[]; // this LOD's edge array
  faces: Face[]; // this LOD's face array
  radius: number;
  meshData: MeshData;

  startingNodeDensity: number; // ratio of faces that should be nodes
  links: Map<Face, FaultLink>; // use faces as index since FaultLinks have a reference to Face already
  unpickedFaces: Face[]; // all faces that don't have FaultLinks on them
  linkedEdges: Edge[]; // all between two FaultLinks

  constructor(
    pointsRef: Point[],
    radius: number,
    rng: any,
    nodeDensity: number,
    priorLOD?: TectonicLOD
  ) {
    // initialize variables
    this.radius = radius;
    // copy reference to master vertex array
    this.points = pointsRef;
    // create edge and face arrays for current LOD
    this.edges = new Array<Edge>();
    this.faces = new Array<Face>();

    this.links = new Map<Face, FaultLink>();
    this.startingNodeDensity = nodeDensity;

    if (priorLOD)
      // subdivide the prior LOD
      this._subdivide(priorLOD, rng);
    // generate LOD 0
    else this._generate(rng);

    // generate meshData for this LOD
    this.meshData = new MeshData(this.faces);
  }

  // called if priorLOD is passed to the constructor
  // code in this function will be called in the super.constructor prior to mesh generation
  private _subdivide(priorLOD: TectonicLOD, rng: any): void {
    // subdivide mesh

    // iterate through edges to subdivide
    priorLOD.edges.forEach((edge) => this._subdivideEdge(edge));
    // iterate through faces to subdivide
    priorLOD.faces.forEach((face) => this._subdivideFace(face));

    // initialize unpicked faces after subdividing mesh
    this.unpickedFaces = this.faces.slice();
    this.linkedEdges = new Array<Edge>();

    // iterate though all super edges that connect two links
    priorLOD.linkedEdges.forEach((edge) => {
      // pick a random edge for the fault to pass through
      let linkEdgeIndex = Math.round(rng());
      // the unpicked edge must be the other index (only two subedges per edge)
      let otherEdgeIndex = (linkEdgeIndex==1) ? 0 : 1;
      // the edge picked will be a faultlink
      let targetEdge = edge.subEdges[linkEdgeIndex];
      targetEdge.data.isFaultLink = true;
      // spread color across the unpicked edge
      let corner = edge.subEdges[otherEdgeIndex].getSharedPoint(edge);
      let midpoint = edge.subEdges[otherEdgeIndex].getOtherPoint(corner);
      midpoint.data.color = corner.data.color;

      // create new FaultLinks at that edge
      let newLinks = new Array<FaultLink>();
      targetEdge.getFaceArray().forEach((face) => {
        // if link already exists, just link to it rather than creating a new one
        let existingLink = this.links.get(face);
        let newLink = existingLink ? existingLink : new FaultLink(face);
        newLinks.push(newLink);
        // add it to the links map if it we created a new link
        if (existingLink == undefined) this.links.set(face, newLink);
        // remove the face from unpicked faces
        this.unpickedFaces.filter((unpickedFace) => unpickedFace !== face);
      });
      // link them to each other
      this._connectLinks(newLinks[0], newLinks[1]);
    });

    // iterate through all super faces with any links on them
    priorLOD.links.forEach((superLink) => {
      let superFace = superLink.location;
      // bridge between the faultlinks on this super face
      let linkFaceIndices = new Array<number>();
      // each index corresponds to a specific subface relative to points and edges as constructed
      // essentially the index tells us where on the super face each subface is located
      for (let index = 0; index < superFace.subFaces.length; ++index) {
        // add the index of subFace to linkFaceIndices of it has a link on it
        if (this.links.has(superFace.subFaces[index])) {
          linkFaceIndices.push(index);
        }
      }

      // if there are 2 or 3 subfaces with links on them, they must connect through the center
      if (linkFaceIndices.length == 2 || linkFaceIndices.length == 3) {
        // create center link
        let centerLink = new FaultLink(superFace.subFaces[3]); // 3 is the index of the center subFace
        this.links.set(superFace.subFaces[3], centerLink);
        // link each of the links on this superFace to the centerLink
        for (let index of linkFaceIndices) {
          this._connectLinks(this.links.get(superFace.subFaces[index]), centerLink);
        }
      }
      // if there is only one subface with links, it must already be connected off-face
      // and no new link creation is required
    });

    this._updateAllLinks();
  }

  // called if no priorLOD is passed to the constructor
  // code in this function will be called in the super.constructor prior to mesh generation
  private _generate(rng: any): void {
    // generate an icosahedron
    let ico = new Icosahedron(this.radius);
    this.points = ico.points;
    this.edges = ico.edges;
    this.faces = ico.faces;

    // initialize unpicked faces after generating mesh
    this.unpickedFaces = this.faces.slice();
    this.linkedEdges = new Array<Edge>();

    // add starting nodes until we've reached startingNodeDensity
    while (this.links.size < this.faces.length * this.startingNodeDensity) {
      // pick a random face
      let pick = Math.floor(rng() * this.unpickedFaces.length);

      // create a new FaultLink at that face
      this.links.set(this.unpickedFaces[pick], new FaultLink(this.unpickedFaces[pick]));
      // remove the selected face so we don't pick it again
      this.unpickedFaces.splice(pick, 1);
    }

    // iterate through initial nodes and ensure all adjacent faces have links
    this.links.forEach((link) => {
      // if initial node, then it will have no connections
      if (link.connections.size == 0) {
        // iterate through adjacent faces
        link.location.getAdjacentFaces().forEach((face) => {
          // find the face in unpickedFaces, if not found, unpickedIndex = -1
          let unpickedIndex = this.unpickedFaces.indexOf(face);
          if (unpickedIndex === -1) {
            // face has already been picked, so link its node to this node
            this._connectLinks(this.links.get(face), link);
          } else {
            // face hasn't been picked so create a link there and link to it
            let newLink = new FaultLink(this.unpickedFaces[unpickedIndex]);
            this.links.set(this.unpickedFaces[unpickedIndex], newLink);
            this._connectLinks(newLink, link);
            // and remove it from unpickedFaces
            this.unpickedFaces.splice(unpickedIndex, 1);
          }
        });
      }
    });

    // iterate through all links and ensure they all have at least 2 connections
    this._expandAllLinks(rng);
    this._updateAllLinks();

    // make sure we know each edge for what it is
    this.linkedEdges.forEach((edge)=>{
      edge.data.isFaultLink = true;
    });

    // assign regions
    type Color = { r: number, g: number, b: number, a: number };
    function newColor(): Color {
      let num = Math.round(0xffffff * rng());
      return {
        r: (num >> 16)/255,
        g: (num >> 8 & 255)/255,
        b: (num & 255)/255,
        a: 1
      };
    }
    function assignColorToPoint(point: Point, color: Color) {
      point.data.color = color;
      for (let edge of point.edges[0]) {
        // spread color across edges without faultLinks
        let otherPoint = edge.getOtherPoint(point);
        if (!edge.data.isFaultLink && !otherPoint.data.color)
          assignColorToPoint(otherPoint, point.data.color)
      };
    }
    // assign a color to each point
    this.points.forEach( (point)=>{
      // if this point has no color, pick one
      if (!point.data.color) 
        assignColorToPoint(point, newColor());
      // otherwise, colors will spread recursively
    });
  }

  protected _connectLinks(link0: FaultLink, link1: FaultLink): void {
    // connect the links
    link0.linkTo(link1);
    // find the edge between them
    let edgeBetween = link0.getEdgeAcrossConnectionTo(link1);
    // add the edge between them to linkedEdges
    if (edgeBetween) this.linkedEdges.push(edgeBetween);
    else console.log("Error, tried to connect two links that don't share an edge");
  }

  // after links and mesh have been created, update the draw data on the faces appropriately
  protected _updateAllLinks(): void {
    this.links.forEach((link) => link.updateDrawData());
  }

  // iterate through all links and ensure they all have at least 2 connections
  protected _expandAllLinks(rng: any): void {
    for (let link of this.links.values()) {
      if (link.connections.size < 2) {
        // get adjacent links to this link
        let possibleConnectionFaces = new Set<Face>(link.location.getAdjacentFaces());
        // remove the existing connection from possibleConnections
        let existingConnection: FaultLink = link.connections.values().next().value;
        possibleConnectionFaces.delete(existingConnection.location);
        // pick a random connection to link to
        let targetFace: Face = Array.from(possibleConnectionFaces)[Math.round(rng())];

        // find the face in unpickedFaces, if not found, unpickedIndex = -1
        let unpickedIndex: number = this.unpickedFaces.indexOf(targetFace);
        if (unpickedIndex === -1) {
          // face has already been picked, so link its link to this link
          this.links.forEach((otherLink) => {
            if (otherLink.location == targetFace) this._connectLinks(otherLink, link);
          });
        } else {
          // create a new FaultLink at targetFace
          let newLink = new FaultLink(targetFace);
          this.links.set(targetFace, newLink);
          this._connectLinks(newLink, link);
          // and remove it from unpickedFaces
          this.unpickedFaces.splice(unpickedIndex, 1);
        }
      }
    }
  }

  protected _subdivideEdge(edge: Edge): void {
    // add a new point for each edge at the midpoint
    let point0 = edge.getPoint(0);
    let point1 = edge.getPoint(1);
    let midpoint = new Point(
      edge.LOD+1,
      point0.x + (point1.x - point0.x) / 2,
      point0.y + (point1.y - point0.y) / 2,
      point0.z + (point1.z - point0.z) / 2
    );

    // shift the new point so it's radius from the origin
    let distToOrigin = Math.sqrt(
      midpoint.x * midpoint.x + midpoint.y * midpoint.y + midpoint.z * midpoint.z
    );
    let scaleFactor = this.radius / distToOrigin;
    midpoint.x *= scaleFactor;
    midpoint.y *= scaleFactor;
    midpoint.z *= scaleFactor;

    // add it to the master points array
    this.points.push(midpoint);

    // create new subdivided edges
    let subEdge0 = new Edge(edge.LOD+1, [point0, midpoint]);
    let subEdge1 = new Edge(edge.LOD+1, [point1, midpoint]);
    this.edges.push(subEdge0);
    this.edges.push(subEdge1);

    // add references to new submembers of this edge
    edge.midpoint = midpoint;
    edge.subEdges = [subEdge0, subEdge1];

    // we can spread color if the edge is not a faultlink
    if (!edge.data.isFaultLink) {
      // we can use either point since they must be the same
      midpoint.data.color = edge.getPoint(0).data.color;
    }
  }

  protected _subdivideFace(face: Face): void {
    let pointArray = face.getPointArray();
    // label edge references by connecting points
    let { edge01, edge12, edge20 } = face.getEdgesByPoints();

    // label midpoints
    let midpoint01 = edge01.midpoint;
    let midpoint12 = edge12.midpoint;
    let midpoint20 = edge20.midpoint;

    // create new faces
    let newFaces = [
      new Face(face.LOD+1, [pointArray[0], midpoint01, midpoint20]),
      new Face(face.LOD+1, [pointArray[1], midpoint12, midpoint01]),
      new Face(face.LOD+1, [pointArray[2], midpoint20, midpoint12]),
      new Face(face.LOD+1, [midpoint01, midpoint12, midpoint20]),
    ];
    this.faces.push(...newFaces);

    // add new faces to subFaces
    face.subFaces = newFaces;

    // create new inside edges
    let midEdges = [
      new Edge(face.LOD+1, [midpoint01, midpoint20]),
      new Edge(face.LOD+1, [midpoint12, midpoint01]),
      new Edge(face.LOD+1, [midpoint20, midpoint12]),
    ];
    this.edges.push(...midEdges);

    // link up faces and edges to allow further subdivision
    newFaces[0].linkToEdges(
      edge01.getSubEdgeAdjacentTo(pointArray[0]),
      edge20.getSubEdgeAdjacentTo(pointArray[0]),
      midEdges[0]
    );
    newFaces[1].linkToEdges(
      edge01.getSubEdgeAdjacentTo(pointArray[1]),
      edge12.getSubEdgeAdjacentTo(pointArray[1]),
      midEdges[1]
    );
    newFaces[2].linkToEdges(
      edge12.getSubEdgeAdjacentTo(pointArray[2]),
      edge20.getSubEdgeAdjacentTo(pointArray[2]),
      midEdges[2]
    );
    newFaces[3].linkToEdges(midEdges[0], midEdges[1], midEdges[2]);
  }
}

export { TectonicLOD };
