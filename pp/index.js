const common = require('../common');
const childprocess = require('child_process');
const path = require('path');
const wfp2 = require('wifipiano2');
const fs = require('fs');
const noppai = require('noppai');


const playModes = common.playModes;
const mysql = common.MySQLManager;

function calcacc(d, h, f, m, k, g, mode) {
    let thp;
    let th;
    let acc;
    switch (mode) {
        case playModes.osu:
            thp = (f * 50 + h * 100 + d * 300)
            th = m + f + d + h;
            acc = thp / (th * 300)
            return acc * 100;
            break;
        case playModes.taiko:
            thp = (h * 50 + d * 100);
            th = (m + h + d);
            acc = thp / (th * 100);
            return acc * 100;
            break;
        case playModes.ctb:
            thp = d + h + f
            th = thp + m + k
            acc = thp / th;
            return acc * 100;
            break;
        case playModes.mania:
            thp = f * 50 + h * 100 + k * 200 + d * 300 + g * 300
            th = m + f + h + d + g + k
            acc = thp / (th * 300)
            return acc * 100;
            break;
        default:
            return 0;
            break;
    }
}

function oppai(param = { beatmaphash: '', accuracy: 1, mods: 0, three: 0, hundred: 0, five: 0, miss: 0, maxcombo: 0, taiko: false }) {
    return new Promise(async (resolve, reject) => {
        resolve(0);
    });
}

async function wifipiano2() {

}

function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    })
}

module.exports = {
    calcacc,
    oppai
}