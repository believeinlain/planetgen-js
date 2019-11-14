
import { Icosphere } from './geometry/icosphere';
import { Tectonics } from './terrain/tectonics';

import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

class Game {
  private _canvas: HTMLCanvasElement;
  private _engine: BABYLON.Engine;
  private _scene: BABYLON.Scene;
  private _camera: BABYLON.ArcRotateCamera;
  private _light: BABYLON.Light;
  private _gui: GUI.AdvancedDynamicTexture;

  private _icosphere: Icosphere;
  private _icoMesh: BABYLON.Mesh;
  private _icoMaterial: BABYLON.StandardMaterial;

  constructor(canvasElement: string) {
    // Create canvas and engine.
    this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this._engine = new BABYLON.Engine(this._canvas, true);
  }

  createScene(): void {
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

    // create the GUI
    this._gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    var panel = new GUI.StackPanel();
    panel.width = "220px";
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this._gui.addControl(panel);

    var header = new GUI.TextBlock();
    header.text = "LOD Level: 0";
    header.height = "30px";
    header.color = "black";
    panel.addControl(header); 

    var slider = new GUI.Slider();
    slider.minimum = 0;
    slider.maximum = 6;
    slider.value = 0;
    slider.step = 1;
    slider.height = "20px";
    slider.width = "200px";
    slider.onValueChangedObservable.add( (value) => {
      header.text = "LOD Level: " + value;
      this.updateIcosphere(value); 
    });
    panel.addControl(slider); 

    // make an icosphere as our 'planet'
    this._icosphere = new Icosphere(2, 1);
    this._icoMesh = new BABYLON.Mesh('ico', this._scene);

    // use debug texture for this thing
    this._icoMaterial = new BABYLON.StandardMaterial("mat", this._scene);
    this._icoMaterial.diffuseTexture = new BABYLON.Texture("../planetgen/PlanetgenDebug_color.png", this._scene);
    this._icoMesh.material = this._icoMaterial;

    // test the tectonics class
    // generate plate tectonics at LOD[0]
    //let tec = new Tectonics(12345, this._icosphere.LOD[0].faces);

    // update after we generate tectonics so we can use debug UVs
    this.updateIcosphere(0); 
  }

  doRender(): void {
    // Run the render loop.
    this._engine.runRenderLoop(() => {
      this._scene.render();
    });

    // The canvas/window resize event handler.
    window.addEventListener('resize', () => {
      this._engine.resize();
    });
  }

  // redraw _icosphere at the specified LOD
  updateIcosphere(newLOD: number): void {
    // update the mesh once the promise fulfills
    this._icosphere.getUpdatedLODMeshAsync(newLOD).then( (result) => {
      let vertexData = new BABYLON.VertexData();

      vertexData.positions = result.vertices;
      console.log(vertexData.positions);
      vertexData.indices = result.faces;
      console.log(vertexData.indices);
      vertexData.uvs = result.UVs;
      console.log(vertexData.uvs);

      vertexData.applyToMesh(this._icoMesh);
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
