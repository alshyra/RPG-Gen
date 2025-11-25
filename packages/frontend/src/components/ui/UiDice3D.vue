<template>
  <div
    ref="containerRef"
    class="dice-container"
    :class="{ rolling: isRolling }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';

interface Props {
  value?: number;
  isRolling?: boolean;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  value: 1,
  isRolling: false,
  size: 120,
});

const emit = defineEmits<{
  (e: 'rollComplete'): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let dice: THREE.Mesh | null = null;
let animationId: number | null = null;

// D20 face order (opposite faces sum to 21)
const FACE_ORDER = [1, 20, 2, 19, 3, 18, 4, 17, 5, 16, 6, 15, 7, 14, 8, 13, 9, 12, 10, 11];

// Pre-computed face orientations for D20 (icosahedron)
const faceQuaternions: THREE.Quaternion[] = [];

const computeFaceNormal = (pos: THREE.BufferAttribute, idx: number): THREE.Vector3 => {
  const v0 = new THREE.Vector3().fromBufferAttribute(pos, idx);
  const v1 = new THREE.Vector3().fromBufferAttribute(pos, idx + 1);
  const v2 = new THREE.Vector3().fromBufferAttribute(pos, idx + 2);
  const edge1 = new THREE.Vector3().subVectors(v1, v0);
  const edge2 = new THREE.Vector3().subVectors(v2, v0);
  return new THREE.Vector3().crossVectors(edge1, edge2).normalize();
};

const computeFaceQuaternions = (geometry: THREE.IcosahedronGeometry) => {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const targetDir = new THREE.Vector3(0, 0, 1);
  const faceCount = position.count / 3;
  Array.from({ length: faceCount }).forEach((_, i) => {
    const normal = computeFaceNormal(position, i * 3);
    faceQuaternions.push(new THREE.Quaternion().setFromUnitVectors(normal, targetDir));
  });
};

const createCanvasContext = (): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  return { canvas, ctx: canvas.getContext('2d')! };
};

const createTriangleGradient = (ctx: CanvasRenderingContext2D): CanvasGradient => {
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, '#6b21a8');
  gradient.addColorStop(1, '#3b0764');
  return gradient;
};

const drawTrianglePath = (ctx: CanvasRenderingContext2D) => {
  ctx.beginPath();
  ctx.moveTo(64, 10);
  ctx.lineTo(118, 100);
  ctx.lineTo(10, 100);
  ctx.closePath();
};

const drawTriangleBackground = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = createTriangleGradient(ctx);
  drawTrianglePath(ctx);
  ctx.fill();
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  ctx.stroke();
};

const drawNumberOnCanvas = (ctx: CanvasRenderingContext2D, value: number) => {
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value.toString(), 64, 60);
};

const createD20Texture = (value: number): THREE.CanvasTexture => {
  const { canvas, ctx } = createCanvasContext();
  drawTriangleBackground(ctx);
  drawNumberOnCanvas(ctx, value);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const createD20Materials = (): THREE.Material[] =>
  FACE_ORDER.map(value => new THREE.MeshStandardMaterial({
    map: createD20Texture(value),
    roughness: 0.3,
    metalness: 0.2,
    side: THREE.DoubleSide,
  }));

const setupLighting = (targetScene: THREE.Scene) => {
  targetScene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(2, 2, 5);
  targetScene.add(directionalLight);
  const pointLight = new THREE.PointLight(0xa855f7, 0.5, 10);
  pointLight.position.set(-2, 2, 3);
  targetScene.add(pointLight);
};

const assignUVsToFaces = (geometry: THREE.IcosahedronGeometry) => {
  const uvAttribute = geometry.attributes.uv;
  const faceCount = geometry.attributes.position.count / 3;
  Array.from({ length: faceCount }).forEach((_, i) => {
    const idx = i * 3;
    uvAttribute.setXY(idx, 0.5, 0.1);
    uvAttribute.setXY(idx + 1, 0.9, 0.9);
    uvAttribute.setXY(idx + 2, 0.1, 0.9);
  });
  uvAttribute.needsUpdate = true;
};

const assignMaterialGroups = (geometry: THREE.IcosahedronGeometry) => {
  geometry.clearGroups();
  Array.from({ length: 20 }).forEach((_, i) => geometry.addGroup(i * 3, 3, i));
};

const createD20Mesh = (): THREE.Mesh => {
  const geometry = new THREE.IcosahedronGeometry(1.2, 0);
  computeFaceQuaternions(geometry);
  assignUVsToFaces(geometry);
  assignMaterialGroups(geometry);
  const diceMesh = new THREE.Mesh(geometry, createD20Materials());
  const edges = new THREE.EdgesGeometry(geometry);
  diceMesh.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xa855f7, linewidth: 2 })));
  return diceMesh;
};

const setupRenderer = () => {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(props.size, props.size);
  renderer.setPixelRatio(window.devicePixelRatio);
  containerRef.value!.appendChild(renderer.domElement);
};

const initScene = () => {
  if (!containerRef.value) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.z = 4;
  setupRenderer();
  setupLighting(scene);
  dice = createD20Mesh();
  scene.add(dice);
  setDiceToValue(props.value);
};

const setDiceToValue = (value: number) => {
  if (!dice || faceQuaternions.length === 0) return;
  const faceIndex = FACE_ORDER.indexOf(value);
  if (faceIndex >= 0 && faceIndex < faceQuaternions.length) {
    dice.quaternion.copy(faceQuaternions[faceIndex]);
  }
};

let rollStartTime = 0;
const rollDuration = 2000;
let targetValue = 1;

const updateRollingAnimation = (diceObj: THREE.Mesh, progress: number) => {
  const easeOut = 1 - Math.pow(1 - progress, 3);
  const rollSpeed = (1 - easeOut) * 0.3;
  diceObj.rotation.x += rollSpeed * (1 + Math.random() * 0.5);
  diceObj.rotation.y += rollSpeed * (0.8 + Math.random() * 0.5);
  diceObj.rotation.z += rollSpeed * 0.3;
};

const settleToFinalPosition = (diceObj: THREE.Mesh): boolean => {
  const faceIndex = FACE_ORDER.indexOf(targetValue);
  if (faceIndex < 0 || faceIndex >= faceQuaternions.length) return true;
  const targetQuat = faceQuaternions[faceIndex];
  diceObj.quaternion.slerp(targetQuat, 0.15);
  if (diceObj.quaternion.angleTo(targetQuat) < 0.01) {
    diceObj.quaternion.copy(targetQuat);
    return true;
  }
  return false;
};

const animate = () => {
  if (!scene || !camera || !renderer || !dice) return;
  if (props.isRolling) {
    const progress = Math.min((Date.now() - rollStartTime) / rollDuration, 1);
    if (progress < 1) {
      updateRollingAnimation(dice, progress);
    } else if (settleToFinalPosition(dice)) {
      emit('rollComplete');
    }
  }
  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
};

const startRolling = (finalValue: number) => {
  targetValue = finalValue;
  rollStartTime = Date.now();
};

watch(
  () => props.isRolling,
  (newVal) => {
    if (newVal) startRolling(props.value);
  },
);
watch(
  () => props.value,
  (newVal) => {
    if (!props.isRolling) setDiceToValue(newVal);
  },
);

const cleanupRenderer = () => {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement);
    renderer.dispose();
  }
};

const cleanupDice = () => {
  if (!dice) return;
  if (dice.material) {
    if (Array.isArray(dice.material)) {
      dice.material.forEach(m => m.dispose());
    } else {
      dice.material.dispose();
    }
  }
  dice.geometry.dispose();
};

onMounted(() => {
  initScene();
  animate();
});

onUnmounted(() => {
  cleanupRenderer();
  cleanupDice();
});

defineExpose({ startRolling, setDiceToValue });
</script>

<style scoped>
.dice-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.dice-container.rolling {
  animation: shake 0.1s infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px) translateY(1px);
  }
  75% {
    transform: translateX(2px) translateY(-1px);
  }
}
</style>
