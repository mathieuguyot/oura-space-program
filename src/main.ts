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

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
    new THREE.Vector3(earthRadius + 4, 0, 0),
    new THREE.Vector3(0, 0, 0)
    //new THREE.Vector3(2351526, 4171729, -4826254),
    //new THREE.Vector3(-7135, 1076, -2546)
);
earth.addEntity(sc);

camera.position.x = sc.getMesh().position.x + 5;
camera.position.y = sc.getMesh().position.y - 3;
camera.position.z = sc.getMesh().position.z - 3;

// Animation loop
let lastDate = new Date();
let prevScPos = sc.getMesh().position.clone();
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

    // Update camera & orbit controls
    let vec = new THREE.Vector3();
    vec.subVectors(sc.getMesh().position, prevScPos);
    prevScPos = sc.getMesh().position.clone();
    controls.object.position.add(vec);
    controls.target.copy(sc.getMesh().position);
    controls.update();

    // Render
    cannonDebugger.update();
    renderer.render(scene, camera);
}

animate();
