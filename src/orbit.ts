import OrbitalElements from "./orbitalElements";
import * as THREE from "three";

export default class Orbit {
    scene: THREE.Scene;
    orbitalElements: OrbitalElements;
    orbit: THREE.Line | undefined;
    geometry: THREE.BufferGeometry | undefined;
    color: string;

    renderOrbit() {
        // Create rotation matrix
        const inclinationRad = THREE.MathUtils.degToRad(this.orbitalElements.inclination);
        const ascendingNodeRad = THREE.MathUtils.degToRad(this.orbitalElements.ascendingNode);
        const periapsisArgumentRad = THREE.MathUtils.degToRad(
            this.orbitalElements.periapsisArgument
        );

        // Rotation matrix for argument of perigee + right ascension
        const rotationMatrix1 = new THREE.Matrix4().makeRotationX(inclinationRad);
        const rotationMatrix2 = new THREE.Matrix4().makeRotationZ(ascendingNodeRad);
        const rotationMatrix3 = new THREE.Matrix4().makeRotationZ(periapsisArgumentRad);
        const rotationMatrix = new THREE.Matrix4()
            .multiply(rotationMatrix2)
            .multiply(rotationMatrix1)
            .multiply(rotationMatrix3);

        if (!this.geometry) {
            this.geometry = new THREE.BufferGeometry();
        }

        const points = [];
        for (let i = 0; i <= 360; i += 0.1) {
            const theta = (i * Math.PI) / 180;
            const r =
                (this.orbitalElements.semiMajorAxis *
                    (1 - this.orbitalElements.eccentricity ** 2)) /
                (1 + this.orbitalElements.eccentricity * Math.cos(theta));

            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            const z = 0;

            const rotatedPoint = new THREE.Vector3(x, y, z).applyMatrix4(rotationMatrix);
            if (
                !Number.isNaN(rotatedPoint.x) &&
                !Number.isNaN(rotatedPoint.y) &&
                !Number.isNaN(rotatedPoint.z)
            ) {
                points.push(rotatedPoint.x, rotatedPoint.y, rotatedPoint.z);
            }
        }
        this.geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
        if (!this.orbit) {
            this.orbit = new THREE.Line(
                this.geometry,
                new THREE.LineBasicMaterial({ color: this.color, side: THREE.DoubleSide })
            );
            this.orbit.frustumCulled = false;
            //this.scene.add(this.orbit);
        }
    }

    setOrbitalElements(orbitalElements: OrbitalElements) {
        this.orbitalElements = orbitalElements;
        this.renderOrbit();
    }

    constructor(scene: THREE.Scene, color: string, orbitalElements: OrbitalElements) {
        this.scene = scene;
        this.color = color;
        this.orbitalElements = orbitalElements;
        this.renderOrbit();
    }
}
