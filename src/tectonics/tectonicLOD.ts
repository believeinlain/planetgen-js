
import { Point, Edge, Face } from '../geometry/primitives';
import { FaultLink } from '../tectonics/faultLink';
import { SphereLOD } from '../geometry/sphereLOD';

// allow for seeded rng
var seedrandom = require('seedrandom');

class TectonicLOD extends SphereLOD {
  startingNodeDensity: number; // ratio of faces that should be nodes
  links: Map<Face, FaultLink>; // use faces as index since FaultLinks have a reference to Face already
  rng; // seeded random number generator
  unpickedFaces: Face[]; // all faces that don't have FaultLinks on them
  linkedEdges: Edge[]; // all between two FaultLinks

  constructor (pointsRef: Point[], options: any, priorLOD?: TectonicLOD) {
    super(pointsRef, options, priorLOD);
    // nothing goes here, we just override protected methods of sphereLOD instead
  }

  protected _initialize(pointsRef: Point[], options: any): void {
    super._initialize(pointsRef, options);
    this.rng = seedrandom(options.seed);
    this.links = new Map<Face, FaultLink>();
    this.startingNodeDensity = options.nodeDensity;
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
      targetEdge.getFaceArray().forEach( (face) => {
	// if link already exists, just link to it rather than creating a new one
	let existingLink = this.links.get(face);
	let newLink = existingLink ? existingLink : new FaultLink(face);
	newLinks.push(newLink);
	// add it to the links map if it we created a new link
	if (existingLink == undefined) this.links.set(face, newLink);
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
      }
      // if there is only one subface with links, it must already be connected off-face
      // and no new link creation is required
    });

    this._updateAllLinks();
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

    this._updateAllLinks();
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
    this.links.forEach(link => link.updateDrawType());
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
