import { Planet } from './planet';

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

const maxLOD = 5;
const startSeed = Math.round(Math.random() * 1000000);

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

  constructor() {
    // find the canvas html element and attach it to the webpage
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    // initialize babylon scene and engine
    this._engine = new BABYLON.Engine(canvas, true);

    // The canvas/window resize event handler.
    window.addEventListener('resize', () => {
      this._engine.resize();
    });

    // resize when intially loaded
    window.addEventListener('load', () => {
      this._engine.resize();
    });

    // Create the scene.
    this.createScene();

    // Start render loop.
    this.doRender();
  }

  createScene(): void {
    // Create a basic BJS Scene object.
    this._scene = new BABYLON.Scene(this._engine);

    // Create a camera, and set its position
    this._camera = new BABYLON.ArcRotateCamera(
      'camera',
      0,
      0,
      10,
      new BABYLON.Vector3(0, 0, 0),
      this._scene
    );

    // Target the camera to scene origin.
    this._camera.setTarget(BABYLON.Vector3.Zero());

    // Attach the camera to the canvas.
    this._camera.attachControl(this._canvas, false);

    // Create a basic light, aiming 0,1,0 - meaning, to the sky.
    this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);

    // create the GUI
    this._gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, this._scene);

    var panel = new GUI.StackPanel();
    panel.width = '220px';
    panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this._gui.addControl(panel);

    // create LOD control
    let headerLOD = new GUI.TextBlock();
    headerLOD.text = `LOD Level: ${maxLOD}`;
    headerLOD.height = '30px';
    headerLOD.color = 'black';
    panel.addControl(headerLOD);
    let slider = new GUI.Slider();
    slider.minimum = 0;
    slider.maximum = maxLOD;
    slider.value = maxLOD;
    slider.step = 1;
    slider.height = '20px';
    slider.width = '200px';
    slider.onValueChangedObservable.add((value) => {
      headerLOD.text = `LOD Level: ${value}`;
      this.updatePlanetLOD(value);
    });
    panel.addControl(slider);

    // create Seed control
    let header = new GUI.TextBlock();
    header.text = 'Seed';
    header.height = '30px';
    header.color = 'black';
    panel.addControl(header);
    let input = new GUI.InputText();
    input.height = '20px';
    input.width = '200px';
    input.text = startSeed.toString();
    input.color = 'white';
    input.onFocusSelectAll = false;
    input.autoStretchWidth = false;
    input.onTextChangedObservable.add(() => {
      this._planet.changeSeed(Number(input.text), slider.value);
      this.updatePlanetLOD(slider.value);
    });
    panel.addControl(input);

    // make a planet
    this._planet = new Planet(2, startSeed, 0.3);
    this._icoMesh = new BABYLON.Mesh('planet', this._scene);

    // use debug texture for this thing
    this._icoMaterial = new BABYLON.StandardMaterial('mat', this._scene);
    this._icoMaterial.diffuseTexture = new BABYLON.Texture(
      '/res/tex/PlanetgenDebug_color.png',
      this._scene
    );
    this._icoMesh.material = this._icoMaterial;
    this._icoMesh.useVertexColors = true;
    this._icoMesh.hasVertexAlpha = true;

    // initialize _icoMesh
    this.updatePlanetLOD(maxLOD);
  }

  doRender(): void {
    // Run the render loop.
    this._engine.runRenderLoop(() => {
      this._scene.render();
    });
  }

  // redraw _icosphere at the specified LOD
  updatePlanetLOD(newLOD: number): void {
    // update the mesh
    let result = this._planet.getUpdatedLODMesh(newLOD);
    let vertexData = new BABYLON.VertexData();

    vertexData.positions = result.positions;
    vertexData.indices = result.indices;
    vertexData.uvs = result.uvs;
    vertexData.colors = result.colors;

    vertexData.applyToMesh(this._icoMesh);
  }
}

new Game();
