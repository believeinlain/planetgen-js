
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
    edges[0] = new Edge(points, [0, 1]);
    edges[1] = new Edge(points, [0, 2]);
    edges[2] = new Edge(points, [0, 3]);
    edges[3] = new Edge(points, [0, 4]);
    edges[4] = new Edge(points, [0, 5]);

    // add top ring of edges
    edges[5] = new Edge(points, [1, 2]);
    edges[6] = new Edge(points, [2, 3]);
    edges[7] = new Edge(points, [3, 4]);
    edges[8] = new Edge(points, [4, 5]);
    edges[9] = new Edge(points, [5, 1]);

    // add middle zigzag edges
    edges[10] = new Edge(points, [6, 1]);
    edges[11] = new Edge(points, [1, 7]);
    edges[12] = new Edge(points, [7, 2]);
    edges[13] = new Edge(points, [2, 8]);
    edges[14] = new Edge(points, [8, 3]);
    edges[15] = new Edge(points, [3, 9]);
    edges[16] = new Edge(points, [9, 4]);
    edges[17] = new Edge(points, [4, 10]);
    edges[18] = new Edge(points, [10, 5]);
    edges[19] = new Edge(points, [5, 6]);

    // add bottom ring of edges
    edges[20] = new Edge(points, [6, 7]);
    edges[21] = new Edge(points, [7, 8]);
    edges[22] = new Edge(points, [8, 9]);
    edges[23] = new Edge(points, [9, 10]);
    edges[24] = new Edge(points, [10, 6]);

    // add bottom edges connecting to bottom vertex
    edges[25] = new Edge(points, [11, 6]);
    edges[26] = new Edge(points, [11, 7]);
    edges[27] = new Edge(points, [11, 8]);
    edges[28] = new Edge(points, [11, 9]);
    edges[29] = new Edge(points, [11, 10]);

    // top faces
    faces[0] = new Face(points, [2, 1, 0]);
    faces[1] = new Face(points, [3, 2, 0]);
    faces[2] = new Face(points, [4, 3, 0]);
    faces[3] = new Face(points, [5, 4, 0]);
    faces[4] = new Face(points, [1, 5, 0]);
    Face.linkFaceToEdges(0, 0, 1, 5, edges, faces);
    Face.linkFaceToEdges(1, 1, 2, 6, edges, faces);
    Face.linkFaceToEdges(2, 2, 3, 7, edges, faces);
    Face.linkFaceToEdges(3, 3, 4, 8, edges, faces);
    Face.linkFaceToEdges(4, 4, 0, 9, edges, faces);

    // ring faces
    faces[5] = new Face(points, [7, 6, 1]);
    faces[6] = new Face(points, [7, 1, 2]);
    faces[7] = new Face(points, [8, 7, 2]);
    faces[8] = new Face(points, [8, 2, 3]);
    faces[9] = new Face(points, [9, 8, 3]);
    faces[10] = new Face(points, [9, 3, 4]);
    faces[11] = new Face(points, [10, 9, 4]);
    faces[12] = new Face(points, [10, 4, 5]);
    faces[13] = new Face(points, [6, 10, 5]);
    faces[14] = new Face(points, [6, 5, 1]);
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
    faces[15] = new Face(points, [6, 7, 11]);
    faces[16] = new Face(points, [7, 8, 11]);
    faces[17] = new Face(points, [8, 9, 11]);
    faces[18] = new Face(points, [9, 10, 11]);
    faces[19] = new Face(points, [10, 6, 11]);
    Face.linkFaceToEdges(15, 25, 26, 20, edges, faces);
    Face.linkFaceToEdges(16, 26, 27, 21, edges, faces);
    Face.linkFaceToEdges(17, 27, 28, 22, edges, faces);
    Face.linkFaceToEdges(18, 28, 29, 23, edges, faces);
    Face.linkFaceToEdges(19, 29, 25, 24, edges, faces);
  }
};

export { Icosahedron };
