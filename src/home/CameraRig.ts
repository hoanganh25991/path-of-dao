import { PerspectiveCamera, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const MIN_DISTANCE = 2.5;
const MAX_DISTANCE = 6.0;
const MIN_POLAR = Math.PI / 4;
const MAX_POLAR = Math.PI / 2.1;
const ROTATE_SPEED = 0.5;
const TARGET_Y = 0.9;

export class CameraRig {
  readonly controls: OrbitControls;

  constructor(camera: PerspectiveCamera, domElement: HTMLElement) {
    this.controls = new OrbitControls(camera, domElement);
    this.controls.target.set(0, TARGET_Y, 0);
    this.controls.minDistance = MIN_DISTANCE;
    this.controls.maxDistance = MAX_DISTANCE;
    this.controls.minPolarAngle = MIN_POLAR;
    this.controls.maxPolarAngle = MAX_POLAR;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = ROTATE_SPEED;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.update();
  }

  reset(): void {
    this.controls.target.set(0, TARGET_Y, 0);
    this.controls.object.position.set(0, 1.8, 4.2);
    this.controls.update();
  }

  update(): void {
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }
}

export function createHomeCamera(width: number, height: number): PerspectiveCamera {
  const camera = new PerspectiveCamera(50, width / height, 0.1, 120);
  camera.position.set(0, 1.8, 4.2);
  camera.lookAt(0, TARGET_Y, 0);
  return camera;
}

export function resizeCamera(
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  width: number,
  height: number,
): void {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
