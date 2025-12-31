import * as rm from "https://deno.land/x/remapper@4.0.0/src/mod.ts";
import { Vec2, Vec3, Vec4 } from "https://deno.land/x/remapper@4.0.0/src/mod.ts";

import { map, SPEEENPOINTDEF } from "./script.ts"
import { pink, round, lerp, lightOn, lightOff, fadeStrobe, roundVec, randSign } from "./script_util.ts"


// particles
const P_LIGHTTYPE = 1;
const P_LIGHTIDOFFSET = 100; // light type 0 uses up to ID 10
const P_HEADER: string = "p_";
export const scList: Particle[] = [];

let pc_idTracker: number = 0;
export let effectiveParticleTracker = 0; // just for fun stat to show how many times createParticle has been called

class Particle {
    lightID: number;
    track: string;
    geoType: rm.GeoType;
    occupiedUntil: number;

    constructor(geoType: rm.GeoType, occupiedUntil: number) {
        this.lightID = P_LIGHTIDOFFSET + pc_idTracker++;
        this.track = P_HEADER + (pc_idTracker - 1);
        this.geoType = geoType;
        this.occupiedUntil = occupiedUntil;

        new rm.Geometry(map, {
            lightType: P_LIGHTTYPE,
            lightID: this.lightID,
            track: this.track, // TODO: Add SPEENTRACK once new heck update comes out
            position: [0, 0, -99],
            type: geoType,
            material: "trans",
            components: {
                TubeBloomPrePassLight: {
                    bloomFogIntensityMultiplier: 0.2
                }
            }
        });
    }
}

export function create(beat: number, duration: number, geoType: rm.GeoType, size: number, startPosition: Vec3, endPosition: Vec3, doFlashEffect: boolean = true, doLights: boolean = true) {
    effectiveParticleTracker++;

    startPosition[0] = round(startPosition[0]);
    startPosition[1] = round(startPosition[1]);
    startPosition[2] = round(startPosition[2]);
    
    endPosition[0] = round(endPosition[0]);
    endPosition[1] = round(endPosition[1]);
    endPosition[2] = round(endPosition[2]);

    const endTime = beat + duration;

    // search for usable 
    let currentParticle: Particle | null = null;
    for (const c of scList) {
        if (c.occupiedUntil < beat && c.geoType == geoType) {
            currentParticle = c;
            currentParticle.occupiedUntil = endTime;
            break;
        }
    } 
    if (currentParticle == null) {
        currentParticle = new Particle(geoType, endTime);
        scList.push(currentParticle);
    }

    // the animation
    rm.animateTrack(map, beat, currentParticle.track, duration, {
        scale: [size, size, size],
        position: [
            [startPosition[0], startPosition[1], startPosition[2], 0],
            [endPosition[0], endPosition[1], endPosition[2], 1]
        ]
    });

    if (currentParticle.geoType != "Sphere") {
        rm.animateTrack(map, {
            beat: beat,
            track: currentParticle.track,
            duration: 2,
            repeat: 99,
            animation: {
                rotation: SPEEENPOINTDEF
            }
        });
    }

    // light
    if (doLights) {
        if (doFlashEffect) fadeStrobe(beat, beat + 1, [1, 1, 1, 1.5], pink(), P_LIGHTTYPE, currentParticle.lightID, 8);
        else               lightOn(beat, P_LIGHTTYPE, currentParticle.lightID, pink());
        lightOff(endTime, P_LIGHTTYPE, currentParticle.lightID);
    }
}

export function createExplode(beat: number, duration: number, geoType: rm.GeoType, size: number, count: number, startPosition: Vec3, distance: number, angularOffset: number = 0, doFlashEffect = true) {
    startPosition[0] = round(startPosition[0]);
    startPosition[1] = round(startPosition[1]);
    startPosition[2] = round(startPosition[2]);
    
    const endTime = beat + duration;

    const lights: number[] = [];

    for (let i = 0; i < count; i++) {
        effectiveParticleTracker++;

        const endPosition: rm.Vec3 = [
            startPosition[0] + distance * Math.cos((angularOffset / 180  +  (i / count) * 2) * Math.PI),
            startPosition[1] + distance * Math.sin((angularOffset / 180  +  (i / count) * 2) * Math.PI),
            startPosition[2]
        ];
        
        endPosition[0] = round(endPosition[0]);
        endPosition[1] = round(endPosition[1]);
        endPosition[2] = round(endPosition[2]);

        // search for usable 
        let currentParticle: Particle | null = null;
        for (const c of scList) {
            if (c.occupiedUntil < beat && c.geoType == geoType) {
                currentParticle = c;
                currentParticle.occupiedUntil = endTime;
                break;
            }
        } 
        if (currentParticle == null) {
            currentParticle = new Particle(geoType, endTime);
            scList.push(currentParticle);
        }

        // the animation
        rm.animateTrack(map, beat, currentParticle.track, duration, {
            scale: [size, size, size],
            position: [
                [startPosition[0], startPosition[1], startPosition[2], 0],
                [endPosition[0], endPosition[1], endPosition[2], 1]
            ]
        });

        if (currentParticle.geoType != "Sphere") {
            rm.animateTrack(map, {
                beat: beat,
                track: currentParticle.track,
                duration: 2,
                repeat: 99,
                animation: {
                    rotation: SPEEENPOINTDEF
                }
            });
        }

        // add to lights list for light
        lights.push(currentParticle.lightID);
    }

    // light
    if (doFlashEffect) fadeStrobe(beat, beat + 1, [1, 1, 1, 1.5], pink(), P_LIGHTTYPE, lights);
    else               lightOn(beat, P_LIGHTTYPE, lights, pink());
    lightOff(endTime, P_LIGHTTYPE, lights);
}