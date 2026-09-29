// Shared-clock accents: both skeletons, contacts, roots and event triggers sample
// the same monotonic time. No pose-only warping or blanket playback-rate change.
export const EXECUTION_BEATS={
 'soulbreaker':[.19,.53],'grave-driver':[.20,.32],'crown-of-ruin':[.24,.63],
 'hells-guillotine':[.20,.67],'tyrants-verdict':[.20,.44,.65],
 'furnace-heart':[.23,.75],'cinder-spiral':[.18,.57],
 'infernal-pillar':[.22,.42],'meteor-burial':[.22,.51],
 'ashen-cross':[.25,.49],'pyre-king':[.22,.46],
 'mindbreaker':[.25,.48],'gravity-coffin':[.30,.46,.59],
 'orbit-of-ruin':[.24],'heavens-rejection':[.23],
 'rift-fold':[.29,.62],'wraith-procession':[.25,.39,.53],
 'soul-sever':[.22,.48],'pale-requiem':[.22,.49],
 'tomb-of-echoes':[.29,.55],
 'kingbreaker':[.16,.39,.56],'throne-of-cinders':[.17,.65,.75],
 'sovereigns-ruin':[.17,.29,.56,.72]
};
// Continuous drags and the older close-retargeted brand/kick tracks retain
// their authored travel cadence; accelerating their roots creates catch-up snaps.
const continuous=new Set(['cinder-spiral','throne-of-cinders','ember-pendulum','ashen-cross','pyre-king']);
const cache=new WeakMap();
export function accentExecution(u,def){
 if(continuous.has(def.id))return u;
 let windows=cache.get(def);
 if(!windows){
  const beats=[...new Set((EXECUTION_BEATS[def.id]||def.hits?.map(h=>h[0])||[]).filter(t=>t>.07&&t<=def.impact-.23))].sort((a,b)=>a-b);
  windows=beats.map((b,i)=>[Math.max(.045,b-Math.min(.115,.34/def.duration),(beats[i-1]||0)+.01),b]);cache.set(def,windows);
 }
 for(const[a,b]of windows)if(u>a&&u<b){const x=(u-a)/(b-a);return u-(b-a)*.20*Math.sin(Math.PI*x)**2;}
 return u;
}
