import {Game,moves} from './engine.js';import {puzzles} from './puzzles.js';
const $=id=>document.getElementById(id),colors=['#d62f42','#2672a2','#9b6425','#6e4ba0','#16796d','#a24272','#4f6c2c','#3f6091','#a45029','#536876','#84622d','#655183','#207e83'];
let index=0,game,drag=null,worker=null,hintMove=null,sound=false,audio,escapeAnimation=null;
function tone(clear=false){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();(clear?[523,659,784,1047]:[220,300]).forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*(clear?.12:.035);o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+.18);});}catch{}}
function cancelHint(){worker?.terminate();worker=null;hintMove=null;$('hint').disabled=false;}
function load(i){cancelEscape();cancelHint();drag=null;index=i;game=new Game(puzzles[i]);$('success').close();$('level').value=puzzles[i].level;options();$('puzzle').value=i;render();}
function options(){const l=Number($('level').value);$('puzzle').replaceChildren(...puzzles.map((p,i)=>{if(p.level!==l)return null;const o=document.createElement('option');o.value=i;o.textContent=`問題 ${i%10+1}`;return o;}).filter(Boolean));}
function position(el,c,p){el.style.left=`${(c.axis==='h'?p:c.lane)*100/6}%`;el.style.top=`${(c.axis==='v'?p:c.lane)*100/6}%`;el.style.width=`${(c.axis==='h'?c.length:1)*100/6}%`;el.style.height=`${(c.axis==='v'?c.length:1)*100/6}%`;}
function render(){const b=$('board');b.replaceChildren();game.cars.forEach((c,i)=>{if(game.state[i]===6)return;const el=document.createElement('button');el.className='car';el.style.setProperty('--color',colors[i%colors.length]);el.textContent=c.id;el.dataset.car=i;el.setAttribute('aria-label',`${c.id}、${c.axis==='h'?'横向き':'縦向き'}、${c.length}マス`);position(el,c,game.state[i]);el.onpointerdown=e=>start(e,i);el.onkeydown=e=>keyboard(e,i);if(hintMove?.car===i)el.classList.add('hinted');b.append(el);});
 if(hintMove){const c=game.cars[hintMove.car],el=document.createElement('div');el.className='destination';position(el,c,Math.min(hintMove.to,4));el.textContent=c.axis==='h'?(hintMove.to>game.state[hintMove.car]?'→':'←'):(hintMove.to>game.state[hintMove.car]?'↓':'↑');b.append(el);}
 $('count').textContent=game.count;$('undo').disabled=!game.count;$('hint').disabled=game.state[0]===6||!!worker;$('status').textContent=game.state[0]===6?'脱出成功！ 戻す・最初からで再挑戦できます。':'車をドラッグして動かそう。';}
// Visual-only exit: the logical move is already recorded once by Game.move.
function cancelEscape(){
 if(!escapeAnimation)return;
 const pending=escapeAnimation;escapeAnimation=null;
 pending.animation.cancel();pending.car.remove();
 $('board').removeAttribute('aria-busy');
}
function escape(car,from){
 position(car,game.cars[0],from);
 car.classList.add('escaping');car.disabled=true;
 car.removeAttribute('data-car');car.setAttribute('aria-hidden','true');
 $('board').append(car);$('board').setAttribute('aria-busy','true');
 $('board').querySelectorAll('.car').forEach(el=>el.disabled=true);
 $('status').textContent='赤い車が脱出中…';
 const animation=car.animate([
  {left:`${from*100/6}%`},
  {left:'110%'}
 ],{duration:800,easing:'cubic-bezier(.25,.1,.35,1)',fill:'forwards'});
 const pending={animation,car};escapeAnimation=pending;
 animation.finished.then(()=>{
  if(escapeAnimation!==pending)return;
  escapeAnimation=null;car.remove();$('board').removeAttribute('aria-busy');
  render();tone(true);win();
 }).catch(()=>{/* Undo/reset/problem changes cancel the pending celebration. */});
}
function commit(m){
 if(escapeAnimation)return;
 const red=$('board').querySelector('[data-car="0"]');
 const from=red?parseFloat(red.style.left)*6/100:game.state[0];
 const visual=red?.cloneNode(true);
 cancelHint();
 if(game.move(m)){
  render();
  if(game.state[0]===6)escape(visual,from);else tone();
 }else render();
}
function start(e,i){if(drag||e.button!==0||game.state[0]===6)return;e.preventDefault();cancelHint();const legal=moves(game.cars,game.state).filter(m=>m.car===i).map(m=>m.to===6?5:m.to);legal.push(game.state[i]);const c=game.cars[i],el=e.currentTarget;drag={i,el,id:e.pointerId,origin:game.state[i],start:c.axis==='h'?e.clientX:e.clientY,cell:$('board').getBoundingClientRect().width/6,min:Math.min(...legal),max:Math.max(...legal),legal,current:game.state[i]};el.setPointerCapture(e.pointerId);el.onpointermove=move;el.onpointerup=finish;el.onpointercancel=cancel;el.onlostpointercapture=()=>{if(drag)cancel();};}
function move(e){if(!drag||e.pointerId!==drag.id)return;const c=game.cars[drag.i],v=c.axis==='h'?e.clientX:e.clientY;drag.current=Math.max(drag.min,Math.min(drag.max,drag.origin+(v-drag.start)/drag.cell));position(drag.el,c,drag.current);}
function finish(e){if(!drag||e.pointerId!==drag.id)return;move(e);const d=drag;drag=null;const to=d.legal.reduce((a,b)=>Math.abs(b-d.current)<Math.abs(a-d.current)?b:a,d.origin);commit({car:d.i,to:d.i===0&&to===5?6:to});}
function cancel(){drag=null;render();}
function keyboard(e,i){if(escapeAnimation||game.state[0]===6)return;const c=game.cars[i],dir=c.axis==='h'?{ArrowLeft:-1,ArrowRight:1}[e.key]:{ArrowUp:-1,ArrowDown:1}[e.key];if(!dir)return;e.preventDefault();const legal=moves(game.cars,game.state).filter(m=>m.car===i&&Math.sign(m.to-game.state[i])===dir).sort((a,b)=>Math.abs(a.to-game.state[i])-Math.abs(b.to-game.state[i]));if(legal.length){commit(legal[0]);$('board').querySelector(`[data-car="${i}"]`)?.focus();}}
function win(){const p=puzzles[index],difference=game.count-p.optimal;$('result').innerHTML=`あなたの移動回数：<b>${game.count}手</b><br>この問題の最短手数：<b>${p.optimal}手</b><br>最短手数との差：<b>${difference}手</b>`;$('special').textContent=difference===0?'最短手数でクリア！':'もう一度、最短ルートに挑戦しよう！';$('confetti').replaceChildren(...Array.from({length:32},(_,i)=>{const el=document.createElement('i');el.style.left=`${(i*37)%100}%`;el.style.background=colors[i%colors.length];el.style.animationDelay=`${i%7*.08}s`;return el;}));$('success').showModal();}
$('level').onchange=()=>load(Number($('level').value)*10);$('puzzle').onchange=()=>load(Number($('puzzle').value));$('undo').onclick=()=>{cancelEscape();cancelHint();game.undo();render();};$('reset').onclick=()=>{cancelEscape();cancelHint();game.reset();render();};const next=()=>load((index+1)%puzzles.length);$('next').onclick=next;$('success-next').onclick=next;$('review').onclick=()=>$('success').close();$('sound').onclick=()=>{sound=!sound;$('sound').textContent=`音 ${sound?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',sound);if(sound)tone();};
$('hint').onclick=()=>{cancelHint();$('hint').disabled=true;$('status').textContent='現在の盤面から最短の一手を探索中…';worker=new Worker(new URL('./solver-worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{worker.terminate();worker=null;hintMove=data.path?.[0]??null;render();if(hintMove){const c=game.cars[hintMove.car],delta=hintMove.to-game.state[hintMove.car];$('status').textContent=hintMove.to===6?`${c.id} を右の出口まで動かそう。`:`${c.id} を${c.axis==='h'?(delta>0?'右':'左'):(delta>0?'下':'上')}に ${Math.abs(delta)} マス動かそう。`;}else $('status').textContent='ヒントを取得できませんでした。';};worker.onerror=()=>{cancelHint();render();$('status').textContent='探索を開始できませんでした。再度お試しください。';};worker.postMessage({cars:game.cars,state:game.state});};load(0);
