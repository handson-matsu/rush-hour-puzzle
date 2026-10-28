import {solve,occupied} from '../engine.js';import {writeFileSync} from 'node:fs';
let seed=78291;const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*n);};
const bins=[[],[],[]],seen=new Set();let attempts=0;
while(bins.some(b=>b.length<10)){
 attempts++;const cars=[{id:'A',axis:'h',lane:2,length:2}],state=[rand(4)];
 for(let t=0;t<55&&cars.length<13;t++){
 const c={id:String.fromCharCode(65+cars.length),axis:rand(2)?'h':'v',lane:rand(6),length:rand(4)?2:3},p=rand(7-c.length);
 try{occupied([...cars,c],[...state,p]);cars.push(c);state.push(p);}catch{}
 }
 const path=solve(cars,state);if(!path)continue;const d=path.length,b=d>=4&&d<=8?0:d>=10&&d<=16?1:d>=19?2:-1;
 if(b<0||bins[b].length===10)continue;
 const signature=JSON.stringify([cars,state]);if(seen.has(signature))continue;seen.add(signature);
 bins[b].push({id:`${['easy','medium','hard'][b]}-${bins[b].length+1}`,level:b,cars,state,optimal:d});
 console.log(attempts,b,d);
}
writeFileSync('puzzles.js',`// Fixed layouts generated with seed 78291; verified by BFS.\nexport const puzzles = ${JSON.stringify(bins.flat(),null,2)};\n`);
