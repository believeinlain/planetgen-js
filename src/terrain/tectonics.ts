
import { Face, DrawType } from '../geometry/primitives';

// allow for seeded rng
var seedrandom = require('seedrandom');

// links between two other FaultLinks to form a faultline
class FaultLink {
  location: Face;
  connections: FaultLink[];

  constructor (newLocation: Face) {
    this.location = newLocation;
    this.connections = new Array<FaultLink>();
    this.location.drawType = DrawType.DebugLink;
  }

  // connect this link to another link
  linkTo(link: FaultLink) {
    this.connections.push(link);
    link.connections.push(this);
  }
  // replace the connection to replace with replaceWith
  replaceLink(replace: FaultLink, replaceWith: FaultLink) {
    // remove replace from connections
    this.connections.filter( (connection) => {connection !== replace} );
    // add replaceWith to connections
    this.connections.push(replaceWith);
  }
};

// links between three FaultLinks to from an intersection between two faultlines
class FaultNode extends FaultLink {
  constructor (newLocation: Face) {
    super(newLocation);
    this.location.drawType = DrawType.DebugNode;
  }
};

// manages all the faultlines
class Tectonics {
  links: FaultLink[]; // use instanceof to check if a FaultLink is a FaultNode
  rng; // seeded random number generator
  startingNodeDensity = 0.2; //

  constructor(seed: number, faces: Face[]) {
    // initialize variables
    this.rng = seedrandom(seed);
    this.links = new Array<FaultLink>();

    // make local copy of faces to remove elements from so we don't pick the same face twice
    let unpickedFaces = faces.slice();

    // add starting nodes until we've reached startingNodeDensity
    while (this.links.length < faces.length * this.startingNodeDensity) {
      // pick a random face
      let pick = Math.floor(this.rng() * unpickedFaces.length);

      // create a new FaultNode at that face
      this.links.push(new FaultNode(unpickedFaces[pick]));
      // remove the selected face so we don't pick it again
      unpickedFaces.splice(pick, 1);
    }

    // iterate through all links
    for (let link of this.links) {
      // for nodes, ensure all adjacent faces have links
      if (link instanceof FaultNode) {
	// get adjacent faces to this node
	let adjacentFaces = link.location.getAdjacentFaces();
	for (let face of adjacentFaces) {
	  // find the face in unpickedFaces, if not found, unpickedIndex = -1
	  let unpickedIndex = unpickedFaces.indexOf(face);
	  if (unpickedIndex === -1) {
	    // face has already been picked, so link its node to this node
	    this.links.forEach( (otherLink) => {
	      // link this node to the node at face
	      if (otherLink.location == face) otherLink.linkTo(link);
	    });
	  } else {
	    // face hasn't been picked so create a link there and link to it
	    let newLink = new FaultLink(unpickedFaces[unpickedIndex]);
	    this.links.push(newLink);
	    newLink.linkTo(link);
	    // and remove it from unpickedFaces
	    unpickedFaces.splice(unpickedIndex, 1);
	  }
	}
      } else if (link instanceof FaultLink) {
	// for links, ensure they have two connections
	if (link.connections.length < 2) {
	  console.log(this.links);
	  // every link must have at least one connection, so we only need to add one
	  let adjacentFaces = link.location.getAdjacentFaces();

	  let possibleConnections = new Array<Face>();
	  // add adjacent faces to possible connections
	  adjacentFaces.forEach( (adjacentFace) => {
	    possibleConnections.push(adjacentFace);
	  });
	  // remove the existing connection from possibleConnections
	  possibleConnections.filter( (connection) => { connection !== link.connections[0].location });

	  // pick a random connection to link to
	  let targetFace = possibleConnections[Math.round(this.rng())];
	  
	  // find the face in unpickedFaces, if not found, unpickedIndex = -1
	  let unpickedIndex = unpickedFaces.indexOf(targetFace);
	  if (unpickedIndex === -1) {
	    // turn the link at targetFace to a node and link to it
	    this.links.forEach( (targetLink) => {
	      if (targetLink.location == targetFace) {
		let targetNode = this._upgradeFaultLinkToNode(targetLink);
		link.linkTo(targetNode);
	      }
	    });
	  } else {
	    // create a new FaultLink at targetFace
	    this.links.push(new FaultLink(unpickedFaces[unpickedIndex]));
	    // and remove it from unpickedFaces
	    unpickedFaces.splice(unpickedIndex, 1);
	  }
	}
      }
    }
  }

  private _upgradeFaultLinkToNode(link: FaultLink): FaultNode {
    // create a new FaultNode
    let newNode = new FaultNode(link.location);
    // replace all connections to link with newNode
    link.connections.forEach(eachConnection => eachConnection.replaceLink(link, newNode));
    // give our new node the connections of link
    newNode.connections = link.connections;
    // replace it in the links array
    let index = this.links.indexOf(link);
    this.links[index] = newNode;

    return newNode;
  }
};

export { Tectonics };
