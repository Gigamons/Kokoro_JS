let ms = 1;
let Secound = ms*1000;
let Minute = Secound*60;
let Hour = Minute*60;
let Day = Hour*24;
let Week = Day*7;
let Month = Week*4;
let Year = Month*12;


function length(string) {
    return new Buffer(String(string)).byteLength;
}

function PythonTime() {
    let currentdate = new Date().valueOf();
    let date = String(currentdate);
    let pythontime = Number(date.substring(0, (length(date)-3)))
    return pythontime;
}

module.exports = {
    date: new Date(),
    ms,
    Secound,
    Minute,
    Hour,
    Day,
    Week,
    Month,
    Year,
    PythonTime: PythonTime(), // We dont have to pass the function, a variable is fair enough
    currenttime: new Date().getTime()
}