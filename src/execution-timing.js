import {curve} from './motion.js';
import {accentExecution} from './execution-rhythm.js';
import {gravitasTime} from './gravitas.js';
// GRAVITAS clock: every execution keeps its authored beat order in u-space, while the
// wall clock is warped per beat (anticipation breathes, the blow snaps, contact dwells,
// the recoil settles) and the kill is followed by a hold and a slow rise. The impact
// lands at exactly def.gravitas.pre seconds; the timeline ends at def.duration.
export function executionTime(seconds,def){
 if(def.gravitas)return gravitasTime(seconds,def);
 if(def.bespoke)return Math.min(seconds,def.duration);
 const u=Math.min(1,seconds/def.duration),I=def.impact,release=.18/def.duration;
 return accentExecution(curve([[0,0],[I-.23,I-.23],[I-release,I-.14],[I,I],[1,1]],u),def)*def.duration;
}
