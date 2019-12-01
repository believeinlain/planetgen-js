
import { Planet } from './planet';

import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

class Game {
  private _canvas: HTMLCanvasElement;
  private _engine: BABYLON.Engine;
  private _scene: BABYLON.Scene;
  private _camera: BABYLON.ArcRotateCamera;
  private _light: BABYLON.Light;
  private _gui: GUI.AdvancedDynamicTexture;

  private _planet: Planet;
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

    // create LOD control
    let headerLOD = new GUI.TextBlock();
    headerLOD.text = "LOD Level: 0";
    headerLOD.height = "30px";
    headerLOD.color = "black";
    panel.addControl(headerLOD);
    let slider = new GUI.Slider();
    slider.minimum = 0;
    slider.maximum = 6;
    slider.value = 0;
    slider.step = 1;
    slider.height = "20px";
    slider.width = "200px";
    slider.onValueChangedObservable.add( (value) => {
      headerLOD.text = "LOD Level: " + value;
      this.updatePlanetLOD(value);
    });
    panel.addControl(slider);

    // create Seed control
    let header = new GUI.TextBlock();
    header.text = "Seed";
    header.height = "30px";
    header.color = "black";
    panel.addControl(header);
    let input = new GUI.InputText();
    input.height = "20px";
    input.width = "200px";
    input.text = "1000";
    input.color = "white";
    input.onFocusSelectAll = false;
    input.autoStretchWidth = false;
    input.onTextChangedObservable.add( () => {
      this.updatePlanetSeed(Number(input.text));
    });
    panel.addControl(input);

    // make a planet
    this._planet = new Planet(2, 1000, 0.3);
    this._icoMesh = new BABYLON.Mesh('planet', this._scene);

    // use debug texture for this thing
    this._icoMaterial = new BABYLON.StandardMaterial("mat", this._scene);
    this._icoMaterial.diffuseTexture = new BABYLON.Texture("../planetgen/PlanetgenDebug_color.png", this._scene);
    this._icoMesh.material = this._icoMaterial;

    // initialize _icoMesh
    this.updatePlanetLOD(0);
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

  // regenerate planet with new seed
  updatePlanetSeed(newSeed: number): void {
    this._planet.changeSeed(newSeed);
    this.updatePlanetLOD(this._planet.getLODLevel());
  }

  // redraw _icosphere at the specified LOD
  updatePlanetLOD(newLOD: number): void {
    // update the mesh
    let result = this._planet.getUpdatedLODMesh(newLOD);
    let vertexData = new BABYLON.VertexData();

    vertexData.positions = result.vertices;
    vertexData.indices = result.indices;
    vertexData.uvs = result.uvs;

    vertexData.applyToMesh(this._icoMesh);
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
