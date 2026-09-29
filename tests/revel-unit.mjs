import assert from 'node:assert/strict';import{whipTime}from'../src/motion.js';import fs from 'node:fs';
// Endpoints and contact clock are preserved exactly; anticipation accelerates
// into impact, then the release snaps and settles.
for(const impact of[.4,.42,.52,.59,.525,.75]){assert.equal(whipTime(0,impact),0);assert.ok(Math.abs(whipTime(1,impact)-1)<1e-12);assert.ok(Math.abs(whipTime(impact,impact)-impact)<1e-9,{impact});let prev=-1;for(let u=0;u<=1.0001;u+=1/240){const v=whipTime(u,impact);assert.ok(v>=prev-1e-12,'monotonic');prev=v;assert.ok(Number.isFinite(v));}}
assert.ok(whipTime(.21,.42)<.42*.5,'anticipation lags linear time');
assert.ok(whipTime(.35,.42)>.42*.6,'swing catches up pre-contact');
assert.ok(whipTime(.5,.42)-whipTime(.48,.42)>.01,'post-impact snap');
assert.ok(whipTime(.99,.42)-whipTime(.97,.42)<.0001,'settle damp');
fs.writeFileSync('tests/revel-unit-results.json',JSON.stringify({whip:'PASS: endpoints/contact/monotonicity/anticipation/snap/settle for 6 impact clocks'},null,2));console.log('whipTime contract PASS');
