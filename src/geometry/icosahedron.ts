import { Point, Face, Edge } from './primitives';

// class to generate an icosahedron
class Icosahedron {
  radius: number;
  points: Point[];
  edges: Edge[];
  faces: Face[];

  constructor(radius: number) {
    this.radius = radius;

    // ensure given arrays can hold the required values
    this.points = new Array<Point>(12);
    this.edges = new Array<Edge>(30);
    this.faces = new Array<Face>(20);

    // top point
    this.points[0] = new Point(0, 0, radius);
    // bottom point
    this.points[11] = new Point(0, 0, -radius);

    let latitudeAngle = Math.atan(0.5);
    let longitudeAngle = 0.628319; //36 degrees

    // top ring is the opposite side of a triangle with hypotenuse radius and angle latitudeAngle
    let topRingHeight = radius * Math.sin(latitudeAngle);
    let topRingRadius = radius * Math.cos(latitudeAngle);

    //top ring [1 - 5]
    for (let i = 0; i < 5; i++) {
      // add points 1 through 5
      this.points[1 + i] = new Point(
        topRingRadius * Math.cos(longitudeAngle * i * 2),
        topRingRadius * Math.sin(longitudeAngle * i * 2),
        topRingHeight
      );
    }
    //bottom ring [6 - 10]
    for (let i = 0; i < 5; i++) {
      // add points 6 through 10
      this.points[6 + i] = new Point(
        topRingRadius * Math.cos(longitudeAngle * (i * 2 - 1)),
        topRingRadius * Math.sin(longitudeAngle * (i * 2 - 1)),
        -topRingHeight
      );
    }

    // add top edges connecting to top vertex
    this.edges[0] = new Edge(this.points, [0, 1]);
    this.edges[1] = new Edge(this.points, [0, 2]);
    this.edges[2] = new Edge(this.points, [0, 3]);
    this.edges[3] = new Edge(this.points, [0, 4]);
    this.edges[4] = new Edge(this.points, [0, 5]);

    // add top ring of edges
    this.edges[5] = new Edge(this.points, [1, 2]);
    this.edges[6] = new Edge(this.points, [2, 3]);
    this.edges[7] = new Edge(this.points, [3, 4]);
    this.edges[8] = new Edge(this.points, [4, 5]);
    this.edges[9] = new Edge(this.points, [5, 1]);

    // add middle zigzag edges
    this.edges[10] = new Edge(this.points, [6, 1]);
    this.edges[11] = new Edge(this.points, [1, 7]);
    this.edges[12] = new Edge(this.points, [7, 2]);
    this.edges[13] = new Edge(this.points, [2, 8]);
    this.edges[14] = new Edge(this.points, [8, 3]);
    this.edges[15] = new Edge(this.points, [3, 9]);
    this.edges[16] = new Edge(this.points, [9, 4]);
    this.edges[17] = new Edge(this.points, [4, 10]);
    this.edges[18] = new Edge(this.points, [10, 5]);
    this.edges[19] = new Edge(this.points, [5, 6]);

    // add bottom ring of edges
    this.edges[20] = new Edge(this.points, [6, 7]);
    this.edges[21] = new Edge(this.points, [7, 8]);
    this.edges[22] = new Edge(this.points, [8, 9]);
    this.edges[23] = new Edge(this.points, [9, 10]);
    this.edges[24] = new Edge(this.points, [10, 6]);

    // add bottom edges connecting to bottom vertex
    this.edges[25] = new Edge(this.points, [11, 6]);
    this.edges[26] = new Edge(this.points, [11, 7]);
    this.edges[27] = new Edge(this.points, [11, 8]);
    this.edges[28] = new Edge(this.points, [11, 9]);
    this.edges[29] = new Edge(this.points, [11, 10]);

    // top faces
    this.faces[0] = new Face(this.points, [2, 1, 0]);
    this.faces[1] = new Face(this.points, [3, 2, 0]);
    this.faces[2] = new Face(this.points, [4, 3, 0]);
    this.faces[3] = new Face(this.points, [5, 4, 0]);
    this.faces[4] = new Face(this.points, [1, 5, 0]);
    Face.linkFaceToEdges(0, 0, 1, 5, this.edges, this.faces);
    Face.linkFaceToEdges(1, 1, 2, 6, this.edges, this.faces);
    Face.linkFaceToEdges(2, 2, 3, 7, this.edges, this.faces);
    Face.linkFaceToEdges(3, 3, 4, 8, this.edges, this.faces);
    Face.linkFaceToEdges(4, 4, 0, 9, this.edges, this.faces);

    // ring faces
    this.faces[5] = new Face(this.points, [7, 6, 1]);
    this.faces[6] = new Face(this.points, [7, 1, 2]);
    this.faces[7] = new Face(this.points, [8, 7, 2]);
    this.faces[8] = new Face(this.points, [8, 2, 3]);
    this.faces[9] = new Face(this.points, [9, 8, 3]);
    this.faces[10] = new Face(this.points, [9, 3, 4]);
    this.faces[11] = new Face(this.points, [10, 9, 4]);
    this.faces[12] = new Face(this.points, [10, 4, 5]);
    this.faces[13] = new Face(this.points, [6, 10, 5]);
    this.faces[14] = new Face(this.points, [6, 5, 1]);
    Face.linkFaceToEdges(5, 20, 10, 11, this.edges, this.faces);
    Face.linkFaceToEdges(6, 5, 11, 12, this.edges, this.faces);
    Face.linkFaceToEdges(7, 21, 12, 13, this.edges, this.faces);
    Face.linkFaceToEdges(8, 6, 13, 14, this.edges, this.faces);
    Face.linkFaceToEdges(9, 22, 14, 15, this.edges, this.faces);
    Face.linkFaceToEdges(10, 7, 15, 16, this.edges, this.faces);
    Face.linkFaceToEdges(11, 23, 16, 17, this.edges, this.faces);
    Face.linkFaceToEdges(12, 8, 17, 18, this.edges, this.faces);
    Face.linkFaceToEdges(13, 24, 18, 19, this.edges, this.faces);
    Face.linkFaceToEdges(14, 9, 19, 10, this.edges, this.faces);

    // bottom faces
    this.faces[15] = new Face(this.points, [6, 7, 11]);
    this.faces[16] = new Face(this.points, [7, 8, 11]);
    this.faces[17] = new Face(this.points, [8, 9, 11]);
    this.faces[18] = new Face(this.points, [9, 10, 11]);
    this.faces[19] = new Face(this.points, [10, 6, 11]);
    Face.linkFaceToEdges(15, 25, 26, 20, this.edges, this.faces);
    Face.linkFaceToEdges(16, 26, 27, 21, this.edges, this.faces);
    Face.linkFaceToEdges(17, 27, 28, 22, this.edges, this.faces);
    Face.linkFaceToEdges(18, 28, 29, 23, this.edges, this.faces);
    Face.linkFaceToEdges(19, 29, 25, 24, this.edges, this.faces);
  }
}

export { Icosahedron };
