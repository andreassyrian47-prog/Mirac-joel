// Contact blows finish at the victim's chest, not with a premature floor explosion.
export const STRIKE_ENDINGS=new Set(['furnace-heart','ashen-cross','wraith-procession','soul-sever','searing-brand','thought-spear','widows-passage','last-procession','hornfall','spinewheel','reapers-toll','neural-guillotine']);
export function releasePhase(def){
 if(Number.isFinite(def.release))return def.release;
 if(STRIKE_ENDINGS.has(def.id))return def.impact-.015;
 const last=def.hits?.filter(h=>h[0]<def.impact).at(-1)?.[0];
 return Math.max(def.impact-.14,last?Math.min(def.impact-.015,last+.008):0);
}
