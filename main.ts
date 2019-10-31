///<reference path="babylon.d.ts" />
///<reference path="geometry/icosahedron.ts" />

class Game {
	private _canvas: HTMLCanvasElement;
	private _engine: BABYLON.Engine;
	private _scene: BABYLON.Scene;
	private _camera: BABYLON.ArcRotateCamera;
	private _light: BABYLON.Light;

	constructor(canvasElement : string) {
		// Create canvas and engine.
		this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
		this._engine = new BABYLON.Engine(this._canvas, true);
	}

	createScene() : void {
		// Create a basic BJS Scene object.
		this._scene = new BABYLON.Scene(this._engine);

		// Create a camera, and set its position
		this._camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), this._scene);

		// Target the camera to scene origin.
		this._camera.setTarget(BABYLON.Vector3.Zero());

		// Attach the camera to the canvas.
		this._camera.attachControl(this._canvas, false);

		// Create a basic light, aiming 0,1,0 - meaning, to the sky.
		this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this._scene);
		/*
		// Create a built-in "sphere" shape; with 16 segments and diameter of 2.
		let sphere = BABYLON.MeshBuilder.CreateSphere('sphere1',
			{segments: 16, diameter: 3}, this._scene);

		// Move the sphere upward 1/2 of its height.
		sphere.position.y = 1;
		*/
		// make an icosahedron for testing
		let ico = new Icosahedron({x:0, y:0, z:0}, 1);

		let customMesh = new BABYLON.Mesh('ico', this._scene);
		let vertexData = new BABYLON.VertexData();
		let normals = [];

		vertexData.positions = ico.getVertices();
		vertexData.indices = ico.getFaces();

		//BABYLON.VertexData.ComputeNormals(vertexData.positions, vertexData.indices, normals);

		//vertexData.normals = normals;

		vertexData.applyToMesh(customMesh);
	}

	doRender() : void {
		// Run the render loop.
		this._engine.runRenderLoop(() => {
			this._scene.render();
		});

		// The canvas/window resize event handler.
		window.addEventListener('resize', () => {
			this._engine.resize();
		});
	}
}

window.addEventListener('DOMContentLoaded', () => {
	// Create the game using the 'renderCanvas'.
	let game = new Game('renderCanvas');

	// Create the scene.
	game.createScene();

	// Start render loop.
	game.doRender();
});
