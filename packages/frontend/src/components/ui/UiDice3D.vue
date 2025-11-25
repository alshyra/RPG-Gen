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

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

interface Props {
  value?: number;
  diceType?: DiceType;
  isRolling?: boolean;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  value: 1,
  diceType: 'd20',
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

// Pre-computed face orientations
let faceQuaternions: THREE.Quaternion[] = [];
let faceOrder: number[] = [];

// Dice configurations
const DICE_CONFIGS: Record<DiceType, { faces: number; faceOrder: number[] }> = {
  d4: { faces: 4, faceOrder: [1, 2, 3, 4] },
  d6: { faces: 6, faceOrder: [1, 6, 2, 5, 3, 4] },
  d8: { faces: 8, faceOrder: [1, 8, 2, 7, 3, 6, 4, 5] },
  d10: { faces: 10, faceOrder: [1, 10, 2, 9, 3, 8, 4, 7, 5, 6] },
  d12: { faces: 12, faceOrder: [1, 12, 2, 11, 3, 10, 4, 9, 5, 8, 6, 7] },
  d20: { faces: 20, faceOrder: [1, 20, 2, 19, 3, 18, 4, 17, 5, 16, 6, 15, 7, 14, 8, 13, 9, 12, 10, 11] },
};

const computeFaceNormal = (pos: THREE.BufferAttribute, idx: number, vertCount: number): THREE.Vector3 => {
  const v0 = new THREE.Vector3().fromBufferAttribute(pos, idx);
  const v1 = new THREE.Vector3().fromBufferAttribute(pos, idx + 1);
  const v2 = new THREE.Vector3().fromBufferAttribute(pos, idx + (vertCount > 2 ? 2 : 1));
  const edge1 = new THREE.Vector3().subVectors(v1, v0);
  const edge2 = new THREE.Vector3().subVectors(v2, v0);
  return new THREE.Vector3().crossVectors(edge1, edge2).normalize();
};

const computeFaceQuaternionsForGeometry = (geometry: THREE.BufferGeometry, verticesPerFace: number) => {
  faceQuaternions = [];
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const targetDir = new THREE.Vector3(0, 0, 1);
  const faceCount = position.count / verticesPerFace;
  Array.from({ length: faceCount }).forEach((_, i) => {
    const normal = computeFaceNormal(position, i * verticesPerFace, verticesPerFace);
    faceQuaternions.push(new THREE.Quaternion().setFromUnitVectors(normal, targetDir));
  });
};

const createCanvasContext = (): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  return { canvas, ctx: canvas.getContext('2d')! };
};

const drawD6Background = (ctx: CanvasRenderingContext2D) => {
  const gradient = ctx.createLinearGradient(0, 0, 128, 128);
  gradient.addColorStop(0, '#6b21a8');
  gradient.addColorStop(1, '#3b0764');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 120, 120);
};

const drawPips = (ctx: CanvasRenderingContext2D, value: number) => {
  ctx.fillStyle = '#fbbf24';
  getPipPositions(value).forEach((pos) => {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.fill();
  });
};

// D6 - Cube with pips
const createD6Texture = (value: number): THREE.CanvasTexture => {
  const { canvas, ctx } = createCanvasContext();
  drawD6Background(ctx);
  drawPips(ctx, value);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const getPipPositions = (value: number): { x: number; y: number }[] => {
  const center = 64;
  const offset = 32;
  const layouts: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };
  return (layouts[value] || layouts[1]).map(([dx, dy]) => ({ x: center + dx * offset, y: center + dy * offset }));
};

const drawTrianglePath = (ctx: CanvasRenderingContext2D) => {
  ctx.beginPath();
  ctx.moveTo(64, 8);
  ctx.lineTo(120, 110);
  ctx.lineTo(8, 110);
  ctx.closePath();
};

const drawPentagon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
  ctx.beginPath();
  Array.from({ length: 5 }).forEach((_, i) => {
    const angle = (Math.PI / 2) + (i * 2 * Math.PI / 5);
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
};

const drawShapePath = (ctx: CanvasRenderingContext2D, shape: 'triangle' | 'pentagon' | 'square') => {
  if (shape === 'triangle') {
    drawTrianglePath(ctx);
  } else if (shape === 'pentagon') {
    drawPentagon(ctx, 64, 64, 56);
  } else {
    ctx.fillRect(0, 0, 128, 128);
  }
};

const setupGradient = (ctx: CanvasRenderingContext2D): CanvasGradient => {
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, '#6b21a8');
  gradient.addColorStop(1, '#3b0764');
  return gradient;
};

const drawNumber = (ctx: CanvasRenderingContext2D, value: number, yPos: number) => {
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value.toString(), 64, yPos);
};

const applyShapeStroke = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  ctx.stroke();
};

// Generic numbered face texture (for D4, D8, D10, D12, D20)
const createNumberTexture = (value: number, shape: 'triangle' | 'pentagon' | 'square'): THREE.CanvasTexture => {
  const { canvas, ctx } = createCanvasContext();
  ctx.fillStyle = setupGradient(ctx);
  drawShapePath(ctx, shape);
  ctx.fill();
  applyShapeStroke(ctx);
  drawNumber(ctx, value, shape === 'triangle' ? 70 : 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

// Create geometry based on dice type
const createDiceGeometry = (diceType: DiceType): THREE.BufferGeometry => {
  switch (diceType) {
    case 'd4': return new THREE.TetrahedronGeometry(1.3, 0);
    case 'd6': return new THREE.BoxGeometry(1.5, 1.5, 1.5);
    case 'd8': return new THREE.OctahedronGeometry(1.3, 0);
    case 'd10': return createD10Geometry();
    case 'd12': return new THREE.DodecahedronGeometry(1.2, 0);
    case 'd20': return new THREE.IcosahedronGeometry(1.2, 0);
    default: return new THREE.IcosahedronGeometry(1.2, 0);
  }
};

// D10 is a pentagonal trapezohedron (special geometry)
const createD10Geometry = (): THREE.BufferGeometry => {
  // Approximate with a modified shape - using double pentagonal pyramid
  const geometry = new THREE.CylinderGeometry(0.8, 0.8, 1.8, 10, 1);
  return geometry;
};

// Get the shape type for texture
const getTextureShape = (diceType: DiceType): 'triangle' | 'pentagon' | 'square' => {
  switch (diceType) {
    case 'd4':
    case 'd8':
    case 'd20': return 'triangle';
    case 'd12': return 'pentagon';
    default: return 'square';
  }
};

// Get vertices per face for face normal calculation
const getVerticesPerFace = (diceType: DiceType): number => {
  switch (diceType) {
    case 'd4':
    case 'd8':
    case 'd20': return 3;
    case 'd6': return 4;
    case 'd12': return 5;
    case 'd10': return 3;
    default: return 3;
  }
};

// Create materials for dice
const createDiceMaterials = (diceType: DiceType): THREE.Material[] => {
  const config = DICE_CONFIGS[diceType];
  if (diceType === 'd6') {
    return config.faceOrder.map(value => new THREE.MeshStandardMaterial({
      map: createD6Texture(value),
      roughness: 0.3,
      metalness: 0.1,
    }));
  }
  const shape = getTextureShape(diceType);
  return config.faceOrder.map(value => new THREE.MeshStandardMaterial({
    map: createNumberTexture(value, shape),
    roughness: 0.3,
    metalness: 0.2,
    side: THREE.DoubleSide,
  }));
};

const setupLighting = (targetScene: THREE.Scene) => {
  targetScene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(2, 2, 5);
  targetScene.add(directionalLight);
  const pointLight = new THREE.PointLight(0xa855f7, 0.5, 10);
  pointLight.position.set(-2, 2, 3);
  targetScene.add(pointLight);
};

const assignMaterialGroups = (geometry: THREE.BufferGeometry, faceCount: number, vertsPerFace: number) => {
  geometry.clearGroups();
  Array.from({ length: faceCount }).forEach((_, i) => geometry.addGroup(i * vertsPerFace, vertsPerFace, i));
};

const createDiceMesh = (): THREE.Mesh => {
  const config = DICE_CONFIGS[props.diceType];
  faceOrder = config.faceOrder;

  const geometry = createDiceGeometry(props.diceType);
  const vertsPerFace = getVerticesPerFace(props.diceType);

  computeFaceQuaternionsForGeometry(geometry, vertsPerFace);
  assignMaterialGroups(geometry, config.faces, vertsPerFace);

  const diceMesh = new THREE.Mesh(geometry, createDiceMaterials(props.diceType));
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
  if (!dice || faceQuaternions.length === 0) return;
  const faceIndex = faceOrder.indexOf(value);
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
  const faceIndex = faceOrder.indexOf(targetValue);
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
