import * as rm from "https://deno.land/x/remapper@4.0.0/src/mod.ts";
import { Vec2, Vec3, Vec4 } from "https://deno.land/x/remapper@4.0.0/src/mod.ts";

import { map } from "./script.ts"
import { pink, round, lerp, lightDuration, lightOn, lightOff, fadeStrobe, roundVec, randSign } from "./script_util.ts"

// barsss
const B_LIGHTTYPE = 2;
const B_LIGHTIDOFFSET = 100; // light type 0 uses up to ID 10
const B_HEADER: string = "b_";
export const bList: Bar[] = [];

let b_idTracker: number = 0;
export let effectiveBarTracker = 0; // just for fun stat to show how many times createParticle has been called

// bar shake point def
let b_shakePointDefInit_f = 0;
const B_SHAKEPONTDEF = "barShake";
const B_SHAKEINTENSITY = 2;

class Bar {
    lightID: number;
    track: string;
    occupiedUntil: number;
    width: number;

    constructor(occupiedUntil: number, width: number) {
        this.lightID = B_LIGHTIDOFFSET + b_idTracker++;
        this.track = B_HEADER + (b_idTracker - 1);
        this.occupiedUntil = occupiedUntil;
        this.width = width;

        new rm.Geometry(map, {
            lightType: B_LIGHTTYPE,
            lightID: this.lightID,
            track: this.track,
            position: [0, 0, -99],
            scale: [width, 200, width],
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
function fetchBar(beat: number, endTime: number, width: number): Bar {
    let currentBar: Bar | null = null;
    for (const b of bList) {
        if (b.occupiedUntil < beat && width == b.width) {
            currentBar = b;
            break;
        }
    } 
    if (currentBar == null) {
        currentBar = new Bar(endTime, width);
    }
    return currentBar;
}


// start position defines where the actual bar meets the warning. it will creep about 10 meters before 
export function create(beat: number, warningDuration: number, generateWarningBar: boolean, lingerDuration: number, width: number, startPosition: rm.Vec3, angle: number = 0) {

    const offset: rm.Vec3 = roundVec([
        Math.cos((angle - 90) * Math.PI/180) * 100,
        Math.sin((angle - 90) * Math.PI/180) * 100,
        0
    ]);

    const offestByTen = roundVec(rm.arrayMultiply(offset, 0.1));
    
    const midpoint: rm.Vec3 = startPosition;
    const startPoint: rm.Vec3 = rm.arrayAdd(startPosition, rm.arrayMultiply(offset, -1));
    const startPointTimesTwo: rm.Vec3 = rm.arrayAdd(startPosition, rm.arrayMultiply(offset, -2));
    const endPoint: rm.Vec3 = rm.arrayAdd(startPosition, offset);
    const endPointTimesTwo: rm.Vec3 = rm.arrayAdd(startPosition, rm.arrayMultiply(offset, 2));

    const startBeat = beat - warningDuration;
    const jumpBeat = beat;
    const endBeat = beat + lingerDuration;

    const midpointRatio = round((jumpBeat - startBeat) / (endBeat - startBeat));
    const midpointJumpOffset = 0.1;
    const midpointJumpOffsetRatio = round(midpointJumpOffset / (endBeat - startBeat));

    const primaryBar = fetchBar(startBeat, endBeat, width);
    
    // movement
    rm.animateTrack(map, {
        beat: startBeat,
        duration: endBeat - startBeat,
        track: primaryBar.track,
        animation: {
            rotation: [0, 0, angle],
            position: [[...startPointTimesTwo, 0],
                       [...startPoint, 0.05],
                       [...rm.arrayAdd(startPoint, offestByTen), midpointRatio - midpointJumpOffsetRatio],
                       [...midpoint, midpointRatio],
                       [...midpoint, 0.95],
                       [...startPointTimesTwo, 1]]
        }
    });

    lightOn(startBeat, B_LIGHTTYPE, primaryBar.lightID, pink());
    fadeStrobe(jumpBeat - midpointJumpOffset, jumpBeat - midpointJumpOffset + (1/8), [1, 1, 1, 1.2], pink(), B_LIGHTTYPE, primaryBar.lightID, 16);

    const allBarTracks: string[] = [primaryBar.track];

    // movement for second bar
    if (generateWarningBar) {
        const secondaryBar = fetchBar(startBeat, jumpBeat, width);
        allBarTracks.push(secondaryBar.track);

        // main animation
        rm.animateTrack(map, {
            beat: startBeat,
            duration: (jumpBeat - startBeat),
            track: secondaryBar.track,
            animation: {
                rotation: [0, 0, angle],
                position: [[...midpoint, 0],
                           [...endPoint, round(0.05 / midpointRatio)],
                           [...rm.arrayAdd(endPoint, offestByTen), round((midpointRatio - midpointJumpOffsetRatio) / midpointRatio)],
                           [...endPointTimesTwo, 1]]
            }
        });

        // lighting
        for (let b = startBeat; b <= jumpBeat; b += (1/4)) { 
            const lifeTimeOffset = beat - b;                                     // the time until "impact"
            const lifeTimeFloat = 1 - (lifeTimeOffset / (jumpBeat - startBeat));   // at what point in the lifetime are we in (0-1)

            const brightness = Math.min(1, lifeTimeFloat*4);                     // reach full brightness 1/4 way into lifetime
            const flashBrightness = Math.sin(lifeTimeOffset * Math.PI) * 0.3 + 0.7;   // flashing 0.4-1 every 2 beats

            lightOn(b, B_LIGHTTYPE, secondaryBar.lightID, pink(brightness * flashBrightness * 0.3));
        }
    }

    // if (!b_shakePointDefInit_f) {
    //     b_shakePointDefInit_f = 1;
    //     map.pointDefinitions[B_SHAKEPONTDEF] = [
    //         [B_SHAKEINTENSITY * 0, 0, 0, 0],
    //         [B_SHAKEINTENSITY * 0.2, 0, 0, 0.15, "easeOutCubic"],
    //         [B_SHAKEINTENSITY * -0.15, 0, 0, 0.4, "easeInOutCubic"],
    //         [B_SHAKEINTENSITY * 0.1, 0, 0, 0.6, "easeInOutCubic"],
    //         [B_SHAKEINTENSITY * -0.05, 0, 0, 0.8, "easeInOutCubic"],
    //         [B_SHAKEINTENSITY * 0.0, 0, 0, 1, "easeInOutCubic"]
    //     ];
    // }

    // // shake animation
    // rm.animateTrack(map, {
    //     beat: jumpBeat,
    //     duration: 0.5,
    //     track: allBarTracks,
    //     animation: {
    //         offsetPosition: B_SHAKEPONTDEF
    //     }
    // });

}