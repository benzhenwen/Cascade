import * as rm from "https://deno.land/x/remapper@4.0.0/src/mod.ts";
import { Vec2, Vec3, Vec4 } from "https://deno.land/x/remapper@4.0.0/src/mod.ts";

import { map } from "./script.ts"
import { pink, round, lerp, lightOn, lightOff, fadeStrobe, roundVec, randSign } from "./script_util.ts"


// static cubes
const SC_LIGHTTYPE = 0;
const SC_LIGHTIDOFFSET = 100; // light type 0 uses up to ID 10
const SC_HEADER: string = "c_";
export const scList: StaticCube[] = [];

let sc_idTracker: number = 0;
export let effectiveParticleTracker = 0; // just for fun stat to show how many times createParticle has been called

class StaticCube {
    lightID: number;
    track: string;
    occupiedUntil: number;

    constructor(occupiedUntil: number) {
        this.lightID = SC_LIGHTIDOFFSET + sc_idTracker++;
        this.track = SC_HEADER + (sc_idTracker - 1);
        this.occupiedUntil = occupiedUntil;

        new rm.Geometry(map, {
            lightType: SC_LIGHTTYPE,
            lightID: this.lightID,
            track: this.track,
            position: [0, 0, -99],
            type: "Cube",
            material: "trans",
            components: {
                TubeBloomPrePassLight: {
                    bloomFogIntensityMultiplier: 0.4
                }
            }
        });
    }
}

export const scPointList: StaticCubePointDefinition[] = [];
class StaticCubePointDefinition {
    size: number;
    warningDuration: number;
    tailDuration: number;
    definitionName: string;

    beatsGenEventsOn: Map<number, number[]> = new Map<number, number[]>(); // stores to-be generated light events for efficiency

    constructor(size: number, warningDuration: number, tailDuration: number) {
        this.size = size;
        this.warningDuration = warningDuration;
        this.tailDuration = tailDuration;
        this.definitionName = SC_HEADER + warningDuration + "_" + tailDuration+"_"+size;

        const totalDuration = warningDuration + tailDuration;
        const midpoint = warningDuration / totalDuration;
        const floatTailDuration = tailDuration / totalDuration;
        
        // also consider implementing a single funtion that creates the matchin light events.
        const newPointDef: rm.RawPointsVec3 = [];
        if (warningDuration > 0) { // warning - hold size
            newPointDef.push([size, size, size, 0]);
            newPointDef.push([size, size, size, midpoint]);
        }
        newPointDef.push([size*1.5, size*1.5, size*1.5, midpoint]); // flash larger
        newPointDef.push([size    , size    , size    , midpoint + 0.03, "easeOutSine"]);
        newPointDef.push([size    , size    , size    , midpoint + floatTailDuration * 0.8]);
        newPointDef.push([size*1.1, size*1.1, size*1.1, midpoint + floatTailDuration * 0.85, "easeInOutSine"]); // small flash & dissapear
        newPointDef.push([0       , 0       , 0       , 1, "easeInSine"])

        map.pointDefinitions[this.definitionName] = newPointDef;
    }

    genEvents(beat: number, lightID: number) {
        if (!this.beatsGenEventsOn.has(beat)) {
            this.beatsGenEventsOn.set(beat, [lightID]);
        }
        else {
            this.beatsGenEventsOn.get(beat)?.push(lightID);
        }
    }

    // genEvents(beat: number, lightID: number) {
    //     const WARNINGPULSERATE = 1; // pulses twice per beat

    //     for (let b = beat - this.warningDuration; b <= beat - 1/4; b += (1/4)) { 
    //         const lifeTimeOffset = beat - b;                                     // the time until "impact"
    //         const lifeTimeFloat = 1 - (lifeTimeOffset / this.warningDuration);   // at what point in the lifetime are we in (0-1)

    //         const brightness = Math.min(0.35, lifeTimeFloat*0.7);                     // reach full brightness (0.5) half way into lifetime
    //         const whiteness = (0.5 - (lifeTimeOffset % WARNINGPULSERATE)); // this is the flutter effect. repeats every WARNINGPULSERATE beat. outputs 0-0.25

    //         lightOn(b, SC_LIGHTTYPE, lightID, [
    //             lerp(pink()[0], 1, whiteness),
    //             lerp(pink()[1], 1, whiteness),
    //             lerp(pink()[2], 1, whiteness),
    //             brightness
    //         ]);
    //     }
        
    //     fadeStrobe(beat, beat + 1/8, [1, 1, 1, 1.2], pink(), SC_LIGHTTYPE, lightID, 16);
    //     // lightOff(beat + this.tailDuration, SC_LIGHTTYPE, lightIDs); // not needed since cube physically scales down to 0
    // }

    flushEvents() {
        const WARNINGPULSERATE = 1; // pulses twice per beat

        this.beatsGenEventsOn.forEach((lightIDs: number[], beat: number) => {
            const workingIDs: rm.LightID = (lightIDs.length == 1 ? lightIDs[0] : lightIDs);

            for (let b = beat - this.warningDuration; b <= beat - 1/4; b += (1/4)) { 
                const lifeTimeOffset = beat - b;                                     // the time until "impact"
                const lifeTimeFloat = 1 - (lifeTimeOffset / this.warningDuration);   // at what point in the lifetime are we in (0-1)

                const brightness = Math.min(0.35, lifeTimeFloat*0.7);                     // reach full brightness (0.5) half way into lifetime
                const whiteness = (0.5 - (lifeTimeOffset % WARNINGPULSERATE)); // this is the flutter effect. repeats every WARNINGPULSERATE beat. outputs 0-0.25

                lightOn(b, SC_LIGHTTYPE, workingIDs, [
                    lerp(pink()[0], 1, whiteness),
                    lerp(pink()[1], 1, whiteness),
                    lerp(pink()[2], 1, whiteness),
                    brightness
                ]);
            }
            
            fadeStrobe(beat, beat + 1/8, [1, 1, 1, 1.2], pink(), SC_LIGHTTYPE, workingIDs, 16);
            // lightOff(beat + this.tailDuration, SC_LIGHTTYPE, lightIDs); // not needed since cube physically scales down to 0
        });

        this.beatsGenEventsOn.clear();
    }
}

// call periodically when you know you won't be generating any more static cubes on the same beats
export function flushAllEvents() {
    scPointList.forEach(element => {
        element.flushEvents();
    });
}

function createStaticCube(activationBeat: number, warningDuration: number, tailDuration: number, size: number, position: Vec3, rotation: Vec3) {
    effectiveParticleTracker++;

    position[0] = round(position[0]);
    position[1] = round(position[1]);
    position[2] = round(position[2]);

    rotation[0] = round(rotation[0]);
    rotation[1] = round(rotation[1]);
    rotation[2] = round(rotation[2]);

    const startTime = activationBeat - warningDuration;
    const endTime = activationBeat + tailDuration;

    // search for usable 
    let currentCube: StaticCube | null = null;
    for (const c of scList) {
        if (c.occupiedUntil < startTime) {
            currentCube = c;
            currentCube.occupiedUntil = endTime;
            break;
        }
    } 
    if (currentCube == null) {
        currentCube = new StaticCube(endTime);
        scList.push(currentCube);
    }

    // search for usable animation
    let currentAnim: StaticCubePointDefinition | null = null;
    for (const c of scPointList) {
        if (c.warningDuration == warningDuration && c.tailDuration == tailDuration && c.size == size) {
            currentAnim = c;
            break;
        }
    }
    if (currentAnim == null) {
        currentAnim = new StaticCubePointDefinition(size, warningDuration, tailDuration);
        scPointList.push(currentAnim);
    }

    // the animation
    rm.animateTrack(map, round(startTime), currentCube.track, round(endTime-startTime), {
        scale: currentAnim.definitionName,
        position: position,
        rotation: rotation
    });

    currentAnim.genEvents(activationBeat, currentCube.lightID);
}

export function create(startBeat: number, cubeRate: number, warningDuration: number, tailDuration: number, 
startPosition: Vec3, startRotation: Vec2, rotationOffset: Vec2, cubeSize: number, cutoff: number | ((count: number, x: number, y: number, z: number) => boolean)) {

    const distanceOffset = cubeSize * 1.1;

    let totalCubes = 9999;
    if (typeof cutoff == "number") {
        totalCubes = cutoff / distanceOffset;
    } 

    const workingPosition = startPosition.slice() as Vec3;
    const workingRotation = startRotation.slice() as Vec3;

    for (let i = 0; i <= totalCubes; i++) {
        if (i > 500) {
            throw new Error("static cube line is too long / indefinite")
        }

        if (typeof cutoff != "number") {
            if (cutoff(i, workingPosition[0], workingPosition[1], workingPosition[2])) break;
        }

        const beat = round(startBeat + cubeRate * i);

        const yaw = workingRotation[0] * Math.PI / 180;
        const pitch = workingRotation[1] * Math.PI / 180;
        const x = Math.cos(yaw)*Math.cos(pitch);
        const y = Math.sin(yaw)*Math.cos(pitch);
        const z = Math.sin(pitch);

        createStaticCube(beat, warningDuration, tailDuration, cubeSize, 
            roundVec(workingPosition.concat() as Vec3) as Vec3, 
            [-round(Math.asin(z) * 180 / Math.PI), 0, -round(Math.atan2(x, y) * 180 / Math.PI)] // voodoo magic fuckery euler angles idk
        );

        workingPosition[0] += x * distanceOffset;
        workingPosition[1] += y * distanceOffset;
        workingPosition[2] += z * distanceOffset;

        workingRotation[0] += rotationOffset[0];
        workingRotation[1] += rotationOffset[1];
    }
}

export function validate(startPosition: Vec3, startRotation: Vec2, rotationOffset: Vec2, cubeSize: number, cutoff: number | ((count: number, x: number, y: number, z: number) => boolean)): Vec3[] {

    const output: Vec3[] = [];

    const distanceOffset = cubeSize * 1.1;

    let totalCubes = 9999;
    if (typeof cutoff == "number") {
        totalCubes = cutoff / distanceOffset;
    } 

    const workingPosition = startPosition.slice() as Vec3;
    const workingRotation = startRotation.slice() as Vec3;

    for (let i = 0; i <= totalCubes; i++) {
        if (i > 500) {
            throw new Error("static cube line is too long / indefinite (in validate function")
        }

        if (typeof cutoff != "number") {
            if (cutoff(i, workingPosition[0], workingPosition[1], workingPosition[2])) break;
        }

        output.push(workingPosition.slice() as Vec3);

        const yaw = workingRotation[0] * Math.PI / 180;
        const pitch = workingRotation[1] * Math.PI / 180;
        const x = Math.cos(yaw)*Math.cos(pitch);
        const y = Math.sin(yaw)*Math.cos(pitch);
        const z = Math.sin(pitch);

        workingPosition[0] += x * distanceOffset;
        workingPosition[1] += y * distanceOffset;
        workingPosition[2] += z * distanceOffset;

        workingRotation[0] += rotationOffset[0];
        workingRotation[1] += rotationOffset[1];
    }

    return output;
}

export function createSpiral(startBeat: number, spiralBeatOffset: number, spiralCount: number, cubeRate: number, warningDuration: number, tailDuration: number, 
startPosition: Vec3, startRotation: Vec2, rotationOffset: Vec2, cubeSize: number, cutoff: number | ((count: number, x: number, y: number, z: number) => boolean),
angleOffsetOverride: number | undefined = undefined) {
    for (let i = 0; i < spiralCount; i++) {
        const angleOffset = (angleOffsetOverride == undefined) ? 
            (i / spiralCount) * -360 :
            (angleOffsetOverride * i);
        create(startBeat + spiralBeatOffset*i, cubeRate, warningDuration, tailDuration, startPosition, [startRotation[0] + angleOffset, startRotation[1]], rotationOffset, cubeSize, cutoff);
    }
}
