import * as CANNON from "cannon-es";

export default interface IEntity {
    step(deltaTime: number): void;
    getMesh(): THREE.Mesh;
    getPhysicsBody(): CANNON.Body;
}
