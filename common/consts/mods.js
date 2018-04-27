const modConst = {
    None: 0,
	NoFail: 1,
	Easy: 2,
	TouchDevice: 4,
	Hidden: 8,
	HardRock: 16,
	SuddenDeath: 32,
	DoubleTime: 64,
	Relax: 128,
	HalfTime: 256,
	Nightcore: 512,
	Flashlight: 1024,
	Autoplay: 2048,
	SpunOut: 4096,
	Relax2: 8192,
	Perfect: 16384,
	Key4: 32768,
	Key5: 65536,
	Key6: 131072,
	Key7: 262144,
	Key8: 524288,
	keyMod: 1015808,
	FadeIn: 1048576,
	Random: 2097152,
	LastMod: 4194304,
	Key9: 16777216,
	Key10: 33554432,
	Key1: 67108864,
	Key3: 134217728,
	Key2: 268435456
}

function getMods(mods){
    const m = modConst;
    let r = '';
    if(mods & m.NoFail)
        r += 'NF';
    if(mods & m.Easy)
        r += 'EZ';
    if(mods & m.TouchDevice)
        r += 'TD';
    if(mods & m.Hidden)
        r += 'HD';
    if(mods & m.HardRock)
        r += 'HR';
    if(mods & m.SuddenDeath)
        r += 'SD';
    if(mods & m.DoubleTime)
        r += 'DT';
    if(mods & m.Relax)
        r += 'RX';
    if(mods & m.HalfTime)
        r += 'HT';
    if(mods & m.Nightcore){
        r += 'NC';
        r = r.replace('DT', '');
    }
    if(mods & m.Flashlight)
        r += 'FL';
    if(mods & m.Autoplay)
        r += 'AP';
    if(mods & m.SpunOut)
        r += 'SO';
    if(mods & m.Relax2)
        r += 'AP';
    if(mods & m.Perfect)
        r += 'PF';
    if(mods & m.Key4)
        r += '4K';
    if(mods & m.Key5)
        r += '5K';
    if(mods & m.Key6)
        r += '6K';
    if(mods & m.Key7)
        r += '7K';
    if(mods & m.Key8)
        r += '8K';
    if(mods & m.keyMod)
        r += '';
    if(mods & m.FadeIn)
        r += 'FD';
    if(mods & m.Random)
        r += 'RD';
    if(mods & m.LastMod)
        r += 'CN';
    if(mods & m.Key9)
        r += '9K';
    if(mods & m.Key10)
        r += '10K';
    if(mods & m.Key1)
        r += '1K';
    if(mods & m.Key3)
        r += '3K';
    if(mods & m.Key2)
        r += '2K';
    
    if(Buffer.byteLength(r) > 0){
        return '+'+r;
    } else {
        return '';
    }
}

module.exports = {
    modConst,
    getMods
}