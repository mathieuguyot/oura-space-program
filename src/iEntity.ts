import * as CANNON from "cannon-es";
import * as THREE from "three";

export default interface IEntity {
    step(deltaTime: number): void;
    getMesh(): THREE.Mesh;
    getPhysicsBody(): CANNON.Body;
    setIsGrounded(isGrounded: boolean, deltaPosition: THREE.Vector3): void;
}
