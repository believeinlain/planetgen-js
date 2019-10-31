
type Point = { x: number, y: number, z: number };
type Face = number[];

class Icosahedron {
	points: Point[];
	faces: Face[];

	constructor (origin: Point, radius: number) {
		// initialize point array
		this.points = new Array(12);

		// top point
		this.points[0] = {x:origin.x, y:origin.y, z:origin.z+radius};
		// bottom point
		this.points[11] = {x:origin.x, y:origin.y, z:origin.z-radius};

		let latitudeAngle: number = Math.atan(0.5);
		let longitudeAngle: number = 0.628319; //36 degrees

		// top ring is the opposite side of a triangle with hypotenuse radius and angle latitudeAngle
		let topRingHeight: number = radius*Math.sin(latitudeAngle);
		let topRingRadius: number = radius*Math.cos(latitudeAngle);

		let i: number;

		//top ring
		for(i=0; i<5; i++) {
			let offset: Point = {
				x:topRingRadius*Math.cos(longitudeAngle*i*2), 
				y:topRingRadius*Math.sin(longitudeAngle*i*2), 
				z:topRingHeight};
			this.points[1+i] = {x:offset.x+origin.x, y:offset.y+origin.y, z:offset.z+origin.z};
		}
		//bottom ring
		for(i=0; i<5; i++) {
			let offset: Point = {
				x:topRingRadius*Math.cos(longitudeAngle*(i*2-1)), 
				y:topRingRadius*Math.sin(longitudeAngle*(i*2-1)), 
				z:-topRingHeight};
			this.points[6+i] = {x:offset.x+origin.x, y:offset.y+origin.y, z:offset.z+origin.z};
		}

		this.faces = new Array();
		
		// top faces
		for (let i=0; i<4; i++) {
			this.faces.push([i+2, i+1, 0]);
		}
		this.faces.push([1, 5, 0]);

		// ring faces
		for (let i=0; i<4; i++) {
			this.faces.push([i+7, i+6, i+1]);
			this.faces.push([i+7, i+1, i+2]);
		}
		this.faces.push([6, 10, 5]);
		this.faces.push([6, 5, 1]);

		// bottom faces
		for (let i=0; i<4; i++) {
			this.faces.push([i+6, i+7, 11]);
		}
		this.faces.push([10, 6, 11]);
	}

	// returns vertices in the same order as points[]
	getVertices() {
		let result: number[] = new Array(36);
		let pointIndex: number;

		// loop through each value in result
		for (let i=0; i<36; i++) {
			// get a new point every three values
			pointIndex = i/3;
			// add a value each for x, y, and z of the current point
			result[i] = this.points[pointIndex].x;
			i++;
			result[i] = this.points[pointIndex].y;
			i++;
			result[i] = this.points[pointIndex].z;
		}
		return result;
	}

	// returns faces as a list of vertex indices, where each three represents a clockwise face
	getFaces() {
		let result: number[] = new Array();
		
		for (let face of this.faces) {
			for (let i=0; i<3; i++) {
				result.push(face[i]);
			}
		}
		return result;
	}
}

