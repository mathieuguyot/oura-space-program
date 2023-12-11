import * as THREE from "three";
import * as CANNON from "cannon-es";
import { Scene, PerspectiveCamera, WebGLRenderer } from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import InputManager from "./inputManager";
import Planet from "./planet";
import SpaceCraft from "./spacecraft";
import CannonDebugger from "cannon-es-debugger";

const inputManager = new InputManager();

// Create threeJS scene, camera, renderer and orbit controls
const scene = new Scene();
const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.00001,
    100000000
);

const renderer = new WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

const controls = new TrackballControls(camera, renderer.domElement);

// Create Cannon.js physical world
const world = new CANNON.World();
world.stepnumber = 40;
world.gravity.set(0, 0, 0);
world.broadphase = new CANNON.NaiveBroadphase();

const cannonDebugger = CannonDebugger(scene, world);

// Create earth and spacecraft
const earthRadius = 6371000;
const earthMass = 5.972e24;
const earth = new Planet(scene, world, "Earth", "16k_earth.jpeg", earthMass, earthRadius);
const sc = new SpaceCraft(
    scene,
    world,
    inputManager,
    //new THREE.Vector3(earthRadius + 51, 0, 0),
    //new THREE.Vector3(0, 0, 0)
    new THREE.Vector3(2351526, 4171729, -4826254),
    new THREE.Vector3(-7135, 1076, -2546)
);
earth.addEntity(sc);

// Add floor (debuging)
/* const groundGeo = new THREE.PlaneGeometry(10000, 10000);
const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
groundMat.color.setHSL(0.095, 1, 0.75);

const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -20.5;
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground); */

// Set camera offset
camera.position.x = sc.getMeshes()[sc.getMeshes().length - 1].position.x + 5;
camera.position.y = sc.getMeshes()[sc.getMeshes().length - 1].position.y - 3;
camera.position.z = sc.getMeshes()[sc.getMeshes().length - 1].position.z - 3;

// Lights
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
hemiLight.color.setHSL(0.6, 1, 0.6);
hemiLight.groundColor.setHSL(0.095, 1, 0.75);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.color.setHSL(0.1, 1, 0.95);
dirLight.position.set(-1, 1.75, 1);
dirLight.position.multiplyScalar(30);
scene.add(dirLight);

// Animation loop
let lastDate = new Date();
let prevScPos = sc.getMeshes()[sc.getMeshes().length - 1].position.clone();
export const SPEED_FACTOR = 1;
function animate() {
    requestAnimationFrame(animate);

    // Compute delta time
    const currentDate = new Date();
    const deltaTime = (currentDate.getTime() - lastDate.getTime()) / 1000;
    lastDate = currentDate;

    // Update Cannon.js physics
    world.step((1 / 60) * SPEED_FACTOR);

    // Compute planet (that will run computations of all body attached to it)
    earth.step(deltaTime);
    //sc.step(deltaTime); // TODO remove when calling earth.step

    //scene.add(light);
    // Update camera & orbit controls
    let vec = new THREE.Vector3();
    vec.subVectors(sc.getMeshes()[sc.getMeshes().length - 1].position, prevScPos);
    prevScPos = sc.getMeshes()[sc.getMeshes().length - 1].position.clone();
    controls.object.position.add(vec);
    controls.target.copy(sc.getMeshes()[sc.getMeshes().length - 1].position);
    controls.update();

    // Render
    //cannonDebugger.update();
    renderer.render(scene, camera);
}

animate();
