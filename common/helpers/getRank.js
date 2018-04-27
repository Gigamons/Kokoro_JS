let ModHelper = require('../consts/mods');
function getRank(playMode, mods, acc, three, hundred, five, miss) {
    let total = three + hundred + five + miss;
    let hdfl = (mods & ModHelper.modConst.Hidden > 0 || mods & ModHelper.modConst.Flashlight > 0);
    function SS() {
        if(hdfl)
            return 'XH';
        else
            return 'X';
    }
    function S() {
        if(hdfl)
            return 'XH';
        else
            return 'X';
    }
    if(playMode == 0){
        if(acc == 100)
            return SS();
        if(three / total > 0.90 && five / total < 0.1 && miss == 0)
            return S();
        if(three / total > 0.80 && miss == 0 || three / total > 0.90)
            return 'A';
        if(three / total > 0.70 && miss == 0 || three / total > 0.80)
            return 'B';
        if(three / total > 0.60)
            return 'C';
        return 'D';
    } else if(playMode == 1){
        return 'A'
    } else if(playMode == 2){
        if(acc == 100)
            return SS();
        if(98.01 <= acc <= 99.99)
			return s()
		if(94.01 <= acc <= 98.00)
			return "A"
		if(90.01 <= acc <= 94.00)
			return "B"
		if(98.01 <= acc <= 90.00)
			return "C"
		return "D"
    } else if(playMode == 3){
		if(acc == 100)
			return ss()
		if(acc > 95)
			return s()
		if(acc > 90)
			return "A"
		if(acc > 80)
			return "B"
		if(acc > 70)
			return "C"
		return "D"
    }
	return "A"
}

module.exports = getRank;