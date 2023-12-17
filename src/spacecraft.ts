import * as THREE from "three";
import * as CANNON from "cannon-es";
import InputManager from "./inputManager";
import IEntity from "./iEntity";
import Orbit from "./orbit";
import OrbitalElements from "./orbitalElements";
import { useAltitude } from "./store";
import { cannonToThreeJsQuat, cannonToThreeJsVec3, threeJsToCannonVec3 } from "./utils";

export default class SpaceCraft implements IEntity {
    inputManager: InputManager;
    rotationSpeed: number = 1.0;
    motorIsOn: boolean = false;
    orbit: Orbit;
    isGrounded: boolean;
    flightPhase = 0;
    altitude = 0;

    colliders: CANNON.Body[] = [];
    meshes: THREE.Mesh[] = [];
    lockConstraints: CANNON.LockConstraint[] = [];

    thrustVector: THREE.ArrowHelper;

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

        const segments = 36;
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
        const firstStageEngineColliderBody = new CANNON.Body({ mass: 1250 });
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
        const firstStageBoosterColliderBody = new CANNON.Body({ mass: 5000 });
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
        const decouplerColliderBody = new CANNON.Body({ mass: 200 });
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
        const secondStageEngineColliderBody = new CANNON.Body({ mass: 1250 });
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
        const secondStageBoosterColliderBody = new CANNON.Body({ mass: 550 });
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
        const secondStageDecouplerColliderBody = new CANNON.Body({ mass: 200 });
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
        const capsuleColliderBody = new CANNON.Body({ mass: 840 });
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
            segments
        );
        const capsuleMesh = new THREE.Mesh(capsuleGeometry, whiteMaterial);
        this.meshes.push(capsuleMesh);

        for (const mesh of this.meshes) {
            scene.add(mesh);
        }
        this.updateAllPhysicalBodies(this.isGrounded ? 0.4 : 0, new THREE.Vector3());

        // Create orbit
        const oe = new OrbitalElements(0, 0, 0, 0, 0, 0);
        oe.fromCartesian(
            this.colliders[this.colliders.length - 1].position.clone(),
            this.colliders[this.colliders.length - 1].velocity.clone()
        );
        this.orbit = new Orbit(scene, "red", oe);

        this.thrustVector = new THREE.ArrowHelper();
        scene.add(this.thrustVector);
    }
    setIsGrounded(isGrounded: boolean, deltaPosition: THREE.Vector3): void {
        this.isGrounded = isGrounded;
        this.updateAllPhysicalBodies(isGrounded ? 0.4 : 0, deltaPosition);
    }
    getMeshes(): THREE.Mesh[] {
        return this.meshes;
    }
    getColliders(): CANNON.Body[] {
        return this.colliders;
    }

    matchMeshPositionToPhysicalPosition() {
        for (let i = 0; i < this.colliders.length; i++) {
            this.meshes[i].position.copy(cannonToThreeJsVec3(this.colliders[i].position));
            this.meshes[i].quaternion.copy(cannonToThreeJsQuat(this.colliders[i].quaternion));
        }
    }

    updateAllPhysicalBodies(linearDamping: number, deltaPosition: THREE.Vector3) {
        for (let i = 0; i < this.colliders.length; i++) {
            console.log(this.colliders[i].velocity);
            this.colliders[i].linearDamping = linearDamping;
            this.colliders[i].angularDamping = 0.5;
            if (this.altitude < 80000) {
                this.colliders[i].position.x += deltaPosition.x;
                this.colliders[i].position.y += deltaPosition.y;
                this.colliders[i].position.z += deltaPosition.z;
                this.matchMeshPositionToPhysicalPosition();
            }
        }
    }

    step(deltaTime: number) {
        const decouplerForce = 10000;
        const force = 300000;
        const rotationalForce = 500000;

        if (this.inputManager.IsKeyPressed(" ")) {
            const forwardDirection = new THREE.Vector3(0, 0, 0);
            forwardDirection.applyQuaternion(
                this.meshes[this.flightPhase === 0 ? 0 : 3].quaternion
            );
            this.colliders[this.flightPhase === 0 ? 0 : 3].applyLocalForce(
                new CANNON.Vec3(0, force, 0),
                threeJsToCannonVec3(forwardDirection)
            );

            this.thrustVector.position.copy(this.meshes[0].position.clone());
            this.thrustVector.setDirection(forwardDirection);
            this.thrustVector.setLength(10);
        }
        if (this.inputManager.IsKeyPressed("1") || this.inputManager.IsKeyPressed("&")) {
            if (this.flightPhase === 0) {
                this.lockConstraints[2].disable();
                this.flightPhase = 1;
                // TODO: not local
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
                // TODO: not local
                this.colliders[6].applyLocalImpulse(
                    new CANNON.Vec3(0, decouplerForce, 0),
                    new CANNON.Vec3(0, 0, 0)
                );
            }
        }

        const currentDecouplerIndex = this.flightPhase === 0 ? 2 : 5;
        if (this.inputManager.IsKeyPressed("a") || this.inputManager.IsKeyPressed("A")) {
            const forwardDirection = new THREE.Vector3(0, 1, 0);
            forwardDirection.applyQuaternion(
                this.meshes[this.flightPhase === 0 ? 0 : 3].quaternion
            );
            forwardDirection.multiplyScalar(rotationalForce * deltaTime);
            const torque = new CANNON.Vec3(
                forwardDirection.x,
                forwardDirection.y,
                forwardDirection.z
            );
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("e") || this.inputManager.IsKeyPressed("E")) {
            const forwardDirection = new THREE.Vector3(0, -1, 0);
            forwardDirection.applyQuaternion(
                this.meshes[this.flightPhase === 0 ? 0 : 3].quaternion
            );
            forwardDirection.multiplyScalar(rotationalForce * deltaTime);
            const torque = new CANNON.Vec3(
                forwardDirection.x,
                forwardDirection.y,
                forwardDirection.z
            );
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("d") || this.inputManager.IsKeyPressed("D")) {
            const forwardDirection = new THREE.Vector3(1, 0, 0);
            forwardDirection.applyQuaternion(
                this.meshes[this.flightPhase === 0 ? 0 : 3].quaternion
            );
            forwardDirection.multiplyScalar(rotationalForce * deltaTime);
            const torque = new CANNON.Vec3(
                forwardDirection.x,
                forwardDirection.y,
                forwardDirection.z
            );
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("q") || this.inputManager.IsKeyPressed("Q")) {
            const forwardDirection = new THREE.Vector3(-1, 0, 0);
            forwardDirection.applyQuaternion(
                this.meshes[this.flightPhase === 0 ? 0 : 3].quaternion
            );
            forwardDirection.multiplyScalar(rotationalForce * deltaTime);
            const torque = new CANNON.Vec3(
                forwardDirection.x,
                forwardDirection.y,
                forwardDirection.z
            );
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("z") || this.inputManager.IsKeyPressed("Z")) {
            const forwardDirection = new THREE.Vector3(0, 0, 1);
            forwardDirection.applyQuaternion(
                this.meshes[this.flightPhase === 0 ? 0 : 3].quaternion
            );
            forwardDirection.multiplyScalar(rotationalForce * deltaTime);
            const torque = new CANNON.Vec3(
                forwardDirection.x,
                forwardDirection.y,
                forwardDirection.z
            );
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }
        if (this.inputManager.IsKeyPressed("s") || this.inputManager.IsKeyPressed("S")) {
            const forwardDirection = new THREE.Vector3(0, 0, -1);
            forwardDirection.applyQuaternion(
                this.meshes[this.flightPhase === 0 ? 0 : 3].quaternion
            );
            forwardDirection.multiplyScalar(rotationalForce * deltaTime);
            const torque = new CANNON.Vec3(
                forwardDirection.x,
                forwardDirection.y,
                forwardDirection.z
            );
            this.colliders[currentDecouplerIndex].applyTorque(torque);
        }

        this.matchMeshPositionToPhysicalPosition();

        //Update orbit
        const oe = new OrbitalElements(0, 0, 0, 0, 0, 0);
        oe.fromCartesian(
            this.colliders[this.colliders.length - 1].position.clone(),
            this.colliders[this.colliders.length - 1].velocity.clone()
        );
        this.orbit.setOrbitalElements(oe);

        // update altitude
        this.altitude =
            this.colliders[this.colliders.length - 1].position.distanceTo(
                new CANNON.Vec3(0, 0, 0)
            ) - 6371000;
        useAltitude.setState({ altitude: this.altitude });
    }
}
