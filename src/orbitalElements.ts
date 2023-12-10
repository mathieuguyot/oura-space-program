import * as THREE from "three";
import * as CANNON from "cannon-es";

function scalarProduct(a: CANNON.Vec3, b: CANNON.Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

export default class OrbitalElements {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    ascendingNode: number;
    periapsisArgument: number;
    trueAnomaly: number;

    constructor(
        semiMajorAxis: number,
        eccentricity: number,
        inclination: number,
        ascendingNode: number,
        periapsisArgument: number,
        trueAnomaly: number
    ) {
        this.semiMajorAxis = semiMajorAxis;
        this.eccentricity = eccentricity;
        this.inclination = inclination;
        this.ascendingNode = ascendingNode;
        this.periapsisArgument = periapsisArgument;
        this.trueAnomaly = trueAnomaly;
    }

    fromCartesian(pos: CANNON.Vec3, vel: CANNON.Vec3) {
        const muEarth = 3.98589196e14;
        this.semiMajorAxis = 1 / (2 / pos.length() - vel.lengthSquared() / muEarth);

        const hVec = pos.cross(vel);
        const eVec = vel
            .cross(hVec)
            .scale(1 / muEarth)
            .vsub(pos.scale(1 / pos.length()));
        this.eccentricity = eVec.length();
        this.inclination = Math.acos(hVec.z / hVec.length());
        const nVec = new CANNON.Vec3(-hVec.y, hVec.x, 0);
        if (nVec.length() === 0) {
            this.ascendingNode = 0;
        } else if (nVec.y >= 0) {
            this.ascendingNode = Math.acos(nVec.x / nVec.length());
        } else {
            this.ascendingNode = 2 * Math.PI - Math.acos(nVec.x / nVec.length());
        }

        if (nVec.length() === 0) {
            this.periapsisArgument = 0;
        } else if (eVec.z >= 0) {
            this.periapsisArgument = Math.acos(
                scalarProduct(nVec, eVec) / (nVec.length() * this.eccentricity)
            );
        } else {
            this.periapsisArgument =
                2 * Math.PI -
                Math.acos(scalarProduct(nVec, eVec) / (nVec.length() * this.eccentricity));
        }

        if (scalarProduct(pos, vel) >= 0) {
            this.trueAnomaly = Math.acos(
                scalarProduct(pos, eVec) / (this.eccentricity * pos.length())
            );
        } else {
            this.trueAnomaly =
                2 * Math.PI -
                Math.acos(scalarProduct(pos, eVec) / (this.eccentricity * pos.length()));
        }

        this.periapsisArgument = THREE.MathUtils.radToDeg(this.periapsisArgument);
        this.ascendingNode = THREE.MathUtils.radToDeg(this.ascendingNode);
        this.inclination = THREE.MathUtils.radToDeg(this.inclination);
        this.trueAnomaly = THREE.MathUtils.radToDeg(this.trueAnomaly);
    }
}
