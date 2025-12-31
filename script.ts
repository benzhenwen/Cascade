import * as rm from "https://deno.land/x/remapper@4.0.0/src/mod.ts";
import { Vec2, Vec3, Vec4 } from "https://deno.land/x/remapper@4.0.0/src/mod.ts";

const pipeline = await rm.createPipeline();
export const map = await rm.readDifficultyV3(pipeline, "ExpertPlusStandard");

import { pink, round, lerp, lightOn, lightOff, fadeStrobe, roundVec, randSign, totalLightCount, totalIndexedLightCount } from "./script_util.ts"
import * as staticCubeLine from "./script_static_cubes.ts";
import * as particle from "./script_particle.ts";
import * as bigbars from "./script_bars.ts";
import { toPathString } from "https://deno.land/std@0.187.0/fs/_util.ts";

/*

lightType: 0
    LightIDs: ALL - static cubes

lightType: 1
    LightIDs: ALL - Particles

lightType: 2
    LightIDs: ALL - Bass Bars // TODO

*/



// light


// ----------- { SCRIPT } -----------

export const SPEEENPOINTDEF = "speeen"
map.pointDefinitions[SPEEENPOINTDEF] = [
    [0, 0, 0, 0],
    [0, 0, 270, 0.25],
    [0, 0, 180, 0.5],
    [0, 0, 90, 0.75],
    [0, 0, 0, 1]
]

// material
map.geometryMaterials["trans"] = {
    shader: "TransparentLight",
    color: [1, 1, 1, 1],
};
map.geometryMaterials["standard"] = {
    shader: "Standard",
    color: [0, 0, 0, 0]
};

// removal
const removal: string[] = ["Ring", "NearBuilding", "Spectrogram", "BackColumns", "Laser", "BoxLight", "Track"]
removal.forEach(r => {
    new rm.Environment(map, {
        id: r,
        lookupMethod: "Contains",
        active: false
    });
})

// little path
for (let i = 0; i < 4; i++) {
    new rm.Geometry(map, {
        type: "Cube",
        material: "standard",
        scale: [0.54, 0.1, 32],
        position: [round(-.9 + .6*i), -0.3, 24]
    });
}



// --------------

function genSeededRandom(seed: number): (min: number, max: number, precision?: number) => number {
    return (min: number, max: number, precision: number = 3) => {
        seed += 0x6D2B79F5
        const r = rm.hashInteger(seed)
        return round(lerp(min, max, r), precision)
    }
}

// "visible" definition
function makeCubeLineValidator(countMin: number = 20, countMax: number = 99999): (count: number, x: number, y: number, z: number) => boolean {
    return (count: number, x: number, y: number, z: number): boolean => {
        if (count < countMin) return false;
        if (count >= countMax) return true;
        const xR = (Math.abs(x)*1.5)/z - 2;
        const yR = ((Math.abs(y-3))*2.5)/z - 2;
    
        return xR > 0 || yR > 0;
    }
}

const defaultCubeLineValidator = makeCubeLineValidator();


// actual creation logic

// -------------------------------------------------------------- melody --------------------------------------------------------------

// ----------------------------- intro bookmark -----------------------------
const random_startRain = genSeededRandom(1234567890123);
for (let b = 4; b < 66; b += 2) {
    const pos: Vec3 = [
        random_startRain(0, 15) * (b % 4 == 0 ? 1 : -1),
        30,
        random_startRain(26, 35)
    ]

    const xRotOffset = random_startRain(-15, 15) - (pos[0]/10);
    const yRotOffset = random_startRain(-4, 4);

    const xRotStep = random_startRain(-1.4, 1.4) - (pos[0]/30);
    const yRotStep = random_startRain(-0.2, 0);

    let interceptsPath: boolean = false;
    let getsNearPath: boolean = false;
    for (const pointPos of staticCubeLine.validate(pos, [-90 + xRotOffset, yRotOffset], [xRotStep, yRotStep], 0.6, defaultCubeLineValidator)) {
        if (pointPos[0] > -3 && pointPos[0] < 3 && pointPos[1] > -0.5 && pointPos[1] < 4) {
            interceptsPath = true;
            break;
        }
        if (pointPos[0] > -10 && pointPos[0] < 10 && pointPos[1] > -6 && pointPos[1] < 8) {
            getsNearPath = true;
        }
    }
    if (interceptsPath || !getsNearPath) {
        b -= 2;
    } else {
        staticCubeLine.create(b, 0.05, 2.5, 1.5, pos, [-90 + xRotOffset, yRotOffset], [xRotStep, yRotStep], 0.6, defaultCubeLineValidator);
    }
}

// fall particles
const random_fallParticles = genSeededRandom(46253765);
const startParticleBeats = [4,4.5,4.75,5.25,5.5,6,6.25,6.75,7,7.5,7.75,8.25,8.5,9,9.25,9.75,10,10.5,10.75,11.25,11.5,11.75,12,12.5,12.75,13.25,13.5,14,14.25,14.75,15,15.5,15.75,16.25,16.5,17,17.25,17.75,18,18.25,18.5,18.75,19.25,19.5,20,20.5,20.75,21.25,21.5,22,22.25,22.75,23,23.5,23.75,24.25,24.5,25,25.25,25.75,26,26.5,26.75,27.25,27.5,27.75,28,28.5,28.75,29.25,29.5,30,30.25,30.75,31,31.5,31.75,32.25,32.5,33,33.25,33.75];//,34,34.25,34.5,34.75,35.25,35.5,36,36.5,36.75,37.25,37.5,38,38.25,38.75,39,39.5,39.75,40.25,40.5,41,41.25,41.75,42,42.25,42.5,42.75,43.25,43.5,43.75,44,44.5,44.75,45.25,45.5,46,46.25,46.75,47,47.5,47.75,48.25,48.5,49,49.25,49.75,50,50.25,50.5,50.75,51.25,51.5,51.75,52,52.5,52.75,53.25,53.5,54,54.25,54.75,55,55.5,55.75,56.25,56.5,57,57.25,57.75,58,58.25,58.5,58.75,59.25,59.5,59.75,60,60.5,60.75,61.25,61.5,62,62.25,62.75,63,63.5,63.75,64.25,64.5,65,65.25,65.75,66,66.25,66.5,66.75,67.25,67.5]
startParticleBeats.forEach(beat => {
    const x = random_fallParticles(3, 38, 2) * (random_fallParticles(0, 1, 0) == 1 ? 1 : -1);
    const y = random_fallParticles(30, 40, 2);
    const z = random_fallParticles(30, 60, 2);

   particle.create(beat, 8, "Cube", 0.3, [x, y, z], [x, y-60, z]);
})

// but here's the climber - https://tenor.com/view/but-heres-the-climber-cat-but-heres-the-but-heres-the-kicker-gif-26532462
const random_climbersStart = genSeededRandom(3464576);
const climberStartBeats = [36, 38, 40, 43, 45, 48, 50, 52, 54, 57, 59, 61]
let parity = false;
climberStartBeats.forEach(beat => {
    const x = random_climbersStart(4, 28, 2) * (parity ? 1 : -1);
    const y = random_climbersStart(-20, -25, 2);
    const z = random_climbersStart(30, 45, 2);

    parity = !parity;

    staticCubeLine.create(beat, 0.5, 2, 1.5, [x, y, z], [90, 0], [0, 0], 2.5, defaultCubeLineValidator);
})

staticCubeLine.flushAllEvents();

// ----------------------------- melody bookmark -----------------------------

const spiral_h = 3;
const spiral_d = 50;

const SCR = 1/8;
const SOR = 1/32
const SCS = 1;

const spiralValidator = makeCubeLineValidator(10, 100);
const random_spiralsMelody = genSeededRandom(426572635);
function spiralPairs(beats: number[], position: Vec3 = [0, spiral_h, spiral_d]) {
    beats.forEach(beat => {
        const startAngle = random_spiralsMelody(0, 180, 1)
        const offsetAngle = randSign(1.5, random_spiralsMelody);
        staticCubeLine.createSpiral(beat, 0, 2, SCR, 0, 1.3, position, [startAngle, 0], [offsetAngle, 0], SCS, spiralValidator);
    })
}

let dir = -1;
staticCubeLine.createSpiral(68, SOR, 12, SCR, 4, 1.3, [0, spiral_h, spiral_d], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([71, 71.5, 72.5, 73, 74, 74.5]);
dir = 1;
staticCubeLine.createSpiral(75.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([79, 79.5, 80.5, 81.375, 81.5, 82.5, 83]);
dir = randSign(1, random_spiralsMelody);
staticCubeLine.createSpiral(83.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([87, 87.5, 88.5, 89, 90, 90.5]);
dir = randSign(1, random_spiralsMelody);
staticCubeLine.createSpiral(91.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

dir = -dir;
staticCubeLine.createSpiral(95.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([97.5, 99]);
dir = -dir;
staticCubeLine.createSpiral(99.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([103, 103.5, 104.5, 105, 106, 106.5]);
dir = randSign(1, random_spiralsMelody);
staticCubeLine.createSpiral(107.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([111, 111.5, 112.5, 113.375, 113.5, 114.5, 115]);
dir = randSign(1, random_spiralsMelody);
staticCubeLine.createSpiral(115.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([119, 119.5, 121.5, 123]);
dir = 1;
staticCubeLine.createSpiral(124, 1/13 /*4 / (54-1)*/, 54, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator, -23.25);

// sideways particles half way through the spirals
const random_particlesMelody = genSeededRandom(426572635);
for (let b = 100.5; b < 128; b++) {
    for (let i = 0; i < 2; i++) {
        const y = random_particlesMelody(-25, 35);
        const z = random_particlesMelody(spiral_d-5, spiral_d+5, 1);
        particle.create(b + 0.25*i, 12, "Cube", 0.5, [60, y, z], [-60, y, z]);
    }
}

staticCubeLine.flushAllEvents();

// ----------------------------- good shit bookmark -----------------------------

const random_goodshit = genSeededRandom(46253765);

const shortSpiralValidator = makeCubeLineValidator(0, 10);
const mediumSpiralValidator = makeCubeLineValidator(0, 20);
const longSpiralValidator = makeCubeLineValidator(0, 100);

function doTheTriple(beat: number, position: rm.Vec3, bigLast: boolean) {
    staticCubeLine.createSpiral(beat, SOR, 12, 1/10, 0, 1.6, position, [-random_goodshit(2, 4, 2), 0], [-9, 0], SCS, shortSpiralValidator);
    particle.createExplode(beat, 3, "Sphere", 1, 8, position, 80, 0, false);

    staticCubeLine.createSpiral(beat + 1.5, SOR, 12, 1/10, 0, 1.6, position, [-random_goodshit(2, 4, 2), 0], [6, 0], SCS, mediumSpiralValidator);
    particle.createExplode(beat + 1.5, 3, "Sphere", 1, 8, position, 80, 0, false);

    if (bigLast) staticCubeLine.createSpiral(beat + 3, SOR, 12, 1/32, 2.5, 1, position, [-random_goodshit(2, 4, 2), 0], [1, 0], SCS, longSpiralValidator);
    else         staticCubeLine.createSpiral(beat + 3, SOR, 12, 1/12, 0, 1, position, [-random_goodshit(2, 4, 2), 0], [1.5, 0], SCS, longSpiralValidator);
    particle.createExplode(beat + 3, 3, "Sphere", 1, 8, position, 80, 0, false);
}

doTheTriple(132, [9, 6, spiral_d], true);

spiralPairs([138, 138.5, 139, 139.5], [-10, -4, spiral_d]);
doTheTriple(140, [-10, -4, spiral_d], false);

spiralPairs([146, 147, 147.5], [11, 0, spiral_d]);
doTheTriple(148, [11, 0, spiral_d], true);

spiralPairs([154, 154.5, 155, 155.5], [-9, 5, spiral_d]);
doTheTriple(156, [-9, 5, spiral_d], false);


// but here's the faller
const ramdom_fallergoodshit = genSeededRandom(7624752);
const fallerStartBeats = [164, 168, 172, 176, 180]
parity = false;
fallerStartBeats.forEach(beat => {
    const x = ramdom_fallergoodshit(4, 28, 2) * (parity ? 1 : -1);
    const y = ramdom_fallergoodshit(30, 35, 2);
    const z = ramdom_fallergoodshit(30, 45, 2);

    parity = !parity;

    staticCubeLine.create(beat, 1, 4, 3, [x, y, z], [90, 180], [0, 0], 2.5, defaultCubeLineValidator);
})

parity = true;
for (let beat = 164; beat < 194; ) {

    const x = ramdom_fallergoodshit(4, 28, 2) * (parity ? 1 : -1);
    const y = ramdom_fallergoodshit(30, 35, 2);
    const z = ramdom_fallergoodshit(30, 45, 2);

    parity = !parity;

    let fallRate = 0;
    let scale = 0
    let trail = 0;

    if (beat < 179) {
        fallRate = 0.12;
        scale = 1;
        trail = 1.5;
    } else if (beat < 187) {
        fallRate = 0.09;
        scale = 1.2;
        trail = 1;
    } else {
        fallRate = 0.05;
        scale = 1.5;
        trail = 0.75;
    }

    staticCubeLine.create(beat, fallRate, trail, trail - 0.1, [x, y, z], [90, 180], [0, 0], scale, defaultCubeLineValidator);


    if (beat < 180) {
        beat += 0.5;
    } else if (beat < 188) {
        beat += 0.3;
    } else {
        beat += 0.2;
    }
}

staticCubeLine.flushAllEvents();

// ----------------------------- qorb bookmark -----------------------------

// the big stick
const ramdom_quorb = genSeededRandom(869428590248);

function createCubeLineSpan(b: number, r: number, wd: number, td: number, n: number, x: number, y: number, z: number, xScalar: number, yScalar: number, angle: number, angleScalar: number, cubeLineValidator = defaultCubeLineValidator) {
    for (let i = -n; i <= n; i++) {
        const xPos = x + xScalar*i;
        const yPos = y + yScalar*i;
        const angleOffset = i * angleScalar;

        staticCubeLine.create(b, r, wd, td, [xPos, yPos, z], [angle, 0], [angleOffset, 0], 1.2, cubeLineValidator);
    }
}
function createBigStick(beat: number, xPos: number, warnDuration: number = 2) {
    bigbars.create(beat, 6, true, 2, 5, [xPos, 36, 40]); 

    if (xPos < 25) createCubeLineSpan(beat, 1/32, warnDuration, 1, 6, xPos + 3.5, 4, 40, 0, 3.5, 0, 0.7);
    if (xPos > -25) createCubeLineSpan(beat, 1/32, warnDuration, 1, 6, xPos - 3.5, 4, 40, 0, 3.5, 180, -0.7);
    
    // for (let i = -6; i <= 6; i++) {
    //     const yPos = 4 + 3*i;
    //     const zPos = 40;
    //     const angleOffset = i * 0.7;
        
    //     if (xPos < 25) staticCubeLine.create(beat, 1/32, warnDuration, 1, [xPos + 3.5, yPos, zPos], [0, 0], [angleOffset, 0], 1.2, defaultCubeLineValidator);
    //     if (xPos > -25) staticCubeLine.create(beat, 1/32, warnDuration, 1, [xPos - 3.5, yPos, zPos], [180, 0], [-angleOffset, 0], 1.2, defaultCubeLineValidator);
    // }
}

createBigStick(196, 12, 3);
createBigStick(201, 30);
createBigStick(204, -30);
createBigStick(208, 30);

createCubeLineSpan(211, 1/32, 1.3, 1, 11.5, 0, -30, 40, 3, 0, 90, -0.6);

createBigStick(215, 30);
createBigStick(219, -30);

// the spiral thing that looks cool there
staticCubeLine.createSpiral(223.75, SOR, 12, 1/64, 0, 1.25, [10, spiral_h, spiral_d], [-ramdom_quorb(2, 4, 2), 0], [-8, 0], SCS, makeCubeLineValidator(18, 18));
staticCubeLine.createSpiral(225.5, SOR, 12, 1/64, 0, 1.5, [10, spiral_h, spiral_d], [-ramdom_quorb(2, 4, 2), 0], [1, 0], SCS, spiralValidator);

particle.createExplode(223.75, 4, "Sphere", 1, 8, [10, spiral_h, spiral_d], 80, 0, false);
particle.createExplode(225.5, 4, "Sphere", 1, 8, [10, spiral_h, spiral_d], 80, 0, false);

particle.createExplode(228, 4, "Sphere", 1, 20, [10, spiral_h, spiral_d], 80, 0, true);
particle.createExplode(228.5, 4, "Sphere", 1, 20, [10, spiral_h, spiral_d], 80, 180 / 20, true);

createBigStick(229, -30);

for (let b = 233; b < 234; b += 1/4) {
    staticCubeLine.createSpiral(b, 1/8, 2, 1/16, 0.125, 0.5, [-8, spiral_h, spiral_d], [-ramdom_quorb(60, 120, 2), 0], [-1, 0], SCS, spiralValidator);
}

createBigStick(236, 30);
createBigStick(238, -30);

createCubeLineSpan(240.5, 1/32, 1.5, 1, 6, -3, 30, 40, 12, 0, -90, 0);
createCubeLineSpan(241.5, 1/32, 1.5, 1, 6, 3, -30, 40, 12, 0, 90, 0);

staticCubeLine.flushAllEvents();

// ----------------------------- funky sounding bookmark -----------------------------

for (let sb = 244; sb < 276; sb += 8) {
    for (let b = sb; b < sb+8; b++) {
        const cube_segment_cnt = 7;
        createCubeLineSpan(b, 1/32, 0, 0.8, 7.5, 0, -30 + (b-sb)*cube_segment_cnt*1.1, 40, 6, 0, 90, 0, makeCubeLineValidator(cube_segment_cnt, cube_segment_cnt));
    }
}

// big fallers
const random_fallersStart = genSeededRandom(48609248605);
/* let */ parity = false;
for (let beat = 244; beat < 268; beat += 4) {
    const x = random_fallersStart(4, 28, 2) * (parity ? 1 : -1);
    const y = random_fallersStart(28, 33, 2);
    const z = random_fallersStart(30, 45, 2);

    parity = !parity;

    staticCubeLine.create(beat, 1, 2, 4, [x, y, z], [-90, 0], [0, 0], 2.5, defaultCubeLineValidator);
}

staticCubeLine.flushAllEvents();

// ----------------------------- good shit again but a little different bookmark -----------------------------

// oh my god this is going to be so many eventsss
const random_spam = genSeededRandom(859031850931);
const random_spiralvalidator = makeCubeLineValidator(0, 75);
/* let */ parity = false;
for (let b = 276; b <= 308; b++) {
    // make the spiral
    const start_position: Vec3 = [0, spiral_h, spiral_d];
    const start_rotation: Vec2 = [random_spam(0, 60, 0), 0];
    const step_rotation: Vec2 = [random_spam(-3, 3, 0) * 1.4, 0]; 
    staticCubeLine.createSpiral(b, SOR, 6, SCR, 1, 1.3, start_position, start_rotation, step_rotation, SCS, random_spiralvalidator);

    // make the particles (don't make on last cycle)
    if (b != 308) particle.createExplode(b, 4, "Sphere", 1, 6, start_position, 70, parity ? 30 : 0, true);
    parity = !parity
}
 
staticCubeLine.flushAllEvents();
 
// ----------------------------- qorb 2 bookmark -----------------------------

// more bick sticks waiter pleaseeee
createBigStick(313, -30);
createBigStick(316, 30);

// little guys come out of right stage
for (let b = 319; b < 320; b += 1/4) {
    staticCubeLine.createSpiral(b, 1/8, 2, 1/16, 0.125, 0.5, [8, spiral_h, spiral_d], [-ramdom_quorb(60, 120, 2), 0], [-1, 0], SCS, spiralValidator);
}

createBigStick(320, -15);

staticCubeLine.createSpiral(323, SOR, 12, 1/64, 0, 1.25, [10, spiral_h, spiral_d], [-ramdom_quorb(2, 4, 2), 0], [-8, 0], SCS, makeCubeLineValidator(18, 18));
staticCubeLine.createSpiral(324, SOR, 12, 1/64, 0, 1.5, [10, spiral_h, spiral_d], [-ramdom_quorb(2, 4, 2), 0], [1, 0], SCS, spiralValidator);

particle.createExplode(323, 4, "Sphere", 1, 8, [10, spiral_h, spiral_d], 80, 0, false);
particle.createExplode(324, 4, "Sphere", 1, 8, [10, spiral_h, spiral_d], 80, 0, false);

createBigStick(329, 30);

for (let b = 332; b < 339; b += 1/2) {
    staticCubeLine.createSpiral(b, 1/4, 2, 1/16, 0.125, 0.5, [-8, spiral_h, spiral_d], [-ramdom_quorb(70, 110, 2), 0], [-1, 0], SCS, spiralValidator);
}

createCubeLineSpan(335.5, 1/32, 1.5, 1, 6, -3, 30, 40, 12, 0, -90, 0);
createCubeLineSpan(337.5, 1/32, 1.5, 1, 6, 3, -30, 40, 12, 0, 90, 0);

staticCubeLine.flushAllEvents();

// ----------------------------- slow bookmark -----------------------------

const random_slow = genSeededRandom(426572635);
dir = -1;
staticCubeLine.createSpiral(340, SOR, 12, SCR, 4, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([343, 343.5, 344.5, 345, 346, 346.5]);
dir = 1;
staticCubeLine.createSpiral(347.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([351, 351.5, 352.5, 353.375, 353.5, 354.5, 355]);
dir = randSign(1, random_slow);
staticCubeLine.createSpiral(355.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([359, 359.5, 361.5, 363]);
dir = randSign(1, random_slow);
staticCubeLine.createSpiral(363.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([367]);
dir = -dir;
staticCubeLine.createSpiral(367.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([369.5, 370.5, 371]);
dir = -dir;
staticCubeLine.createSpiral(372, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([375, 375.5, 376.5, 377, 378, 378.5]);
dir = -dir;
staticCubeLine.createSpiral(379.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([383, 383.5, 384.5, 385.5, 386.5, 387]);
dir = -dir;
staticCubeLine.createSpiral(387.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([391]);
dir = -dir;
staticCubeLine.createSpiral(391.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

spiralPairs([394.5]);
dir = -dir;
staticCubeLine.createSpiral(395.5, SOR, 12, SCR, 0, 1.3, [0, spiral_h, spiral_d], [-random_slow(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator);

// more climbers
parity = true;
for (let beat = 372; beat < 392; beat += 4) {
    const x = random_slow(4, 28, 2) * (parity ? 1 : -1);
    const y = random_slow(30, 35, 2);
    const z = random_slow(30, 45, 2);

    parity = !parity;

    staticCubeLine.create(beat, 1, 4, 3, [x, y, z], [90, 180], [0, 0], 2.5, defaultCubeLineValidator);
}



staticCubeLine.flushAllEvents();

// ----------------------------- good shit againnn bookmark -----------------------------

// my poor fucking pc
const random_goodshitagain = genSeededRandom(859031850931);
/* let */ parity = false;
for (let b = 404; b <= 468; b++) {
    // make the spiral
    const start_position: Vec3 = [-12, spiral_h + 5, spiral_d];
    const start_rotation: Vec2 = [random_goodshitagain(0, 60, 0), 0];
    const step_rotation: Vec2 = [random_goodshitagain(-3, 3, 0) * 1.4, 0]; 
    staticCubeLine.createSpiral(b, SOR, 6, SCR, 1, 1.3, start_position, start_rotation, step_rotation, SCS, random_spiralvalidator);

    // make the particles (don't make on last cycle)
    if (b != 308) particle.createExplode(b, 4, "Sphere", 1, 6, start_position, 70, parity ? 30 : 0, true);
    parity = !parity
}

// more climbers teehee, just on the right side
for (let beat = 404; beat < 428; beat += 8) {
    const x = random_goodshitagain(4, 28, 2);
    const y = random_goodshitagain(-23, -20, 2);
    const z = random_goodshitagain(30, 45, 2);

    staticCubeLine.create(beat, 1, 4, 3, [x, y, z], [90, 0], [0, 0], 2.5, defaultCubeLineValidator);
}

// mini climbers teehee
parity = true;
for (let beat = 436.5; beat < 460; beat += 8) {
    const x = random_goodshitagain(4, 28, 2);
    const y = random_goodshitagain(-23, -20, 2);
    const z = random_goodshitagain(30, 45, 2);

    const x2 = x + (parity ? 2 : -2);
    const y2 = y + random_goodshitagain(-0.5, 1);
    const z2 = z + random_goodshitagain(-0.2, 0.2, 1);

    parity = !parity;
    
    staticCubeLine.create(beat, 1, 4, 3, [x, y, z], [90, 0], [0, 0], 1.5, defaultCubeLineValidator);
    staticCubeLine.create(beat + 0.25, 1, 4, 3, [x2, y2, z2], [90, 0], [0, 0], 1.5, defaultCubeLineValidator);
}


staticCubeLine.flushAllEvents();

// ----------------------------- qorb out bookmark -----------------------------

// i am starting to hate these big sticks...
createBigStick(473, -30);
createBigStick(476, 30);
createBigStick(480, -15);

// more little guys from right stage
for (let b = 481; b < 482; b += 1/4) {
    staticCubeLine.createSpiral(b, 1/8, 2, 1/16, 0.125, 0.5, [8, spiral_h, spiral_d], [-ramdom_quorb(60, 120, 2), 0], [-1, 0], SCS, spiralValidator);
}

// celebration from the ground
createCubeLineSpan(483, 1/32, 1.3, 1, 11.5, 0, -30, 40, 3, 0, 90, -0.6);

createBigStick(487, -30);
createBigStick(489, 30);
createBigStick(492, -30);


// the spiral thing that looks cool there
staticCubeLine.createSpiral(495.75, SOR, 12, 1/64, 0, 1.25, [10, spiral_h, spiral_d], [-ramdom_quorb(2, 4, 2), 0], [-8, 0], SCS, makeCubeLineValidator(18, 18));
staticCubeLine.createSpiral(497.5, SOR, 12, 1/64, 0, 1.5, [10, spiral_h, spiral_d], [-ramdom_quorb(2, 4, 2), 0], [1, 0], SCS, spiralValidator);

particle.createExplode(495.75, 4, "Sphere", 1, 8, [10, spiral_h, spiral_d], 80, 0, false);
particle.createExplode(497.5, 4, "Sphere", 1, 8, [10, spiral_h, spiral_d], 80, 0, false);

for (let beat = 499; beat < 500; beat += 1/8) {
    particle.createExplode(beat, 4, "Sphere", 1, 10, [10, spiral_h, spiral_d], 80, (360 / 10) * (beat - 499), true);
}

createBigStick(500, -30);

// smol little melody
bigbars.create(501, 2, true, 2, 3, [8, 36, 40]); 
bigbars.create(502.25, 2, true, 2, 2, [19, 36, 40]); 
bigbars.create(502.5, 2, true, 2, 3, [13, 36, 40]); 

bigbars.create(503.25, 2, true, 2, 3, [-9, 36, 40]); 
bigbars.create(503.75, 2, true, 2, 3, [-15, 36, 40]); 
bigbars.create(504.25, 2, true, 2, 3, [-21, 36, 40]); 


createBigStick(505, 15);
createBigStick(508, -30);
createBigStick(512, 30);

// celebration from the ground AGAIN???
createCubeLineSpan(515, 1/32, 1.3, 1, 11.5, 0, -30, 40, 3, 0, 90, -0.6);

createBigStick(519, -30);

// more little guys from right stage
for (let b = 520.25; b < 521; b += 1/4) {
    staticCubeLine.createSpiral(b, 1/8, 2, 1/16, 0.125, 0.5, [8, spiral_h, spiral_d], [-ramdom_quorb(60, 120, 2), 0], [-1, 0], SCS, spiralValidator);
}
staticCubeLine.createSpiral(521.75, 0, 2, 1/16, 0.125, 0.5, [8, spiral_h, spiral_d], [-ramdom_quorb(60, 120, 2), 0], [-1, 0], SCS, spiralValidator);

createBigStick(524, -30);

bigbars.create(525.75, 2, true, 2, 2, [8, 36, 40]); 
bigbars.create(526.25, 2, true, 2, 3, [14, 36, 40]); 
bigbars.create(527, 2, true, 2, 3, [20, 36, 40]); 



staticCubeLine.flushAllEvents();

// ----------------------------- out out bookmark -----------------------------

// oh my god were so closeeeee
// the final spiral
dir = 1;
staticCubeLine.createSpiral(528, 1/7 /*4 / (54-1)*/, 7 * 16, SCR, 0, 1.3, [0, spiral_h, spiral_d + 10], [-random_spiralsMelody(2, 4, 2), 0], [1.5*dir, 0], SCS, spiralValidator, -23.25);

// and big cubes for the sake of em
parity = false;
for (let beat = 546; beat < 562; beat += 0.75) {
    let b = beat;
    if (b == 553.25) b = 553;
    if (b == 560.75) b = 561;
    
    const x = random_spiralsMelody(5, 30, 2) * (parity ? 1 : -1);
    const y = random_spiralsMelody(-20, -15, 2);
    const z = random_spiralsMelody(35, 40, 2);

    parity = !parity;

    particle.create(b, 4, "Cube", 3, [x, y, z], [x, y + 50, z], true);
}

staticCubeLine.flushAllEvents();

// ----------- { POSTPROCESSING } -----------

 
console.log("Begin Post Processsing")

// safety
staticCubeLine.flushAllEvents();

// some rounding
for (const key in map.pointDefinitions) {
    const pointDef: rm.ComplexPointsVec3  = map.pointDefinitions[key] as rm.ComplexPointsVec3 ;

    for (let p = 0; p < pointDef.length; p++) {
        for (let v = 0; v < pointDef[p].length; v++) {
            const val = pointDef[p][v];
            if (typeof val == "number") {
                pointDef[p][v] = round(val, 3);
            }
        }
    }
}

// clump lights
map.lightEvents.sort((a, b) => a.beat < b.beat ? -1 : a.beat > b.beat ? 1 : 0);

let lastEventBeat: number = map.lightEvents[0].beat;
let lastEventIdex = 0;
for (let i = 1; i < map.lightEvents.length; i++) {
    const currentEventBeat = map.lightEvents[i].beat;

    if (currentEventBeat != lastEventBeat) {
        if (i - lastEventIdex > 1) {
            // clump, and reduce index by ammount of redundant events removed
            const processedCount = processEventBatch(lastEventIdex, i);
            i -= processedCount;
            lastEventIdex -= processedCount;
        }

        // update
        lastEventBeat = currentEventBeat;
        lastEventIdex = i;
    }
}

function processEventBatch(startIndex: number, endIndex: number): number {
    let clumpedCount: number = 0;

    const uniqueEvents: number[] = [];
    for (let i = startIndex; (i + clumpedCount) < endIndex; i++) {
        const matchIndex = findSameEvent(uniqueEvents, map.lightEvents[i]);
        if (matchIndex == -1) {
            // the event wasn't a "repeat" so we log it
            if (map.lightEvents[i].unsafeCustomData.lightID != undefined) uniqueEvents.push(i);

        } else {
            // clump the event
            clumpedCount++;

            if (map.lightEvents[matchIndex].unsafeCustomData.lightID != undefined) {
                map.lightEvents[matchIndex].unsafeCustomData.lightID = rm.complexifyLightIDs(map.lightEvents[matchIndex].unsafeCustomData.lightID as rm.LightID).concat(map.lightEvents[i].unsafeCustomData.lightID as rm.LightID)

                // remove redundant instance
                map.lightEvents.splice(i, 1);
                i--;
            }
        }
    }

    return clumpedCount;
}

function findSameEvent(uniqueEvents: number[], event: rm.LightEvent): number {
    for (const uniqueIndex of uniqueEvents) {
        const event2 = map.lightEvents[uniqueIndex];

        if (
            event.beat == event2.beat &&
            event.type == event2.type &&
            event.value == event2.value &&
            event.floatValue == event2.floatValue &&
            compareColors(event.unsafeCustomData.color, event2.unsafeCustomData.color)
        ) {
            return uniqueIndex;
        }
    }
    return -1;
}

function compareColors(a: rm.ColorVec | undefined, b: rm.ColorVec | undefined): boolean {
    if (a == undefined && b == undefined) return true;
    if (a == undefined || b == undefined) return false;

    if (a.length == 3 && b.length == 3) {
        return a[0] == b[0] && a[1] == b[1] && a[2] == b[2];
    }
    else if (a.length == 4 && b.length == 4) {
        return a[0] == b[0] && a[1] == b[1] && a[2] == b[2] && a[3] == b[3];
    }
    return false;
}


// ----------- { OUTPUT } -----------



map.suggest("Chroma");

console.log("TotalCubbbbeeeee: " + staticCubeLine.effectiveParticleTracker + " (" + staticCubeLine.scList.length + " / " + staticCubeLine.scPointList.length + ")");
console.log("TotalParticlesss: " + particle.effectiveParticleTracker + " (" + particle.scList.length + ")");
console.log("TotalLightEvents: " + map.lightEvents.length + " (" + totalLightCount + " / " + (totalIndexedLightCount) + ")");

pipeline.export({
    outputDirectory: "../OutputMaps/Cascade"
})
