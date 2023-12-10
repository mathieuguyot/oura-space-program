import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import * as CANNON from "cannon-es";
import IEntity from "./iEntity";
import { OBJExporter } from "three/examples/jsm/Addons.js";

function getPolyhedronShape(mesh: THREE.Mesh) {
    /* let geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", mesh.geometry.getAttribute("position"));

    geometry = BufferGeometryUtils.mergeVertices(geometry);

    const points = [];
    const faces = [];

    if (geometry.index) {
        const position = geometry.attributes.position.array;
        const index = geometry.getIndex();

        for (let i = 0; i < position.length; i += 3) {
            points.push(new CANNON.Vec3(position[i], position[i + 1], position[i + 2]));
        }
        for (let i = 0; i < index.length; i += 3) {
            faces.push([index[i], index[i + 1], index[i + 2]]);
        }
    }
 */
    //const { vertices, faces } = getVerticesAndFaces(mesh);
    //return new CANNON.ConvexPolyhedron({ vertices: vertices, faces: faces });
}

function getVerticesAndFaces(object: THREE.Object3D) {
    const exporter = new OBJExporter();
    const contents = exporter.parse(object);

    const rows = contents
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split(" "));
    const vertices = rows
        .filter((row) => row[0] === "v")
        .map((row) => row.slice(1).map(parseFloat));
    const faces = rows
        .filter((row) => row[0] === "f")
        .map((row) => row.slice(1))
        .map((row) => row.map((cell) => parseInt(cell.split("/")[0], 10) - 1));

    return {
        vertices,
        faces
    };
}

export default class Planet implements IEntity {
    name: string;
    massKg: number;
    radiusM: number;

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

        // Create planet mesh
        const debugTexture = new THREE.TextureLoader().load("grid.jpg");
        debugTexture.repeat = new THREE.Vector2(1000, 1000);
        debugTexture.wrapS = debugTexture.wrapT = THREE.RepeatWrapping;
        const texture = new THREE.TextureLoader().load(texturePath);
        this.planetMesh = new THREE.Mesh(
            new THREE.SphereGeometry(radiusM, 360, 360),
            new THREE.MeshBasicMaterial({ map: debugTexture })
        );
        scene.add(this.planetMesh);

        // Create pysical body
        const colliderShape = new CANNON.Box(new CANNON.Vec3(100, 100, 0.01));
        this.physicalBody = new CANNON.Body({ mass: massKg });
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
                //console.log("sc velocity", otherBody.velocity);
            }
        });
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
