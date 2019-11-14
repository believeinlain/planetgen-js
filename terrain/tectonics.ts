
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
  startingNodeDensity = 0.3; // 

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
      /*
    // create links surrounding each starting node
    for (let node of this.links) {
      // get adjacent faces to this node
      let adjacentFaces = node.location.getAdjacentFaces();
      for (let face of adjacentFaces) {
	// find the face in unpickedFaces, if not found, unpickedIndex = -1
	let unpickedIndex = unpickedFaces.indexOf(face);
	if (unpickedIndex === -1) {
	  // face has already been picked, so link its node to this node
	  this.links.forEach( (link) => {
	    // link this node to the node at face
	    if (link.location == face) link.linkTo(node);
	  });
	} else {
	  // face hasn't been picked so create a link there
	  this.links.push(new FaultNode(unpickedFaces[unpickedIndex]));
	  // and remove it from unpickedFaces
	  unpickedFaces.splice(unpickedIndex, 1);
	}
      }
    }
       */
  }
};

export { Tectonics };
