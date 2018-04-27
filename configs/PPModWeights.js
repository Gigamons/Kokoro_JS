const m = require('../common').Mods.modConst;
// 1.00 means its not affected by default ModPP Weighting.
const ppdrain = {
    None: 1.00,
	NoFail: 1.00,
	Easy: 1.50, // Easymod need more PP
	Hidden: 2.00,
	HardRock: 1.00,
	SuddenDeath: 1.00,
	DoubleTime: 0.75,
	Relax: 1.00,
	HalfTime: 1.00,
	Flashlight: 1.00,
	Autoplay: 1.00,
	SpunOut: 1.00,
	Relax2: 1.00,
	Perfect: 1.00,
	Key4: 1.00,
	Key5: 1.00,
	Key6: 1.00,
	Key7: 1.00,
	Key8: 1.00,
	keyMod: 1.00,
	FadeIn: 1.00,
	Random: 1.00,
	LastMod: 1.00,
	Key9: 1.00,
	Key10: 1.00,
	Key1: 1.00,
	Key3: 1.00,
	Key2: 1.00
}

function drainMod(mods = 0) {
    let pdrain = [ppdrain.None];
    let drain = ppdrain.None;
    if(mods & m.NoFail){
        pdrain.push(ppdrain.NoFail);
    }
    if(mods & m.Easy){
        pdrain.push(ppdrain.Easy);
    }
    if(mods & m.Hidden){
        pdrain.push(ppdrain.Hidden);
    }
    if(mods & m.HardRock){
        pdrain.push(ppdrain.HardRock);
    }
    if(mods & m.SuddenDeath){
        pdrain.push(ppdrain.SuddenDeath);
    }
    if(mods & m.DoubleTime){
        pdrain.push(ppdrain.DoubleTime);
    }
    if(mods & m.Relax){
        pdrain.push(ppdrain.Relax);
    }
    if(mods & m.HalfTime){
        pdrain.push(ppdrain.HalfTime);
    }
    if(mods & m.Flashlight){
        pdrain.push(ppdrain.Flashlight);
    }
    if(mods & m.Autoplay){
        pdrain.push(ppdrain.Autoplay);
    }
    if(mods & m.SpunOut){
        pdrain.push(ppdrain.SpunOut);
    }
    if(mods & m.Relax2){
        pdrain.push(ppdrain.Relax2);
    }
    if(mods & m.Perfect){
        pdrain.push(ppdrain.Perfect);
    }
    if(mods & m.Key4){
        pdrain.push(ppdrain.Key4);
    }
    if(mods & m.Key5){
        pdrain.push(ppdrain.Key5);
    }
    if(mods & m.Key6){
        pdrain.push(ppdrain.Key6);
    }
    if(mods & m.Key7){
        pdrain.push(ppdrain.Key7);
    }
    if(mods & m.Key8){
        pdrain.push(ppdrain.Key8);
    }
    if(mods & m.keyMod){
        pdrain.push(ppdrain.keyMod);
    }
    if(mods & m.FadeIn){
        pdrain.push(ppdrain.FadeIn);
    }
    if(mods & m.Random){
        pdrain.push(ppdrain.Random);
    }
    if(mods & m.LastMod){
        pdrain.push(ppdrain.LastMod);
    }
    if(mods & m.Key9){
        pdrain.push(ppdrain.Key9);
    }
    if(mods & m.Key10){
        pdrain.push(ppdrain.Key10);
    }
    if(mods & m.Key1){
        pdrain.push(ppdrain.Key1);
    }
    if(mods & m.Key3){
        pdrain.push(ppdrain.Key3);
    }
    if(mods & m.Key2){
        pdrain.push(ppdrain.Key2);
    }
    let cdrain = 1;
    for (let i = 0; i < pdrain.length; i++) {
        const element = pdrain[i];
        cdrain = cdrain * element;
    }
    return cdrain;
}

module.exports = drainMod;