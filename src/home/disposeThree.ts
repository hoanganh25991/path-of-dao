import {
  Material,
  Mesh,
  Object3D,
  Points,
  Scene,
  Texture,
  WebGLRenderer,
} from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function disposeMaterial(material: Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof Texture) {
      value.dispose();
    }
  }
  material.dispose();
}

function disposeObject(object: Object3D): void {
  object.traverse((node) => {
    if (node instanceof Mesh || node instanceof Points) {
      node.geometry.dispose();
      const { material } = node;
      if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
      } else {
        disposeMaterial(material);
      }
    }
  });
}

export function disposeSceneGraph(scene: Scene): void {
  disposeObject(scene);
  scene.clear();
}

export function disposeRenderer(renderer: WebGLRenderer): void {
  renderer.dispose();
  renderer.renderLists.dispose();
}

export function disposeControls(controls: OrbitControls): void {
  controls.dispose();
}
