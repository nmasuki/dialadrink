require('./helpers/polyfills.js')
var seq = Math.sequence(-100.0, 10.0, x => x * 3.1 / 24.0).map(i => (new Date()).addDays(i).since());
//console.log(seq.join('\r\n'))
console.log("\n", new Date('1988-04-04').since(), "\n", new Date('1986-06-22').since())