
import { Point, Face, Edge } from './primitives';

// static class to generate an icosahedron
class Icosahedron {
  static generatePrimitives(radius: number, points: Point[], edges: Edge[], faces: Face[]): void {
    // ensure given arrays can hold the required values
    if (points.length<12) points.length = 12;
    if (edges.length<30) edges.length = 30;
    if (faces.length<20) faces.length = 20;

    // top point
    points[0] = new Point(0, 0, radius);
    // bottom point
    points[11] = new Point(0, 0, -radius);

    let latitudeAngle = Math.atan(0.5);
    let longitudeAngle = 0.628319; //36 degrees

    // top ring is the opposite side of a triangle with hypotenuse radius and angle latitudeAngle
    let topRingHeight = radius*Math.sin(latitudeAngle);
    let topRingRadius = radius*Math.cos(latitudeAngle);

    let i: number;

    //top ring [1 - 5]
    for(i=0; i<5; i++) {
      // add points 1 through 5
      points[1+i] = new Point(
	topRingRadius*Math.cos(longitudeAngle*i*2), 
	topRingRadius*Math.sin(longitudeAngle*i*2), 
	topRingHeight);
    }

    //bottom ring [6 - 10]
    for(i=0; i<5; i++) {
      // add points 6 through 10
      points[6+i] = new Point(
	topRingRadius*Math.cos(longitudeAngle*(i*2-1)), 
	topRingRadius*Math.sin(longitudeAngle*(i*2-1)),
	-topRingHeight);
    }

    // NOTE: is a lot of repeated code, but trust me it's way more confusing
    // to do with for loops, since with the code laid out like you can quickly
    // lookup which edges connect which vertices and which edges are adjacent to which faces

    // add top edges connecting to top vertex
    edges[0] = Edge.createEdge([0, 1], points);
    edges[1] = Edge.createEdge([0, 2], points);
    edges[2] = Edge.createEdge([0, 3], points);
    edges[3] = Edge.createEdge([0, 4], points);
    edges[4] = Edge.createEdge([0, 5], points);

    // add top ring of edges
    edges[5] = Edge.createEdge([1, 2], points);
    edges[6] = Edge.createEdge([2, 3], points);
    edges[7] = Edge.createEdge([3, 4], points);
    edges[8] = Edge.createEdge([4, 5], points);
    edges[9] = Edge.createEdge([5, 1], points);

    // add middle zigzag edges
    edges[10] = Edge.createEdge([6, 1], points);
    edges[11] = Edge.createEdge([1, 7], points);
    edges[12] = Edge.createEdge([7, 2], points);
    edges[13] = Edge.createEdge([2, 8], points);
    edges[14] = Edge.createEdge([8, 3], points);
    edges[15] = Edge.createEdge([3, 9], points);
    edges[16] = Edge.createEdge([9, 4], points);
    edges[17] = Edge.createEdge([4, 10], points);
    edges[18] = Edge.createEdge([10, 5], points);
    edges[19] = Edge.createEdge([5, 6], points);

    // add bottom ring of edges
    edges[20] = Edge.createEdge([6, 7], points);
    edges[21] = Edge.createEdge([7, 8], points);
    edges[22] = Edge.createEdge([8, 9], points);
    edges[23] = Edge.createEdge([9, 10], points);
    edges[24] = Edge.createEdge([10, 6], points);

    // add bottom edges connecting to bottom vertex
    edges[25] = Edge.createEdge([11, 6], points);
    edges[26] = Edge.createEdge([11, 7], points);
    edges[27] = Edge.createEdge([11, 8], points);
    edges[28] = Edge.createEdge([11, 9], points);
    edges[29] = Edge.createEdge([11, 10], points);

    // top faces
    faces[0] = Face.createFace([2, 1, 0], points);
    faces[1] = Face.createFace([3, 2, 0], points);
    faces[2] = Face.createFace([4, 3, 0], points);
    faces[3] = Face.createFace([5, 4, 0], points);
    faces[4] = Face.createFace([1, 5, 0], points);
    Face.linkFaceToEdges(0, 0, 1, 5, edges, faces);
    Face.linkFaceToEdges(1, 1, 2, 6, edges, faces);
    Face.linkFaceToEdges(2, 2, 3, 7, edges, faces);
    Face.linkFaceToEdges(3, 3, 4, 8, edges, faces);
    Face.linkFaceToEdges(4, 4, 0, 9, edges, faces);

    // ring faces
    faces[5] = Face.createFace([7, 6, 1], points);
    faces[6] = Face.createFace([7, 1, 2], points);
    faces[7] = Face.createFace([8, 7, 2], points);
    faces[8] = Face.createFace([8, 2, 3], points);
    faces[9] = Face.createFace([9, 8, 3], points);
    faces[10] = Face.createFace([9, 3, 4], points);
    faces[11] = Face.createFace([10, 9, 4], points);
    faces[12] = Face.createFace([10, 4, 5], points);
    faces[13] = Face.createFace([6, 10, 5], points);
    faces[14] = Face.createFace([6, 5, 1], points);
    Face.linkFaceToEdges(5, 20, 10, 11, edges, faces);
    Face.linkFaceToEdges(6, 5, 11, 12, edges, faces);
    Face.linkFaceToEdges(7, 21, 12, 13, edges, faces);
    Face.linkFaceToEdges(8, 6, 13, 14, edges, faces);
    Face.linkFaceToEdges(9, 22, 14, 15, edges, faces);
    Face.linkFaceToEdges(10, 7, 15, 16, edges, faces);
    Face.linkFaceToEdges(11, 23, 16, 17, edges, faces);
    Face.linkFaceToEdges(12, 8, 17, 18, edges, faces);
    Face.linkFaceToEdges(13, 24, 18, 19, edges, faces);
    Face.linkFaceToEdges(14, 9, 19, 10, edges, faces);

    // bottom faces
    faces[15] = Face.createFace([6, 7, 11], points);
    faces[16] = Face.createFace([7, 8, 11], points);
    faces[17] = Face.createFace([8, 9, 11], points);
    faces[18] = Face.createFace([9, 10, 11], points);
    faces[19] = Face.createFace([10, 6, 11], points);
    Face.linkFaceToEdges(15, 25, 26, 20, edges, faces);
    Face.linkFaceToEdges(16, 26, 27, 21, edges, faces);
    Face.linkFaceToEdges(17, 27, 28, 22, edges, faces);
    Face.linkFaceToEdges(18, 28, 29, 23, edges, faces);
    Face.linkFaceToEdges(19, 29, 25, 24, edges, faces);
  }
};

export { Icosahedron };
