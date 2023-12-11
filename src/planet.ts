import * as THREE from "three";
import * as CANNON from "cannon-es";
import IEntity from "./iEntity";

function bodiesAreInContact(bodyA: CANNON.Body, bodyB: CANNON.Body, world: CANNON.World) {
    for (var i = 0; i < world.contacts.length; i++) {
        var c = world.contacts[i];
        if ((c.bi === bodyA && c.bj === bodyB) || (c.bi === bodyB && c.bj === bodyA)) {
            return true;
        }
    }
    return false;
}

export default class Planet implements IEntity {
    name: string;
    massKg: number;
    radiusM: number;
    physicalWorld: CANNON.World;
    markerMesh: THREE.Mesh;
    pivot: THREE.Group;
    oldPosition: THREE.Vector3;
    deltaTime: number;

    planetMesh: THREE.Mesh;
    physicalBody: CANNON.Body;

    entities: IEntity[] = [];

    constructor(
        scene: THREE.Scene,
        physicalWorld: CANNON.World,
        name: string,
        texturePath: string,
        massKg: number,
        radiusM: number
    ) {
        this.name = name;
        this.massKg = massKg;
        this.radiusM = radiusM;
        this.physicalWorld = physicalWorld;
        this.deltaTime = 0;

        // Create planet mesh

        const marker = new THREE.BoxGeometry(1, 1, 1);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.markerMesh = new THREE.Mesh(marker, markerMaterial);
        this.markerMesh.position.set(radiusM, 0, 0);
        this.oldPosition = this.markerMesh.position.clone();

        const debugTexture = new THREE.TextureLoader().load("grid.jpg");

        debugTexture.repeat = new THREE.Vector2(1000, 1000);
        debugTexture.wrapS = debugTexture.wrapT = THREE.RepeatWrapping;
        const texture = new THREE.TextureLoader().load(texturePath);
        this.planetMesh = new THREE.Mesh(
            new THREE.SphereGeometry(radiusM, 360, 360),
            new THREE.MeshBasicMaterial({ map: texture })
        );
        this.pivot = new THREE.Group();
        this.pivot.add(this.planetMesh);
        this.pivot.add(this.markerMesh);
        scene.add(this.pivot);

        // Create pysical body

        let colliderShape = new CANNON.Box(new CANNON.Vec3(100, 100, 1));
        this.physicalBody = new CANNON.Body({ mass: massKg, linearDamping: 0 });
        this.physicalBody.shapeOffsets = [new CANNON.Vec3(0, 0, -1)];
        this.physicalBody.addShape(colliderShape);
        physicalWorld.addBody(this.physicalBody);
        physicalWorld.addEventListener("preStep", () => {
            for (const entity of this.entities) {
                const center = new CANNON.Vec3(0, 0, 0);
                const otherBody = entity.getPhysicsBody();

                const sqrDst = otherBody.position.vsub(center).lengthSquared();
                let normalizedForcedir = otherBody.position.vsub(center);
                normalizedForcedir = normalizedForcedir.scale(1 / normalizedForcedir.length());
                const force = new CANNON.Vec3(0, 0, 0);
                force.x = (normalizedForcedir.x * 6.6743e-11 * massKg * otherBody.mass) / sqrDst;
                force.y = (normalizedForcedir.y * 6.6743e-11 * massKg * otherBody.mass) / sqrDst;
                force.z = (normalizedForcedir.z * 6.6743e-11 * massKg * otherBody.mass) / sqrDst;
                otherBody.applyForce(force.negate(), new CANNON.Vec3(0, 0, 0));

                this.pivot.rotation.y += 0.00004667 * 10 * this.deltaTime;
                this.physicalBody.quaternion.set(
                    this.planetMesh.quaternion.x,
                    this.planetMesh.quaternion.y,
                    this.planetMesh.quaternion.z,
                    this.planetMesh.quaternion.w
                );

                const markerWorldPos = this.markerMesh.getWorldPosition(new THREE.Vector3());
                const deltaPos = new THREE.Vector3(
                    markerWorldPos.x - this.oldPosition.x,
                    markerWorldPos.y - this.oldPosition.y,
                    markerWorldPos.z - this.oldPosition.z
                );
                this.oldPosition = markerWorldPos;

                entity.setIsGrounded(
                    bodiesAreInContact(
                        this.getPhysicsBody(),
                        entity.getPhysicsBody(),
                        this.physicalWorld
                    ),
                    deltaPos
                );
            }
        });
    }
    setIsGrounded(isGrounded: boolean, deltaPosition: THREE.Vector3): void {
        throw new Error("Method not implemented.");
    }

    getMesh(): THREE.Mesh {
        return this.planetMesh;
    }

    addEntity(entity: IEntity) {
        this.entities.push(entity);
    }

    getPhysicsBody(): CANNON.Body {
        return this.physicalBody;
    }

    step(deltaTime: number) {
        this.deltaTime = deltaTime;
        for (const entity of this.entities) {
            entity.step(deltaTime);

            if (this.entities.length > 0) {
                // Move collider plane
                const length = this.entities[0].getPhysicsBody().position.length();
                this.physicalBody.position.x =
                    (this.entities[0].getPhysicsBody().position.x / length) * this.radiusM;
                this.physicalBody.position.y =
                    (this.entities[0].getPhysicsBody().position.y / length) * this.radiusM;
                this.physicalBody.position.z =
                    (this.entities[0].getPhysicsBody().position.z / length) * this.radiusM;

                // Rotate collider plane (TODO compute this shit clean)
                const boxM = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 0.1));
                boxM.position.copy(
                    new THREE.Vector3(
                        this.physicalBody.position.x,
                        this.physicalBody.position.y,
                        this.physicalBody.position.z
                    )
                );
                boxM.lookAt(
                    new THREE.Vector3(
                        this.entities[0].getPhysicsBody().position.x,
                        this.entities[0].getPhysicsBody().position.y,
                        this.entities[0].getPhysicsBody().position.z
                    )
                );
                this.physicalBody.quaternion.copy(
                    new CANNON.Quaternion(
                        boxM.quaternion.x,
                        boxM.quaternion.y,
                        boxM.quaternion.z,
                        boxM.quaternion.w
                    )
                );
            }
        }
    }
}
