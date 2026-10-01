const canvas=document.querySelector('#game');
const ctx=canvas.getContext('2d');

const scoreEl=document.querySelector('#score');
const bestEl=document.querySelector('#best');
const livesEl=document.querySelector('#lives');
const comboEl=document.querySelector('#combo');
const statusTitle=document.querySelector('#status-title');
const statusCopy=document.querySelector('#status-copy');

const overlay=document.querySelector('#overlay');
const overlayKicker=document.querySelector('#overlay-kicker');
const overlayTitle=document.querySelector('#overlay-title');
const overlayCopy=document.querySelector('#overlay-copy');
const startBtn=document.querySelector('#start');
const restartBtn=document.querySelector('#restart');
const pauseBtn=document.querySelector('#pause');

const W=canvas.width;
const H=canvas.height;

const FRUITS=[
  {name:'apple',color:'#ff5f68',inside:'#ffd6d9'},
  {name:'orange',color:'#ff9b4a',inside:'#ffe1bd'},
  {name:'lime',color:'#7ed66a',inside:'#d9f5cf'},
  {name:'berry',color:'#9b6cff',inside:'#ded1ff'},
  {name:'melon',color:'#42c8a0',inside:'#c8f5e8'}
];

let objects=[];
let particles=[];
let halves=[];
let trail=[];

let score=0;
let best=Number(window.FRUIT_STATS.highScore||0);
let lives=3;
let combo=0;
let bestCombo=Number(window.FRUIT_STATS.bestCombo||0);

let running=false;
let paused=false;
let ended=false;
let pointerDown=false;
let swipeHits=0;
let spawnTimer=0;
let elapsed=0;
let last=0;
let raf=0;

function reset(){
  cancelAnimationFrame(raf);

  objects=[];
  particles=[];
  halves=[];
  trail=[];

  score=0;
  lives=3;
  combo=0;
  swipeHits=0;
  spawnTimer=0;
  elapsed=0;
  running=false;
  paused=false;
  ended=false;
  pointerDown=false;
  last=0;

  ui();
  draw();

  show(
    'READY',
    'Slice the fruit.',
    'Hold and swipe across fruit. Missing fruit costs a life. Bombs end the run.',
    'Start game'
  );
}

function start(){
  if(ended) reset();

  if(!running){
    running=true;
    paused=false;
    hide();
    last=performance.now();
    raf=requestAnimationFrame(loop);
    ui();
  }
}

function ui(){
  scoreEl.textContent=score;
  bestEl.textContent=best;
  livesEl.textContent=lives;
  comboEl.textContent=`${combo}×`;

  if(paused){
    statusTitle.textContent='Paused';
    statusCopy.textContent='Press P or Continue to resume.';
  }else if(running){
    statusTitle.textContent=`Intensity ${difficulty().toFixed(1)}×`;
    statusCopy.textContent=combo>1?`Combo ×${combo}`:'Slice several fruits in one gesture.';
  }else{
    statusTitle.textContent='Ready';
    statusCopy.textContent='Slice several fruits in one gesture for a combo bonus.';
  }
}

function show(kicker,title,copy,button){
  overlayKicker.textContent=kicker;
  overlayTitle.textContent=title;
  overlayCopy.textContent=copy;
  startBtn.textContent=button;
  overlay.hidden=false;
}

function hide(){
  overlay.hidden=true;
}

function difficulty(){
  return 1+Math.min(elapsed/28,2.4);
}

function spawnObject(){
  const d=difficulty();
  const bombChance=.08+Math.min(.11,(d-1)*.045);
  const bomb=Math.random()<bombChance;
  const fruit=FRUITS[Math.floor(Math.random()*FRUITS.length)];

  const radius=bomb?24:23+Math.random()*10;
  const x=80+Math.random()*(W-160);
  const y=H+radius+10;

  const targetX=W*.5+(Math.random()-.5)*W*.55;
  const flight=1.45+Math.random()*.45;
  const vx=(targetX-x)/flight;
  const vy=-(560+Math.random()*170+d*28);

  objects.push({
    type:bomb?'bomb':'fruit',
    fruit,
    x,y,
    vx,vy,
    r:radius,
    rotation:Math.random()*Math.PI*2,
    spin:(Math.random()-.5)*4,
    sliced:false,
    missed:false
  });
}

function spawnWave(){
  const d=difficulty();
  const count=Math.random()<Math.min(.58,.22+d*.10)?2:1;

  for(let i=0;i<count;i++){
    setTimeout(()=> {
      if(running&&!paused&&!ended) spawnObject();
    },i*100);
  }
}

function update(dt){
  elapsed+=dt;
  spawnTimer+=dt;

  const interval=Math.max(.34,1.02-difficulty()*.18);

  if(spawnTimer>=interval){
    spawnTimer=0;
    spawnWave();
  }

  for(const obj of objects){
    obj.vy+=900*dt;
    obj.x+=obj.vx*dt;
    obj.y+=obj.vy*dt;
    obj.rotation+=obj.spin*dt;

    if(obj.y-obj.r>H+40&&!obj.sliced&&!obj.missed){
      obj.missed=true;

      if(obj.type==='fruit'){
        lives--;
        combo=0;
        ui();

        if(lives<=0){
          gameOver();
          return;
        }
      }
    }
  }

  objects=objects.filter(obj=>obj.y-obj.r<H+120&&!obj.sliced);

  for(const p of particles){
    p.x+=p.vx*dt;
    p.y+=p.vy*dt;
    p.vy+=380*dt;
    p.life-=dt;
  }

  particles=particles.filter(p=>p.life>0);

  for(const half of halves){
    half.vy+=760*dt;
    half.x+=half.vx*dt;
    half.y+=half.vy*dt;
    half.rotation+=half.spin*dt;
    half.life-=dt;
  }

  halves=halves.filter(h=>h.life>0&&h.y<H+120);

  const now=performance.now();
  trail=trail.filter(p=>now-p.time<180);
}

function sliceAt(x,y){
  if(!running||paused||ended) return;

  let hitSomething=false;

  for(const obj of objects){
    if(obj.sliced) continue;

    if(Math.hypot(x-obj.x,y-obj.y)<=obj.r+10){
      hitSomething=true;

      if(obj.type==='bomb'){
        explodeBomb(obj);
        obj.sliced=true;
        gameOver(true);
        return;
      }

      sliceFruit(obj);
      obj.sliced=true;
      swipeHits++;
    }
  }

  if(hitSomething) ui();
}

function sliceFruit(obj){
  combo++;
  bestCombo=Math.max(bestCombo,combo);

  const base=10;
  const comboBonus=Math.max(0,(swipeHits)*8);
  score+=base+comboBonus;
  best=Math.max(best,score);

  createJuice(obj);
  createHalves(obj);
}

function createJuice(obj){
  for(let i=0;i<18;i++){
    const a=Math.random()*Math.PI*2;
    const speed=60+Math.random()*180;

    particles.push({
      x:obj.x,
      y:obj.y,
      vx:Math.cos(a)*speed,
      vy:Math.sin(a)*speed,
      life:.3+Math.random()*.45,
      max:.75,
      size:2+Math.random()*4,
      color:obj.fruit.color
    });
  }
}

function createHalves(obj){
  halves.push({
    x:obj.x-8,
    y:obj.y,
    vx:obj.vx-90,
    vy:obj.vy*.35-40,
    r:obj.r,
    color:obj.fruit.color,
    inside:obj.fruit.inside,
    rotation:obj.rotation,
    spin:-3,
    side:-1,
    life:1.4
  });

  halves.push({
    x:obj.x+8,
    y:obj.y,
    vx:obj.vx+90,
    vy:obj.vy*.35-40,
    r:obj.r,
    color:obj.fruit.color,
    inside:obj.fruit.inside,
    rotation:obj.rotation,
    spin:3,
    side:1,
    life:1.4
  });
}

function explodeBomb(obj){
  for(let i=0;i<34;i++){
    const a=Math.random()*Math.PI*2;
    const speed=80+Math.random()*250;

    particles.push({
      x:obj.x,
      y:obj.y,
      vx:Math.cos(a)*speed,
      vy:Math.sin(a)*speed,
      life:.35+Math.random()*.6,
      max:.95,
      size:2+Math.random()*5,
      color:i%2===0?'#ff6b77':'#f5c66a'
    });
  }
}

function drawBackground(){
  ctx.fillStyle='#0a0e14';
  ctx.fillRect(0,0,W,H);

  const g=ctx.createRadialGradient(W*.5,H*.55,20,W*.5,H*.55,W*.7);
  g.addColorStop(0,'rgba(54,80,105,.18)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H);

  ctx.strokeStyle='rgba(255,255,255,.022)';
  ctx.lineWidth=1;

  for(let y=40;y<H;y+=55){
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(W,y);
    ctx.stroke();
  }
}

function drawFruit(obj){
  ctx.save();
  ctx.translate(obj.x,obj.y);
  ctx.rotate(obj.rotation);

  if(obj.type==='bomb'){
    ctx.shadowColor='rgba(255,80,95,.45)';
    ctx.shadowBlur=14;
    ctx.fillStyle='#20252d';
    ctx.beginPath();
    ctx.arc(0,0,obj.r,0,Math.PI*2);
    ctx.fill();

    ctx.shadowBlur=0;
    ctx.strokeStyle='#ff6b77';
    ctx.lineWidth=4;
    ctx.beginPath();
    ctx.arc(0,0,obj.r-3,0,Math.PI*2);
    ctx.stroke();

    ctx.strokeStyle='#c6a264';
    ctx.lineWidth=5;
    ctx.beginPath();
    ctx.moveTo(obj.r*.35,-obj.r*.7);
    ctx.quadraticCurveTo(obj.r*.8,-obj.r*1.25,obj.r*.9,-obj.r*1.55);
    ctx.stroke();

    ctx.fillStyle='#ffd76b';
    ctx.beginPath();
    ctx.arc(obj.r*.92,-obj.r*1.6,4,0,Math.PI*2);
    ctx.fill();

    ctx.restore();
    return;
  }

  ctx.shadowColor=obj.fruit.color;
  ctx.shadowBlur=12;
  ctx.fillStyle=obj.fruit.color;
  ctx.beginPath();
  ctx.arc(0,0,obj.r,0,Math.PI*2);
  ctx.fill();

  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,.20)';
  ctx.beginPath();
  ctx.arc(-obj.r*.28,-obj.r*.3,obj.r*.22,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle='#6b8c4a';
  ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(0,-obj.r*.9);
  ctx.lineTo(3,-obj.r*1.28);
  ctx.stroke();

  ctx.restore();
}

function drawHalf(h){
  ctx.save();
  ctx.translate(h.x,h.y);
  ctx.rotate(h.rotation);

  ctx.fillStyle=h.color;
  ctx.beginPath();

  if(h.side<0){
    ctx.arc(0,0,h.r,Math.PI/2,Math.PI*1.5);
  }else{
    ctx.arc(0,0,h.r,-Math.PI/2,Math.PI/2);
  }

  ctx.closePath();
  ctx.fill();

  ctx.fillStyle=h.inside;
  ctx.beginPath();

  if(h.side<0){
    ctx.arc(0,0,h.r*.68,Math.PI/2,Math.PI*1.5);
  }else{
    ctx.arc(0,0,h.r*.68,-Math.PI/2,Math.PI/2);
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawParticles(){
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,p.life/p.max);
    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawTrail(){
  if(trail.length<2) return;

  ctx.lineCap='round';

  for(let i=1;i<trail.length;i++){
    const a=trail[i-1];
    const b=trail[i];
    const alpha=i/trail.length;

    ctx.strokeStyle=`rgba(210,240,255,${alpha*.8})`;
    ctx.lineWidth=2+alpha*5;

    ctx.beginPath();
    ctx.moveTo(a.x,a.y);
    ctx.lineTo(b.x,b.y);
    ctx.stroke();
  }
}

function drawHUD(){
  ctx.fillStyle='rgba(255,255,255,.42)';
  ctx.font='700 12px system-ui';
  ctx.textAlign='left';
  ctx.fillText(`LIVES ${lives}`,14,20);

  ctx.textAlign='right';
  ctx.fillText(`COMBO ${combo}x`,W-14,20);
}

function draw(){
  ctx.clearRect(0,0,W,H);
  drawBackground();
  drawHUD();

  for(const obj of objects) drawFruit(obj);
  for(const h of halves) drawHalf(h);

  drawParticles();
  drawTrail();
}

function loop(time){
  if(!running||paused||ended){
    draw();
    return;
  }

  const dt=Math.min((time-last)/1000,.032);
  last=time;

  update(dt);
  draw();

  if(running&&!paused&&!ended){
    raf=requestAnimationFrame(loop);
  }
}

async function saveResult(){
  try{
    const response=await fetch('score.php',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        score,
        combo:bestCombo
      })
    });

    const data=await response.json();

    if(response.ok){
      best=Number(data.highScore||best);
      bestCombo=Number(data.bestCombo||bestCombo);
      ui();
    }
  }catch(_){}
}

function gameOver(bomb=false){
  if(ended) return;

  running=false;
  paused=false;
  ended=true;
  void saveResult();

  show(
    bomb?'BOMB HIT':'GAME OVER',
    `${score} points`,
    bomb
      ? `Bomb sliced. Best score: ${Math.max(score,best)}.`
      : `No lives left. Best score: ${Math.max(score,best)}.`,
    'Play again'
  );
}

function togglePause(){
  if(ended||(!running&&!paused)) return;

  paused=!paused;

  if(paused){
    running=false;
    cancelAnimationFrame(raf);
    ui();

    show(
      'PAUSED',
      'Game frozen.',
      'Continue when ready.',
      'Continue'
    );
  }else{
    hide();
    running=true;
    last=performance.now();
    ui();
    raf=requestAnimationFrame(loop);
  }
}

function canvasPoint(event){
  const rect=canvas.getBoundingClientRect();

  return {
    x:(event.clientX-rect.left)*canvas.width/rect.width,
    y:(event.clientY-rect.top)*canvas.height/rect.height
  };
}

canvas.addEventListener('pointerdown',event=>{
  event.preventDefault();

  if(paused){
    togglePause();
    return;
  }

  if(!running){
    start();
    return;
  }

  pointerDown=true;
  swipeHits=0;
  combo=0;

  const p=canvasPoint(event);
  trail=[{...p,time:performance.now()}];
  sliceAt(p.x,p.y);

  try{canvas.setPointerCapture(event.pointerId)}catch(_){}
});

canvas.addEventListener('pointermove',event=>{
  if(!pointerDown||!running||paused||ended) return;

  const p=canvasPoint(event);
  trail.push({...p,time:performance.now()});

  const previous=trail.at(-2);

  if(previous){
    const distance=Math.hypot(p.x-previous.x,p.y-previous.y);
    const steps=Math.max(1,Math.ceil(distance/12));

    for(let i=1;i<=steps;i++){
      const t=i/steps;
      sliceAt(
        previous.x+(p.x-previous.x)*t,
        previous.y+(p.y-previous.y)*t
      );
    }
  }
});

function endSwipe(){
  if(pointerDown){
    if(swipeHits<=1) combo=0;
    else{
      score+=swipeHits*swipeHits*6;
      best=Math.max(best,score);
      bestCombo=Math.max(bestCombo,swipeHits);
    }

    pointerDown=false;
    swipeHits=0;
    ui();
  }
}

canvas.addEventListener('pointerup',endSwipe);
canvas.addEventListener('pointercancel',endSwipe);
canvas.addEventListener('pointerleave',event=>{
  if(event.buttons===0) endSwipe();
});

document.addEventListener('keydown',event=>{
  if(event.key.toLowerCase()==='p'){
    event.preventDefault();
    togglePause();
  }

  if(event.key===' '&&!running&&!paused){
    event.preventDefault();
    start();
  }
});

startBtn.addEventListener('click',()=>{
  if(paused) togglePause();
  else start();
});

pauseBtn.addEventListener('click',()=>{
  if(paused) togglePause();
  else if(running) togglePause();
});

restartBtn.addEventListener('click',reset);

reset();
