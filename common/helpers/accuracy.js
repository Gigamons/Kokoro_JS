const playModes = require('../consts/playModes');

function calcacc(d, h, f, m, k, g, mode){
  let thp;
  let th;
  let acc;
  switch(mode){
      case playModes.osu:
          thp = (f*50 + h*100 + d*300)
          th = m+f+d+h;
          acc = thp/(th*300)
          return acc*100;
          break;
      case playModes.taiko:
          thp = (h*50 + d*100);
          th = (m+h+d);
          acc = thp/(th*100);
          return acc*100;
          break;
      case playModes.ctb:
          thp = d+h+f
          th = thp+m+k
          acc = thp / th;
          return acc*100;
          break;
      case playModes.mania:
          thp = f*50+h*100+k*200+d*300+g*300
          th = m+f+h+d+g+k
          acc = thp/(th*300)
          return acc*100;
          break;
      default:
          return 0;
          break;
  }
}

module.exports = calcacc;