import { test } from 'node:test';
import assert from 'node:assert/strict';
import { burstConfetti } from './confetti';

function fixture() {
  const particles: { style: Record<string,string>; remove:()=>void; animate:(_frames:unknown,options:{duration:number})=>unknown }[] = [];
  const animations: { onfinish: null | (()=>void); cancel:()=>void }[] = [];
  let cancelled = 0;
  const durations: number[] = [];
  const host = {
    ownerDocument: { createElement: () => {
      const particle = { style:{}, remove:()=>{ const index=particles.indexOf(particle); if(index>=0)particles.splice(index,1); },
        animate: (_frames:unknown,options:{duration:number}) => {
          durations.push(options.duration);
          const animation = { onfinish:null as null | (()=>void), cancel:()=>{cancelled++;} };
          animations.push(animation);return animation;
        } };
      return particle;
    } },
    appendChild: (particle:typeof particles[number])=>particles.push(particle),
    replaceChildren: ()=>{particles.splice(0);},
  };
  return { host:host as unknown as HTMLDivElement,particles,animations,durations,cancelled:()=>cancelled };
}
test('reduced-motion preference suppresses the entire confetti burst',()=>{
 const f=fixture(); const cleanup=burstConfetti(f.host,true,{width:1536,height:1024});
 assert.equal(f.particles.length,0);assert.equal(f.animations.length,0);cleanup();
});
test('single burst comes from both upper corners, lasts 2–3 seconds and cleans up on completion',()=>{
 const f=fixture(); const cleanup=burstConfetti(f.host,false,{width:1536,height:1024});
 assert.equal(f.particles.length,56);
 assert.deepEqual(new Set(f.particles.map(p=>p.style.left)),new Set(['8%','92%']));
 assert.ok(f.durations.every(duration=>duration>=2100&&duration<2750));
 f.animations.forEach(animation=>animation.onfinish?.());
 assert.equal(f.particles.length,0);assert.equal(f.cancelled(),56);
 cleanup();assert.equal(f.cancelled(),56);
});
test('early dismissal cancels active animations and removes every particle',()=>{
 const f=fixture();const cleanup=burstConfetti(f.host,false,{width:390,height:844});
 cleanup();cleanup();assert.equal(f.particles.length,0);assert.equal(f.cancelled(),56);
});
