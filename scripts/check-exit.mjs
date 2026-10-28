import {createRequire} from 'node:module';import assert from 'node:assert/strict';import {puzzles} from '../puzzles.js';import {solve} from '../engine.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});await context.route('https://script.google.com/**',r=>r.abort());const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.GAME_URL||'http://127.0.0.1:8787');
 const path=solve(puzzles[0].cars,puzzles[0].state);
 async function prepare(){await page.locator('#reset').click();const state=puzzles[0].state.slice();for(const m of path.slice(0,-1)){const c=puzzles[0].cars[m.car],dir=m.to>state[m.car]?1:-1,key=c.axis==='h'?(dir>0?'ArrowRight':'ArrowLeft'):(dir>0?'ArrowDown':'ArrowUp');for(let n=0;n<Math.abs(m.to-state[m.car]);n++)await page.locator(`[data-car="${m.car}"]`).press(key);state[m.car]=m.to;}return state;}
 async function exit(state){const el=page.locator('[data-car="0"]'),r=await el.boundingBox(),b=await page.locator('#board').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2,to=x+(5-state[0])*b.width/6;
 if(mobile){for(const [type,xx] of [['pointerdown',x],['pointermove',to],['pointerup',to]])await el.dispatchEvent(type,{pointerId:1,pointerType:'touch',button:0,clientX:xx,clientY:y});}
 else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(to,y,{steps:5});await page.mouse.up();}
 }
 let state=await prepare(),before=Number(await page.locator('#count').innerText());await exit(state);
 assert.equal(await page.locator('#success').evaluate(e=>e.open),false);assert.equal(Number(await page.locator('#count').innerText()),before+1);
 assert.equal(await page.locator('.car:not(:disabled)').count(),0);
 // Freeze at exact animation times to verify the entire car passes the board edge.
 const motion=await page.evaluate(async()=>{const car=document.querySelector('.escaping'),a=car.getAnimations()[0];a.pause();a.currentTime=0;const start=car.getBoundingClientRect().left;a.currentTime=400;const middle=car.getBoundingClientRect().left;a.currentTime=799;const end=car.getBoundingClientRect().left,edge=document.getElementById('board').getBoundingClientRect().right,duration=a.effect.getTiming().duration;a.play();return {start,middle,end,edge,duration};});
 assert.ok(motion.middle>motion.start);assert.ok(motion.end>motion.edge);assert.equal(motion.duration,800);
 await page.waitForFunction(()=>document.getElementById('success').open);assert.equal(await page.locator('.escaping').count(),0);await page.locator('#review').click();await page.locator('#undo').click();assert.equal(await page.locator('[data-car="0"]').count(),1);
 for(const action of ['undo','reset','problem']){state=await prepare();await exit(state);if(action==='problem')await page.locator('#level').selectOption('1');else await page.locator('#'+action).click();await page.waitForTimeout(900);assert.equal(await page.locator('#success').evaluate(e=>e.open),false);assert.equal(await page.locator('.escaping').count(),0);assert.equal(await page.locator('[data-car="0"]').count(),1);assert.equal(await page.locator('#board').getAttribute('aria-busy'),null);if(action!=='undo')assert.equal(await page.locator('#count').innerText(),'0');}
 assert.deepEqual(errors,[]);console.log(mobile?'Mobile':'Desktop','PASS: 800ms full exit, delayed dialog, input lock, one move, Undo/reset/problem cancellation');await context.close();
}await browser.close();
