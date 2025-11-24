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

// Target rotations for each dice face (to show 1-6)
const faceRotations: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: Math.PI / 2 },
  3: { x: -Math.PI / 2, y: 0 },
  4: { x: Math.PI / 2, y: 0 },
  5: { x: 0, y: -Math.PI / 2 },
  6: { x: Math.PI, y: 0 },
};

// Pip layout configurations for each dice face value
const pipLayouts: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

const getPipPositions = (value: number): { x: number; y: number }[] => {
  const center = 64;
  const offset = 32;
  const layout = pipLayouts[value] || pipLayouts[1];
  return layout.map(([dx, dy]) => ({ x: center + dx * offset, y: center + dy * offset }));
};

const drawFaceOnCanvas = (ctx: CanvasRenderingContext2D, value: number) => {
  const gradient = ctx.createLinearGradient(0, 0, 128, 128);
  gradient.addColorStop(0, '#4a1d6e');
  gradient.addColorStop(1, '#2d1045');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 120, 120);
  ctx.fillStyle = '#fbbf24';
  getPipPositions(value).forEach((pos) => {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.fill();
  });
};

const createFaceTexture = (canvas: HTMLCanvasElement): THREE.CanvasTexture => {
  const texture = new THREE.CanvasTexture(canvas.cloneNode(true) as HTMLCanvasElement);
  const clonedCtx = (texture.image as HTMLCanvasElement).getContext('2d')!;
  clonedCtx.drawImage(canvas, 0, 0);
  texture.needsUpdate = true;
  return texture;
};

const createDiceMaterial = (): THREE.Material[] => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const faceValues = [1, 6, 2, 5, 3, 4]; // Standard D6 face order
  return faceValues.map((value) => {
    drawFaceOnCanvas(ctx, value);
    return new THREE.MeshStandardMaterial({ map: createFaceTexture(canvas), roughness: 0.3, metalness: 0.1 });
  });
};

const setupLighting = (targetScene: THREE.Scene) => {
  targetScene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(2, 2, 5);
  targetScene.add(directionalLight);
  const pointLight = new THREE.PointLight(0xa855f7, 0.5, 10);
  pointLight.position.set(-2, 2, 3);
  targetScene.add(pointLight);
};

const createDiceMesh = (): THREE.Mesh => {
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const diceMesh = new THREE.Mesh(geometry, createDiceMaterial());
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
  dice = createDiceMesh();
  scene.add(dice);
  setDiceToValue(props.value);
};

const setDiceToValue = (value: number) => {
  if (!dice) return;
  const rotation = faceRotations[value] || faceRotations[1];
  dice.rotation.x = rotation.x;
  dice.rotation.y = rotation.y;
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
  const target = faceRotations[targetValue] || faceRotations[1];
  diceObj.rotation.x = THREE.MathUtils.lerp(diceObj.rotation.x % (Math.PI * 2), target.x, 0.15);
  diceObj.rotation.y = THREE.MathUtils.lerp(diceObj.rotation.y % (Math.PI * 2), target.y, 0.15);
  diceObj.rotation.z = THREE.MathUtils.lerp(diceObj.rotation.z, 0, 0.15);
  const isSettled = Math.abs(diceObj.rotation.x - target.x) < 0.01
    && Math.abs(diceObj.rotation.y - target.y) < 0.01
    && Math.abs(diceObj.rotation.z) < 0.01;
  if (isSettled) {
    diceObj.rotation.x = target.x;
    diceObj.rotation.y = target.y;
    diceObj.rotation.z = 0;
  }
  return isSettled;
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
  if (Array.isArray(dice.material)) {
    dice.material.forEach(m => m.dispose());
  } else {
    dice.material.dispose();
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
