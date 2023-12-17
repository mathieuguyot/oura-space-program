import * as THREE from "three";
import * as CANNON from "cannon-es";

export function cannonToThreeJsVec3(v: CANNON.Vec3): THREE.Vector3 {
    return new THREE.Vector3(v.x, v.y, v.z);
}

export function threeJsToCannonVec3(v: THREE.Vector3): CANNON.Vec3 {
    return new CANNON.Vec3(v.x, v.y, v.z);
}

export function cannonToThreeJsQuat(q: CANNON.Quaternion): THREE.Quaternion {
    return new THREE.Quaternion(q.x, q.y, q.z, q.w);
}

export function threeJsToCannonQuat(q: THREE.Quaternion): CANNON.Quaternion {
    return new CANNON.Quaternion(q.x, q.y, q.z, q.w);
}
