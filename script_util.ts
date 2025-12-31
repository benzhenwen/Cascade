import * as rm from "https://deno.land/x/remapper@4.0.0/src/mod.ts";
import { Vec2, Vec3, Vec4 } from "https://deno.land/x/remapper@4.0.0/src/mod.ts";

import { map } from "./script.ts"

export const ZEROCOLOR: Vec4 = [0, 0, 0, 0]

export function pink(brightness: number = 1): Vec4 {
    return [1, 0.125, 0.443, brightness];
}

// utility
export function randSign(input: number = 1, randFunc: ((min: number, max: number, round?: number) => number) = rm.random): number {
    if (randFunc(0, 1) < .5) { 
        input *= -1
    }
    return input
}
export function round(num: number, precision: number = 3): number {
    const m = 10**precision
    return Math.round((num + Number.EPSILON) * m) / m
}
export function roundVec<T extends number[]>(input: T, precision: number = 3): T {
    for (let i = 0; i < input.length; i++) {
        input[i] = round(input[i], precision);
    }
    return input;
}
export function gridCoordinatesToWorld(gridPos: Vec3): Vec3 {
    return [(gridPos[0]-1.5)*.6, (gridPos[1]+1.1)*.6, gridPos[2]*.6]
}
export function worldCoordinatesToGrid(worldPos: Vec3): Vec3 {
    return [worldPos[0]/.6+1.5, worldPos[1]/.6-1.1, worldPos[2]/.6]
}
export function lerp(a: number, b: number, t: number) {
    return a + (b-a)*t
}

export function lightDuration(startBeat: number, endBeat: number, lightType: number, lightIDs: number[] | number | undefined = undefined, color: rm.Vec4 = pink()) {
    lightOn(startBeat, lightType, lightIDs, color)
    lightOff(endBeat, lightType, lightIDs)
}
export function lightOn(beat: number, lightType: number, lightIDs: number[] | number | undefined = undefined, color: rm.Vec4 = pink()) {
    light(beat, lightType, 5, lightIDs, color);
}
export function lightOff(beat: number, lightType: number, lightIDs: number[] | number | undefined = undefined) {
    light(beat, lightType, 0, lightIDs, undefined);
}

export function fadeStrobe(startBeat: number, endBeat: number, startColor: Vec4, endColor: Vec4, lightType: number, lightIDs: number[] | number | undefined = undefined, strobeRate: number = 16) {
    for (let b = startBeat; b <= endBeat; b += (1/strobeRate)) {
        lightOn(b, lightType, lightIDs, [
            lerp(startColor[0], endColor[0], (b-startBeat)/(endBeat-startBeat)),
            lerp(startColor[1], endColor[1], (b-startBeat)/(endBeat-startBeat)),
            lerp(startColor[2], endColor[2], (b-startBeat)/(endBeat-startBeat)),
            lerp(startColor[3], endColor[3], (b-startBeat)/(endBeat-startBeat))
        ])
    }
}

export function pushBehind(track: rm.TrackValue, beat: number = 0) {
    rm.animateTrack(map, beat, track, 0, {
        position: [0, 0, -999]
    })
}

// const colorMap: Map<Number, String> = new Map<Number, String>;
export let totalIndexedLightCount = 0;
export let totalLightCount = 0;

function light(beat: number, lightType: number, lightValue: number, lightIDs: readonly number[] | number | undefined = undefined, color: rm.Vec4 | undefined) {
    if (color != undefined) color = [round(color[0]), round(color[1]), round(color[2]), round(color[3])];

    if (lightIDs == undefined || typeof(lightIDs) == "number") {
        totalIndexedLightCount += 1;
    } else {
        totalIndexedLightCount += lightIDs.length;
    }

    totalLightCount++;
    rm.basicEvent.lightEvent(map, {
        beat: round(beat),
        type: lightType,
        value: lightValue,
        unsafeCustomData: {
            lightID: lightIDs,
            color: color
        }
    });
}

