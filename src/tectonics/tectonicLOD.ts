
import { Point, Edge, Face, DrawType } from '../geometry/primitives';
import { SphereLOD } from '../geometry/sphereLOD';

// allow for seeded rng
var seedrandom = require('seedrandom');

// links between two other FaultLinks to form a faultline
class FaultLink {
  location: Face;
  connections: Set<FaultLink>;

  constructor (newLocation: Face) {
    this.location = newLocation;
    this.connections = new Set<FaultLink>();
  }

  // update the DrawType on this.location
  updateDrawType(): void {
    // set drawtype based on number of connections
    switch(this.connections.size) {
      case 3:
	this.location.drawType = DrawType.DebugNode;
	break;
      case 2:
	this.location.drawType = DrawType.DebugLink;
	break;
      default:
	//console.log("Error: FaultLink detected with "+this.connections.size+" connections. Should be 3 or 2.");
	this.location.drawType = DrawType.DebugLink; // temporarily bypassed for testing
	//this.location.drawType = DrawType.DebugNormal;
    }
  }

  // connect this link to another link
  linkTo(link: FaultLink): void {
    this.connections.add(link);
    link.connections.add(this);
  }
};

class TectonicLOD extends SphereLOD {
  startingNodeDensity: number; // ratio of faces that should be nodes
  links: Map<Face, FaultLink>; // use faces as index since FaultLinks have a reference to Face already
  rng; // seeded random number generator
  unpickedFaces: Face[]; // all faces that don't have FaultLinks on them
  linkedEdges: Edge[]; // aa edges between two FaultLinks

  constructor (newRadius: number, pointsRef: Point[], priorLOD?: TectonicLOD) {
    super(newRadius, pointsRef, priorLOD);
    // nothing goes here, we just override protected methods of sphereLOD instead
  }

  protected _initialize(newRadius: number, pointsRef: Point[]): void {
    super._initialize(newRadius, pointsRef);
    this.rng = seedrandom(315);
    this.links = new Map<Face, FaultLink>();
    this.startingNodeDensity = 0.15;
  }

  // called if priorLOD is passed to the constructor
  // code in this function will be called in the super.constructor prior to mesh generation
  protected _subdivide(priorLOD: TectonicLOD): void {
    // subdivide mesh
    super._subdivide(priorLOD);

    // initialize unpicked faces after subdividing mesh
    this.unpickedFaces = this.faces.slice();
    this.linkedEdges = new Array<Edge>();

    // iterate though all super edges that connect two links
    priorLOD.linkedEdges.forEach( (edge) => {
      // pick a random edge for the fault to pass through
      let targetEdge = edge.subEdges[Math.round(this.rng())];

      // create new FaultLinks at that edge
      let newLinks = new Array<FaultLink>();
      targetEdge.faces.forEach( (face) => {
	let newLink = new FaultLink(face);
	newLinks.push(newLink);
	this.links.set(face, newLink);
	// remove the face from unpicked faces
	this.unpickedFaces.filter(unpickedFace => unpickedFace !== face);
      });
      // link them to each other
      this._connectLinks(newLinks[0], newLinks[1]);
    });

    // iterate through all super faces with any links on them
    priorLOD.links.forEach( (superLink) => {
      let superFace = superLink.location;
      // bridge between the faultlinks on this super face
      let linkFaceIndices = new Array<number>();
      // each index corresponds to a specific subface relative to points and edges as constructed
      // essentially the index tells us where on the super face each subface is located
      for (let index=0; index<superFace.subFaces.length; ++index) {
	// add the index of subFace to linkFaceIndices of it has a link on it
	if (this.links.has(superFace.subFaces[index])) {
	  linkFaceIndices.push(index);
	}
      }

      // if there are 2 or 3 subfaces with links on them, they must connect through the center
      if ((linkFaceIndices.length == 2) || (linkFaceIndices.length == 3)) {
	// create center link
	let centerLink = new FaultLink(superFace.subFaces[3]); // 3 is the index of the center subFace
	this.links.set(superFace.subFaces[3], centerLink);
	// link each of the links on this superFace to the centerLink
	for (let index of linkFaceIndices) {
	  this._connectLinks(this.links.get(superFace.subFaces[index]), centerLink);
	}
      } else {
	console.log("Error, each face with a link should have 2 or 3 connections, this on seems to have "+linkFaceIndices.length);
      }
    });

    // update all links
    this.links.forEach(link => link.updateDrawType());
  }

  // called if no priorLOD is passed to the constructor
  // code in this function will be called in the super.constructor prior to mesh generation
  protected _generate(): void {
    // generate an icosahedron
    super._generate();

    // initialize unpicked faces after generating mesh
    this.unpickedFaces = this.faces.slice();
    this.linkedEdges = new Array<Edge>();

    // add starting nodes until we've reached startingNodeDensity
    while (this.links.size < (this.faces.length * this.startingNodeDensity)) {
      // pick a random face
      let pick = Math.floor(this.rng() * this.unpickedFaces.length);

      // create a new FaultLink at that face
      this.links.set(this.unpickedFaces[pick], new FaultLink(this.unpickedFaces[pick]));
      // remove the selected face so we don't pick it again
      this.unpickedFaces.splice(pick, 1);
    }

    // iterate through initial nodes and ensure all adjacent faces have links
    this.links.forEach( (link) => {
      // if initial node, then it will have no connections
      if (link.connections.size == 0) {
	// iterate through adjacent faces
	link.location.getAdjacentFaces().forEach( (face) => {
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
    this._expandAllLinks();

    // update all links
    this.links.forEach(link => link.updateDrawType());
  }

  protected _connectLinks(link0: FaultLink, link1: FaultLink): void {
    // connect the links
    link0.linkTo(link1);
    // add the edge between them to linkedEdges
    link0.location.edges.forEach( (edge) => {
      if (edge.getFaceAdjacentTo(link0.location) == link1.location) {
	this.linkedEdges.push(edge);
      }
    });
  }

  // iterate through all links and ensure they all have at least 2 connections
  protected _expandAllLinks(): void {
    for (let link of this.links.values()) {
      if (link.connections.size < 2) {
	// get adjacent links to this link
	let possibleConnectionFaces = new Set<Face>(link.location.getAdjacentFaces());
	// remove the existing connection from possibleConnections
	let existingConnection: FaultLink = link.connections.values().next().value;
	possibleConnectionFaces.delete(existingConnection.location);
	// pick a random connection to link to
	let targetFace: Face = Array.from(possibleConnectionFaces)[Math.round(this.rng())];

	// find the face in unpickedFaces, if not found, unpickedIndex = -1
	let unpickedIndex: number = this.unpickedFaces.indexOf(targetFace);
	if (unpickedIndex === -1) {
	  // face has already been picked, so link its link to this link
	  this.links.forEach( (otherLink) => { if (otherLink.location == targetFace) this._connectLinks(otherLink, link); });
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
};

export { TectonicLOD };
