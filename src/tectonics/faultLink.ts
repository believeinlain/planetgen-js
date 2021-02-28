import { Edge, Face } from '../geometry/primitives';

// links between two other FaultLinks to form a faultline
class FaultLink {
  location: Face;
  connections: Set<FaultLink>;

  constructor(newLocation: Face) {
    this.location = newLocation;
    newLocation.data.faultLink = this;
    this.connections = new Set<FaultLink>();
  }

  // update the Draw Data on this.location
  updateDrawData(): void {
    // find the edge indices on locations of this link's connections
    let topUV: { u: number; v: number };
    let leftUV: { u: number; v: number };
    let rightUV: { u: number; v: number };

    // set uvs based on number and orientation of connections
    switch (this.connections.size) {
      case 3: // use the 'node' uvs
        topUV = { u: 0.25, v: 1 };
        leftUV = { u: 0, v: 0.5 };
        rightUV = { u: 0.5, v: 0.5 };
        this.location.setDebugUVs([topUV.u, topUV.v, leftUV.u, leftUV.v, rightUV.u, rightUV.v]);
        break;
      case 2: // use the 'link' uvs
        topUV = { u: 0.25, v: 0.5 };
        leftUV = { u: 0, v: 0 };
        rightUV = { u: 0.5, v: 0 };
        // find which point index is shared between the edges crossed by the two connections
        let edges = Array.from([...this.connections], (link) => {
          return this.getEdgeAcrossConnectionTo(link);
        });
        let sharedPointIndex: number;
        if (edges.length == 2) {
          sharedPointIndex = this.location
            .getPointArray()
            .indexOf(edges[0].getSharedPoint(edges[1]));
        } else {
          // this should not happen
          console.log('Error: Some connection must not have an edge, unable to set debug UV');
          return;
        }

        // this really should never happen
        if (sharedPointIndex == undefined) {
          console.log(
            "Error: point shared by connections does not exist or is not on the FaultLink's face ..."
          );
          console.log('... unable to set debug UVs');
        }

        // rotate the UVs so that topUV is at the sharedPointIndex
        let swapUV: { u: number; v: number };
        switch (sharedPointIndex) {
          case 0: // no need to rotate
            break;
          case 1: // rotate so that topUV is at leftUV
            swapUV = leftUV;
            leftUV = topUV;
            topUV = rightUV;
            rightUV = swapUV;
            break;
          case 2: // rotate so that topUV is at rightUV
            swapUV = rightUV;
            rightUV = topUV;
            topUV = leftUV;
            leftUV = swapUV;
            break;
          default:
            // this should also never happen
            console.log('Somehow the sharedPointIndex is > 2. what.');
        }

        // set uvs to the proper rotated uvs
        this.location.setDebugUVs([topUV.u, topUV.v, leftUV.u, leftUV.v, rightUV.u, rightUV.v]);
        break;
      default:
        // this should never happen
        console.log(
          'Error: FaultLink detected with ' +
            this.connections.size +
            ' connections. Should be 3 or 2.'
        );
    }
  }

  // connect this link to another link
  linkTo(link: FaultLink): void {
    this.connections.add(link);
    link.connections.add(this);
  }

  // get the edge between FaultLinks
  getEdgeAcrossConnectionTo(other: FaultLink): Edge {
    for (let edge of this.location.getEdgeArray()) {
      if (edge.getFaceAdjacentTo(this.location) == other.location) {
        return edge;
      }
    }
    return null;
  }
}

export { FaultLink };
