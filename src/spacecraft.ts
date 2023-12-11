import * as THREE from "three";
import * as CANNON from "cannon-es";
import InputManager from "./inputManager";
import IEntity from "./iEntity";
import Orbit from "./orbit";
import OrbitalElements from "./orbitalElements";

export default class SpaceCraft implements IEntity {
    inputManager: InputManager;
    rotationSpeed: number = 1.0;
    motorIsOn: boolean = false;
    scMesh: THREE.Mesh;
    physicalBody: CANNON.Body;
    orbit: Orbit;
    isGrounded: boolean;

    constructor(
        scene: THREE.Scene,
        physicalWorld: CANNON.World,
        inputManager: InputManager,
        defaultPos: THREE.Vector3,
        defaultVel: THREE.Vector3
    ) {
        this.inputManager = inputManager;
        this.isGrounded = true;

        // Create phyiscal body
        this.physicalBody = new CANNON.Body({
            mass: 10,
            position: new CANNON.Vec3(defaultPos.x, defaultPos.y, defaultPos.z),
            velocity: new CANNON.Vec3(defaultVel.x, defaultVel.y, defaultVel.z),
            linearDamping: 0,
            angularDamping: 0.4
        });
        this.physicalBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.8, 0.5)));
        this.physicalBody.shapeOffsets[0] = new CANNON.Vec3(0, -0.3, 0);
        this.physicalBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(0, 0, -1),
            THREE.MathUtils.degToRad(90)
        );
        physicalWorld.addBody(this.physicalBody);

        // Create mesh
        const scGeometry = new THREE.BoxGeometry(1, 1, 1);
        const scMaterial = new THREE.MeshBasicMaterial({ color: "grey" });
        this.scMesh = new THREE.Mesh(scGeometry, scMaterial);

        const thurstGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 32);
        const thurstMat = new THREE.MeshBasicMaterial({ color: "orange" });
        const thurstMesh = new THREE.Mesh(thurstGeo, thurstMat);
        thurstMesh.position.set(0, -0.75, 0);
        this.scMesh.add(thurstMesh);

        scene.add(this.scMesh);

        // Create orbit
        const oe = new OrbitalElements(0, 0, 0, 0, 0, 0);
        oe.fromCartesian(this.physicalBody.position, this.physicalBody.velocity);
        this.orbit = new Orbit(scene, "red", oe);
    }
    setIsGrounded(isGrounded: boolean, deltaPosition: THREE.Vector3): void {
        this.isGrounded = isGrounded;
        this.physicalBody.position = new CANNON.Vec3(
            this.physicalBody.position.x + deltaPosition.x,
            this.physicalBody.position.y + deltaPosition.y,
            this.physicalBody.position.z + deltaPosition.z
        );
        this.scMesh.position.set(
            this.physicalBody.position.x,
            this.physicalBody.position.y,
            this.physicalBody.position.z
        );
    }
    getMesh(): THREE.Mesh {
        return this.scMesh;
    }
    getPhysicsBody(): CANNON.Body {
        return this.physicalBody;
    }

    step(deltaTime: number) {
        const force = 200;
        const rotationalForce = 200;

        if (this.isGrounded) {
            this.physicalBody.linearDamping = 0.4;
        } else {
            this.physicalBody.linearDamping = 0;
        }
        if (this.inputManager.IsKeyPressed("a") || this.inputManager.IsKeyPressed("A")) {
            var torque = new CANNON.Vec3(rotationalForce * deltaTime, 0, 0);
            this.physicalBody.applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("e") || this.inputManager.IsKeyPressed("E")) {
            var torque = new CANNON.Vec3(-rotationalForce * deltaTime, 0, 0);
            this.physicalBody.applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("d") || this.inputManager.IsKeyPressed("D")) {
            var torque = new CANNON.Vec3(0, rotationalForce * deltaTime, 0);
            this.physicalBody.applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("q") || this.inputManager.IsKeyPressed("Q")) {
            var torque = new CANNON.Vec3(0, -rotationalForce * deltaTime, 0);
            this.physicalBody.applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("z") || this.inputManager.IsKeyPressed("Z")) {
            var torque = new CANNON.Vec3(0, 0, rotationalForce * deltaTime);
            this.physicalBody.applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("s") || this.inputManager.IsKeyPressed("S")) {
            var torque = new CANNON.Vec3(0, 0, -rotationalForce * deltaTime);
            this.physicalBody.applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed(" ")) {
            const forwardDirection = new THREE.Vector3(0, 1, 0);
            forwardDirection.applyQuaternion(this.scMesh.quaternion);
            this.physicalBody.applyLocalForce(
                new CANNON.Vec3(0, force, 0),
                new CANNON.Vec3(0, 0, 0)
            );
        }

        this.scMesh.position.set(
            this.physicalBody.position.x,
            this.physicalBody.position.y,
            this.physicalBody.position.z
        );
        this.scMesh.quaternion.set(
            this.physicalBody.quaternion.x,
            this.physicalBody.quaternion.y,
            this.physicalBody.quaternion.z,
            this.physicalBody.quaternion.w
        );

        //Update orbit
        const oe = new OrbitalElements(0, 0, 0, 0, 0, 0);
        oe.fromCartesian(this.physicalBody.position, this.physicalBody.velocity);
        this.orbit.setOrbitalElements(oe);
    }
}
