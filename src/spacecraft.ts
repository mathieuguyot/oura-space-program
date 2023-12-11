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
    //scMesh: THREE.Mesh;
    //physicalBody: CANNON.Body;
    orbit: Orbit;
    isGrounded: boolean;
    flightPhase = 0;

    colliders: CANNON.Body[] = [];
    meshes: THREE.Mesh[] = [];
    lockConstraints: CANNON.LockConstraint[] = [];

    constructor(
        scene: THREE.Scene,
        physicalWorld: CANNON.World,
        inputManager: InputManager,
        defaultPos: THREE.Vector3,
        defaultVel: THREE.Vector3
    ) {
        this.inputManager = inputManager;
        this.isGrounded = false;
        // Create phyiscal body
        /* this.physicalBody = new CANNON.Body({
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
        physicalWorld.addBody(this.physicalBody); */

        const segments = 20;
        const boosterRadius = 1.85;
        const firstStageBoosterHeight = 39;
        const secondStageBoosterHeight = 4;
        const engineTopRadius = 1.4;
        const engineBottomRadius = 1.8;
        const engineHeight = 2;
        const decouplerHeight = 1;
        const capsuleTopRadius = 0.7;
        const capsuleHeight = 2.5;
        const maxForce = 1e20;

        // Create colliders
        const firstStageEngineCollider = new CANNON.Cylinder(
            engineTopRadius,
            engineBottomRadius,
            engineHeight,
            segments
        );
        const firstStageEngineColliderBody = new CANNON.Body({ mass: 10 });
        firstStageEngineColliderBody.addShape(firstStageEngineCollider);
        firstStageEngineColliderBody.position.x = defaultPos.x;
        firstStageEngineColliderBody.position.y = defaultPos.y;
        firstStageEngineColliderBody.position.z = defaultPos.z;
        firstStageEngineColliderBody.quaternion.setFromEuler(0, 0, THREE.MathUtils.degToRad(-90));
        this.colliders.push(firstStageEngineColliderBody);

        const firstStageBoosterCollider = new CANNON.Cylinder(
            boosterRadius,
            boosterRadius,
            firstStageBoosterHeight,
            segments
        );
        const firstStageBoosterColliderBody = new CANNON.Body({ mass: 10 });
        firstStageBoosterColliderBody.addShape(firstStageBoosterCollider);
        firstStageBoosterColliderBody.position.y = firstStageEngineColliderBody.position.y;
        firstStageBoosterColliderBody.position.x =
            firstStageEngineColliderBody.position.x + (engineHeight + firstStageBoosterHeight) / 2;
        firstStageBoosterColliderBody.position.z = firstStageEngineColliderBody.position.z;
        firstStageBoosterColliderBody.quaternion.setFromEuler(0, 0, THREE.MathUtils.degToRad(-90));
        this.colliders.push(firstStageBoosterColliderBody);
        this.lockConstraints.push(
            new CANNON.LockConstraint(firstStageEngineColliderBody, firstStageBoosterColliderBody, {
                maxForce: maxForce
            })
        );

        const decouplerCollider = new CANNON.Cylinder(
            boosterRadius,
            boosterRadius,
            decouplerHeight,
            segments
        );
        const decouplerColliderBody = new CANNON.Body({ mass: 10 });
        decouplerColliderBody.addShape(decouplerCollider);
        decouplerColliderBody.position.y = firstStageBoosterColliderBody.position.y;
        decouplerColliderBody.position.x =
            firstStageBoosterColliderBody.position.x +
            (decouplerHeight + firstStageBoosterHeight) / 2;
        decouplerColliderBody.position.z = firstStageBoosterColliderBody.position.z;
        decouplerColliderBody.quaternion.setFromEuler(0, 0, THREE.MathUtils.degToRad(-90));
        this.colliders.push(decouplerColliderBody);
        this.lockConstraints.push(
            new CANNON.LockConstraint(firstStageBoosterColliderBody, decouplerColliderBody, {
                maxForce: maxForce
            })
        );

        const secondStageEngienCollider = new CANNON.Cylinder(
            engineTopRadius,
            engineBottomRadius,
            engineHeight,
            segments
        );
        const secondStageEngineColliderBody = new CANNON.Body({ mass: 10 });
        secondStageEngineColliderBody.addShape(secondStageEngienCollider);
        secondStageEngineColliderBody.position.y = decouplerColliderBody.position.y;
        secondStageEngineColliderBody.position.x =
            decouplerColliderBody.position.x + (engineHeight + decouplerHeight) / 2;
        secondStageEngineColliderBody.position.z = decouplerColliderBody.position.z;
        secondStageEngineColliderBody.quaternion.setFromEuler(0, 0, THREE.MathUtils.degToRad(-90));
        this.colliders.push(secondStageEngineColliderBody);
        this.lockConstraints.push(
            new CANNON.LockConstraint(decouplerColliderBody, secondStageEngineColliderBody, {
                maxForce: maxForce
            })
        );

        const secondStageBoosterCollider = new CANNON.Cylinder(
            boosterRadius,
            boosterRadius,
            secondStageBoosterHeight,
            segments
        );
        const secondStageBoosterColliderBody = new CANNON.Body({ mass: 10 });
        secondStageBoosterColliderBody.addShape(secondStageBoosterCollider);
        secondStageBoosterColliderBody.position.y = secondStageEngineColliderBody.position.y;
        secondStageBoosterColliderBody.position.x =
            secondStageEngineColliderBody.position.x +
            (engineHeight + secondStageBoosterHeight) / 2;
        secondStageBoosterColliderBody.position.z = secondStageEngineColliderBody.position.z;
        secondStageBoosterColliderBody.quaternion.setFromEuler(0, 0, THREE.MathUtils.degToRad(-90));
        this.colliders.push(secondStageBoosterColliderBody);
        this.lockConstraints.push(
            new CANNON.LockConstraint(
                secondStageEngineColliderBody,
                secondStageBoosterColliderBody,
                {
                    maxForce: maxForce
                }
            )
        );

        const secondStageDecouplerCollider = new CANNON.Cylinder(
            boosterRadius,
            boosterRadius,
            decouplerHeight,
            segments
        );
        const secondStageDecouplerColliderBody = new CANNON.Body({ mass: 10 });
        secondStageDecouplerColliderBody.addShape(secondStageDecouplerCollider);
        secondStageDecouplerColliderBody.position.y = secondStageBoosterColliderBody.position.y;
        secondStageDecouplerColliderBody.position.x =
            secondStageBoosterColliderBody.position.x +
            (decouplerHeight + secondStageBoosterHeight) / 2;
        secondStageDecouplerColliderBody.position.z = secondStageBoosterColliderBody.position.z;
        secondStageDecouplerColliderBody.quaternion.setFromEuler(
            0,
            0,
            THREE.MathUtils.degToRad(-90)
        );
        this.colliders.push(secondStageDecouplerColliderBody);
        this.lockConstraints.push(
            new CANNON.LockConstraint(
                secondStageBoosterColliderBody,
                secondStageDecouplerColliderBody,
                {
                    maxForce: maxForce
                }
            )
        );

        const capsuleCollider = new CANNON.Cylinder(
            capsuleTopRadius,
            boosterRadius,
            capsuleHeight,
            segments
        );
        const capsuleColliderBody = new CANNON.Body({ mass: 10 });
        capsuleColliderBody.quaternion.setFromEuler(0, 0, THREE.MathUtils.degToRad(-90));
        capsuleColliderBody.addShape(capsuleCollider);
        capsuleColliderBody.position.y = secondStageDecouplerColliderBody.position.y;
        capsuleColliderBody.position.x =
            secondStageDecouplerColliderBody.position.x + (capsuleHeight + decouplerHeight) / 2;
        capsuleColliderBody.position.z = secondStageDecouplerColliderBody.position.z;
        this.colliders.push(capsuleColliderBody);
        this.lockConstraints.push(
            new CANNON.LockConstraint(secondStageDecouplerColliderBody, capsuleColliderBody, {
                maxForce: maxForce
            })
        );

        for (const collider of this.colliders) {
            collider.velocity.set(defaultVel.x, defaultVel.y, defaultVel.z);
            physicalWorld.addBody(collider);
        }
        for (const constraint of this.lockConstraints) {
            physicalWorld.addConstraint(constraint);
        }

        // Create meshes
        const greyMaterial = new THREE.MeshStandardMaterial({ color: "grey" });
        const whiteMaterial = new THREE.MeshStandardMaterial({ color: "white" });

        const engineGeometry = new THREE.CylinderGeometry(
            engineTopRadius,
            engineBottomRadius,
            engineHeight,
            segments
        );
        const engineMesh = new THREE.Mesh(engineGeometry, greyMaterial);
        this.meshes.push(engineMesh);

        const firstStageBoosterGeometry = new THREE.CylinderGeometry(
            boosterRadius,
            boosterRadius,
            firstStageBoosterHeight,
            segments
        );
        const fistStageBoosterMesh = new THREE.Mesh(firstStageBoosterGeometry, whiteMaterial);
        this.meshes.push(fistStageBoosterMesh);

        const decouplerGeometry = new THREE.CylinderGeometry(
            boosterRadius,
            boosterRadius,
            decouplerHeight,
            segments
        );
        const decouplerMesh = new THREE.Mesh(decouplerGeometry, greyMaterial);
        this.meshes.push(decouplerMesh);

        const secondStageEngineMesh = new THREE.Mesh(engineGeometry, greyMaterial);
        this.meshes.push(secondStageEngineMesh);

        const secondStageBoosterGeometry = new THREE.CylinderGeometry(
            boosterRadius,
            boosterRadius,
            secondStageBoosterHeight,
            segments
        );
        const secondStageBoosterMesh = new THREE.Mesh(secondStageBoosterGeometry, whiteMaterial);
        this.meshes.push(secondStageBoosterMesh);

        const secondStagedecouplerGeometry = new THREE.CylinderGeometry(
            boosterRadius,
            boosterRadius,
            decouplerHeight,
            segments
        );
        const secondstageDecouplerMesh = new THREE.Mesh(secondStagedecouplerGeometry, greyMaterial);
        this.meshes.push(secondstageDecouplerMesh);

        const capsuleGeometry = new THREE.CylinderGeometry(
            capsuleTopRadius,
            boosterRadius,
            capsuleHeight,
            20
        );
        const capsuleMesh = new THREE.Mesh(capsuleGeometry, whiteMaterial);
        this.meshes.push(capsuleMesh);

        for (const mesh of this.meshes) {
            scene.add(mesh);
        }
        this.matchMeshPositionToPhysicalPosition();

        // Create orbit
        const oe = new OrbitalElements(0, 0, 0, 0, 0, 0);
        oe.fromCartesian(
            this.colliders[this.colliders.length - 1].position,
            this.colliders[this.colliders.length - 1].velocity
        );
        this.orbit = new Orbit(scene, "red", oe);
    }
    setIsGrounded(isGrounded: boolean, deltaPosition: THREE.Vector3): void {
        this.isGrounded = isGrounded;
        this.updateAllPhysicalBodies(isGrounded ? 0.4 : 0, deltaPosition);
        /* this.physicalBody.position = new CANNON.Vec3(
            this.physicalBody.position.x + deltaPosition.x,
            this.physicalBody.position.y + deltaPosition.y,
            this.physicalBody.position.z + deltaPosition.z
        );
        this.scMesh.position.set(
            this.physicalBody.position.x,
            this.physicalBody.position.y,
            this.physicalBody.position.z
        ); */
    }
    getMeshes(): THREE.Mesh[] {
        return this.meshes;
    }
    getColliders(): CANNON.Body[] {
        return this.colliders;
    }

    matchMeshPositionToPhysicalPosition() {
        for (let i = 0; i < this.colliders.length; i++) {
            this.meshes[i].position.set(
                this.colliders[i].position.x,
                this.colliders[i].position.y,
                this.colliders[i].position.z
            );
            this.meshes[i].quaternion.set(
                this.colliders[i].quaternion.x,
                this.colliders[i].quaternion.y,
                this.colliders[i].quaternion.z,
                this.colliders[i].quaternion.w
            );
        }
    }

    updateAllPhysicalBodies(linearDamping: number, deltaPosition: THREE.Vector3) {
        for (let i = 0; i < this.colliders.length; i++) {
            this.colliders[i].linearDamping = linearDamping;
            this.colliders[i].position.x += deltaPosition.x;
            this.colliders[i].position.y += deltaPosition.y;
            this.colliders[i].position.z += deltaPosition.z;
        }
    }

    step(deltaTime: number) {
        const decouplerForce = 100;
        const force = 1000;
        const rotationalForce = 1000;

        if (this.inputManager.IsKeyPressed(" ")) {
            console.log("ici");
            const forwardDirection = new THREE.Vector3(0, 1, 0);
            forwardDirection.applyQuaternion(
                this.meshes[this.flightPhase === 0 ? 0 : 3].quaternion
            );
            this.colliders[this.flightPhase === 0 ? 0 : 3].applyLocalForce(
                new CANNON.Vec3(0, force, 0),
                new CANNON.Vec3(0, 0, 0)
            );
        }
        if (this.inputManager.IsKeyPressed("1") || this.inputManager.IsKeyPressed("&")) {
            if (this.flightPhase === 0) {
                this.lockConstraints[2].disable();
                this.flightPhase = 1;
                this.colliders[3].applyLocalImpulse(
                    new CANNON.Vec3(0, decouplerForce, 0),
                    new CANNON.Vec3(0, 0, 0)
                );
            }
        }
        if (this.inputManager.IsKeyPressed("2") || this.inputManager.IsKeyPressed("é")) {
            if (this.flightPhase === 1) {
                this.lockConstraints[5].disable();
                this.flightPhase = 2;
                this.colliders[6].applyLocalImpulse(
                    new CANNON.Vec3(0, decouplerForce, 0),
                    new CANNON.Vec3(0, 0, 0)
                );
            }
        }

        const currentDecouplerIndex = this.flightPhase === 0 ? 2 : 5;
        if (this.inputManager.IsKeyPressed("a") || this.inputManager.IsKeyPressed("A")) {
            var torque = new CANNON.Vec3(rotationalForce * deltaTime, 0, 0);
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("e") || this.inputManager.IsKeyPressed("E")) {
            var torque = new CANNON.Vec3(-rotationalForce * deltaTime, 0, 0);
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("d") || this.inputManager.IsKeyPressed("D")) {
            var torque = new CANNON.Vec3(0, rotationalForce * deltaTime, 0);
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("q") || this.inputManager.IsKeyPressed("Q")) {
            var torque = new CANNON.Vec3(0, -rotationalForce * deltaTime, 0);
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("z") || this.inputManager.IsKeyPressed("Z")) {
            var torque = new CANNON.Vec3(0, 0, rotationalForce * deltaTime);
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("s") || this.inputManager.IsKeyPressed("S")) {
            var torque = new CANNON.Vec3(0, 0, -rotationalForce * deltaTime);
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }

        this.matchMeshPositionToPhysicalPosition();

        //Update orbit
        const oe = new OrbitalElements(0, 0, 0, 0, 0, 0);
        oe.fromCartesian(
            this.colliders[this.colliders.length - 1].position,
            this.colliders[this.colliders.length - 1].velocity
        );
        this.orbit.setOrbitalElements(oe);
    }
}
