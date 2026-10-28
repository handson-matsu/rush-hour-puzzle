// A state contains the variable coordinate of every car. Red exits at coordinate 6.
export const key = s => s.join('');
export function occupied(cars,s){
 const grid=Array(36).fill(-1);
 cars.forEach((c,i)=>{if(s[i]===6&&i===0)return;for(let k=0;k<c.length;k++){
 const x=c.axis==='h'?s[i]+k:c.lane,y=c.axis==='v'?s[i]+k:c.lane;
 if(x<0||x>5||y<0||y>5||grid[y*6+x]!==-1)throw Error('Invalid board');grid[y*6+x]=i;
 }});return grid;
}
export function moves(cars,s){
 if(s[0]===6)return [];const g=occupied(cars,s),out=[];
 cars.forEach((c,i)=>{for(const dir of [-1,1]){for(let p=s[i]+dir;p>=0&&p<=6-c.length;p+=dir){
 const edge=dir<0?p:p+c.length-1,cell=c.axis==='h'?c.lane*6+edge:edge*6+c.lane;
 if(g[cell]!==-1&&g[cell]!==i)break;out.push({car:i,to:p});
 }}
 if(i===0){let clear=true;for(let x=s[0]+c.length;x<6;x++)if(g[c.lane*6+x]!==-1)clear=false;
 if(clear)out.push({car:0,to:6});}
 });return out;
}
export function apply(s,m){const next=s.slice();next[m.car]=m.to;return next;}
export function solve(cars,start){
 const queue=[start],parents=[null],steps=[null],seen=new Set([key(start)]);
 for(let head=0;head<queue.length;head++){
 const s=queue[head];if(s[0]===6){const path=[];for(let n=head;parents[n]!==null;n=parents[n])path.push(steps[n]);return path.reverse();}
 for(const m of moves(cars,s)){const t=apply(s,m),k=key(t);if(seen.has(k))continue;seen.add(k);queue.push(t);parents.push(head);steps.push(m);}
 }return null;
}
export class Game{
 constructor(p){this.cars=p.cars;this.initial=p.state.slice();this.state=p.state.slice();this.history=[];}
 get count(){return this.history.length;}
 move(m){if(!moves(this.cars,this.state).some(n=>n.car===m.car&&n.to===m.to))return false;this.history.push(this.state);this.state=apply(this.state,m);return true;}
 undo(){if(this.history.length)this.state=this.history.pop();}
 reset(){this.state=this.initial.slice();this.history=[];}
}
