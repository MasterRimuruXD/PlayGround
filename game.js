import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

// The Long Way Up: a small, tactile, hand-by-hand climbing story.
const canvas = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9c5cb');
scene.fog = new THREE.Fog('#c8d0c7', 43, 105);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, .1, 150);
camera.position.set(0, 0, 38);

scene.add(new THREE.HemisphereLight(0xe4f1ed, 0x5c4d42, 2.05));
const sun = new THREE.DirectionalLight(0xffe0b0, 3.1);
sun.position.set(-9, 15, 20); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22; sun.shadow.bias = -.0004;
scene.add(sun);

const mat = (color, roughness = .85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const wallMat = mat('#877b6b');
const rockDark = mat('#514f49');
const ledgeMat = mat('#aa9276');
const skyMat = mat('#d4d8c8');
const holdMats = ['#d98155', '#e3b965', '#78a29a', '#b6c98a', '#d2a082'].map(c => mat(c, .55));
const holdHoverMat = new THREE.MeshStandardMaterial({ color: '#fff0bd', emissive: '#ffcb70', emissiveIntensity: .8, roughness: .4 });

// Sunset sky and distant mountain silhouettes.
const sky = new THREE.Mesh(new THREE.PlaneGeometry(180, 120), new THREE.MeshBasicMaterial({ color: '#abc7cc' }));
sky.position.set(0, 20, -32); scene.add(sky);
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.MeshBasicMaterial({ color: '#f5d49a' }));
sunDisc.position.set(-11, 17, -25); scene.add(sunDisc);
function ridge(points, color, z) {
  const shape = new THREE.Shape(); shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.lineTo(22, -15); shape.lineTo(-22, -15); shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color }));
  mesh.position.z = z; scene.add(mesh); return mesh;
}
ridge([[-22, -4], [-17, 1], [-13, -2], [-8, 5], [-4, 0], [1, 6], [7, -1], [12, 4], [17, -2], [22, 3]], '#98aaa4', -22);
ridge([[-22, -5], [-16, -1], [-11, -4], [-6, 2], [-1, -3], [4, 2], [10, -3], [15, 1], [22, -3]], '#80948e', -18);

// Wall: slightly uneven rock face, seams, cracks, and scattered texture blocks.
const wall = new THREE.Mesh(new THREE.BoxGeometry(19, 62, 1.2), wallMat);
wall.position.set(0, 24, 0); wall.receiveShadow = true; wall.castShadow = true; scene.add(wall);
const random = (() => { let s = 89173; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
const decor = new THREE.Group(); scene.add(decor);
for (let row = -5; row < 59; row += 1.7) {
  const offset = Math.floor(row / 1.7) % 2 ? .72 : 0;
  for (let col = -9.2 + offset; col <= 9.2; col += 1.55) {
    if (random() < .34) continue;
    const w = .25 + random() * .75, h = .07 + random() * .16;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, .055), random() > .5 ? rockDark : ledgeMat);
    slab.position.set(col + (random() - .5) * .35, row + (random() - .5) * .5, .64);
    slab.rotation.z = (random() - .5) * .17; slab.material = slab.material.clone(); slab.material.transparent = true;
    slab.material.opacity = .12 + random() * .15; decor.add(slab);
  }
}
// Small shadowed cliff ledges at rest points.
for (const y of [12, 25, 38]) {
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(17.6, .18, 1.3), ledgeMat);
  ledge.position.set(0, y, .4); ledge.castShadow = true; ledge.receiveShadow = true; scene.add(ledge);
  const face = new THREE.Mesh(new THREE.BoxGeometry(17.6, .42, .65), rockDark);
  face.position.set(0, y - .26, .65); scene.add(face);
}

// Hold grid: deliberately generous spacing with a few playful color routes.
const holds = [];
const holdGeometry = new THREE.DodecahedronGeometry(.27, 0);
for (let row = 0; row <= 29; row++) {
  const y = -2.4 + row * 1.82;
  const stagger = row % 2 ? .72 : -.4;
  for (let col = -4; col <= 4; col++) {
    const x = col * 1.82 + stagger + (random() - .5) * .38;
    if (x < -8.7 || x > 8.7 || (random() < .12 && row < 27)) continue;
    const index = holds.length;
    const mesh = new THREE.Mesh(holdGeometry, holdMats[Math.floor(random() * holdMats.length)]);
    mesh.position.set(x, y + (random() - .5) * .35, .9);
    mesh.scale.set(.76 + random() * .45, .68 + random() * .44, .47 + random() * .3);
    mesh.rotation.set((random() - .5) * .4, (random() - .5) * .5, random() * Math.PI);
    mesh.castShadow = true; mesh.userData.holdIndex = index; scene.add(mesh);
    const shadow = new THREE.Mesh(new THREE.SphereGeometry(.31, 12, 8), new THREE.MeshBasicMaterial({ color: '#3b3d39', transparent: true, opacity: .14 }));
    shadow.position.set(x + .11, mesh.position.y - .1, .77); shadow.scale.set(1.1, .72, .2); scene.add(shadow);
    holds.push({ mesh, pos: mesh.position.clone(), baseMat: mesh.material });
  }
}

// Summit shelf and the person who makes the whole route feel shorter.
const summitShelf = new THREE.Mesh(new THREE.BoxGeometry(15, .55, 2.2), mat('#716f61'));
summitShelf.position.set(1, 49.7, .35); summitShelf.receiveShadow = true; summitShelf.castShadow = true; scene.add(summitShelf);
const summitTop = new THREE.Mesh(new THREE.BoxGeometry(13, .12, 1.2), mat('#c4aa82'));
summitTop.position.set(1, 50.04, .6); scene.add(summitTop);
const wife = new THREE.Group(); wife.position.set(2.1, 51.4, 1.25); scene.add(wife);
const dress = new THREE.Mesh(new THREE.ConeGeometry(.48, 1.65, 12), mat('#b77469'));
dress.position.y = -.33; dress.castShadow = true; wife.add(dress);
const wifeHead = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 16), mat('#e9bd94'));
wifeHead.position.set(0, .72, .03); wifeHead.castShadow = true; wife.add(wifeHead);
const hair = new THREE.Mesh(new THREE.SphereGeometry(.37, 18, 12), mat('#493c39'));
hair.scale.set(1, .9, .88); hair.position.set(0, .82, -.07); wife.add(hair);
const scarf = new THREE.Mesh(new THREE.BoxGeometry(.78, .13, .12), mat('#e1c47d'));
scarf.position.set(-.04, .35, .39); scarf.rotation.z = .15; wife.add(scarf);
const heart = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 12), new THREE.MeshBasicMaterial({ color: '#f5d89d' }));
heart.position.set(.9, 1.8, .25); wife.add(heart);

// A simple climber, with articulated upper arms and hands that snap to their holds.
const climber = new THREE.Group(); scene.add(climber);
const skin = mat('#dcae85', .72), shirtMat = mat('#394e54'), pantsMat = mat('#35434a'), bootMat = mat('#272f34');
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.48, .85, 5, 10), shirtMat);
torso.castShadow = true; climber.add(torso);
const head = new THREE.Mesh(new THREE.SphereGeometry(.37, 20, 16), skin); head.castShadow = true; climber.add(head);
const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.38, 18, 12), mat('#493e36'));
hairCap.scale.set(1, .75, .9); hairCap.position.y = .12; climber.add(hairCap);
const hip = new THREE.Mesh(new THREE.BoxGeometry(.72, .28, .5), pantsMat); hip.castShadow = true; climber.add(hip);
const armMeshes = [], legMeshes = [], handMeshes = [];
function limbMesh(radius, material) { const m = new THREE.Mesh(new THREE.CylinderGeometry(radius * .78, radius, 1, 10), material); m.castShadow = true; climber.add(m); return m; }
for (let i=0;i<2;i++) {
  armMeshes.push(limbMesh(.15, shirtMat));
  legMeshes.push(limbMesh(.19, pantsMat));
  const hand = new THREE.Mesh(new THREE.SphereGeometry(.19, 16, 12), skin); hand.castShadow = true; climber.add(hand); handMeshes.push(hand);
}
for (let i=0;i<2;i++) { const boot = new THREE.Mesh(new THREE.BoxGeometry(.31,.2,.4), bootMat); boot.castShadow=true; climber.add(boot); climber.userData['boot'+i]=boot; }
const handPositions = [null, null];
function closestHold(x,y,exclude=null) {
  let best=null, dist=Infinity;
  for (const h of holds) { if (h===exclude) continue; const d=h.pos.distanceTo(new THREE.Vector3(x,y,h.pos.z)); if(d<dist){dist=d;best=h;} }
  return best;
}
let initialLeft=closestHold(-.55,-.6), initialRight=closestHold(1.35,-.6,initialLeft);
if (!initialRight || initialRight.pos.distanceTo(initialLeft.pos)>3.4) initialRight=closestHold(1.35,1.2,initialLeft);
handPositions[0]=initialLeft.pos.clone(); handPositions[1]=initialRight.pos.clone();
let activeHand=0, started=false, ended=false, moving=false, moveTime=0, elapsed=0, lastTick=0;
let bodyPos=new THREE.Vector3(0,-1.8,1.5), prevBody=bodyPos.clone();
const moveFrom=[handPositions[0].clone(),handPositions[1].clone()], moveTo=[handPositions[0].clone(),handPositions[1].clone()];
const goalY=47.8;

function setCylinder(mesh, a, b) { const diff=new THREE.Vector3().subVectors(b,a); mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.scale.y=diff.length(); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize()); }
function drawClimber(dt) {
  const hands=handPositions;
  const cx=(hands[0].x+hands[1].x)*.5, cy=(hands[0].y+hands[1].y)*.5;
  const desired=new THREE.Vector3(cx, cy-1.42, 1.55);
  bodyPos.lerp(desired, 1-Math.exp(-dt*5.2));
  climber.position.set(bodyPos.x,bodyPos.y,bodyPos.z);
  torso.position.set(0,.35,0); torso.rotation.z=THREE.MathUtils.clamp((hands[1].y-hands[0].y)*-.09,-.22,.22);
  head.position.set(.03,1.13,.02); hip.position.set(0,-.43,0);
  for(let i=0;i<2;i++) {
    const shoulder=new THREE.Vector3(i===0?-.34:.34,.66,.08).add(bodyPos);
    const elbow=new THREE.Vector3((hands[i].x-bodyPos.x)*.55+(i===0?-.22:.22), .45+(hands[i].y-bodyPos.y)*.54, .23).add(bodyPos);
    const end=new THREE.Vector3(hands[i].x,hands[i].y,1.35);
    setCylinder(armMeshes[i],shoulder,elbow); const fore=armMeshes[i].userData.fore || limbMesh(.115,skin); if(!armMeshes[i].userData.fore){armMeshes[i].userData.fore=fore; fore.userData.noArm=true;}
    setCylinder(fore,elbow,end); handMeshes[i].position.copy(end).add(new THREE.Vector3(0,0,.03));
    const knee=new THREE.Vector3((i===0?-.4:.4),-.91,.06).add(bodyPos), foot=new THREE.Vector3((i===0?-.5:.5),-1.37,.38).add(bodyPos);
    setCylinder(legMeshes[i],new THREE.Vector3(i===0?-.2:.2,-.48,.06).add(bodyPos),knee);
    const boot=climber.userData['boot'+i]; boot.position.copy(foot); boot.rotation.z=i===0?-.12:.12;
  }
}

// Camera and pointer helpers.
let viewHeight=15.8, focusY=3.3;
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); const aspect=w/h; camera.left=-viewHeight*aspect/2; camera.right=viewHeight*aspect/2; camera.top=viewHeight/2; camera.bottom=-viewHeight/2; camera.updateProjectionMatrix(); }
window.addEventListener('resize',resize); resize();
const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
const targetRing=new THREE.Mesh(new THREE.TorusGeometry(.45,.045,8,24),new THREE.MeshBasicMaterial({color:'#fff0bd',transparent:true,opacity:.9}));
targetRing.visible=false; targetRing.position.z=1.35; scene.add(targetRing);
let hovered=null;
function pointerHold(event){const r=canvas.getBoundingClientRect();pointer.x=((event.clientX-r.left)/r.width)*2-1;pointer.y=-((event.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(holds.map(h=>h.mesh),false); hovered=hits.length?holds[hits[0].object.userData.holdIndex]:null;}
canvas.addEventListener('pointermove',pointerHold);
function notify(text){const t=document.querySelector('#toast');t.textContent=text;t.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove('show'),1350);}
function staminaCost(distance){return 9+distance*4.2;}
function reach(hold){if(!hold||moving||ended)return;const from=handPositions[activeHand], distance=from.distanceTo(hold.pos);if(distance>4.35){notify('That hold is a little too far — find a closer reach.');return;}if(stamina<5){notify('Pause a moment. Let your grip come back.');return;}
  if(hold===holds.find(h=>h.pos.distanceTo(from)<.01)){notify('That’s the hold you’re already on.');return;}
  const cost=staminaCost(distance);stamina=Math.max(0,stamina-cost);moveFrom[activeHand].copy(from);moveTo[activeHand].copy(hold.pos);moving=true;moveTime=0;lastMoveAt=elapsed;playTone(360+random()*100,.06);updateHud();
}
canvas.addEventListener('pointerdown',e=>{if(!started||ended)return;pointerHold(e);if(hovered)reach(hovered);});
function selectHand(i){activeHand=i;document.querySelector('#left-hand').classList.toggle('active',i===0);document.querySelector('#right-hand').classList.toggle('active',i===1);}
document.querySelector('#left-hand').addEventListener('click',()=>selectHand(0));document.querySelector('#right-hand').addEventListener('click',()=>selectHand(1));
function moveDirectional(key){const origin=handPositions[activeHand];let dx=0,dy=0;if(key==='a')dx=-1;if(key==='d')dx=1;if(key==='w')dy=1;if(key==='s')dy=-1;let best=null,score=Infinity;
 for(const h of holds){const vx=h.pos.x-origin.x,vy=h.pos.y-origin.y,d=Math.hypot(vx,vy);if(d<.15||d>4.35)continue;const along=(vx*dx+vy*dy)/d;if(along<.36)continue;const side=Math.abs(vx*dy-vy*dx)/d;const value=d+side*1.35-along*.45;if(value<score){score=value;best=h;}}
 if(!best&&dy>0){for(const h of holds){const vx=h.pos.x-origin.x,vy=h.pos.y-origin.y,d=Math.hypot(vx,vy);if(vy<=.2||d>4.35)continue;const value=d+Math.abs(vx)*.8-vy*.3;if(value<score){score=value;best=h;}}}
  if(best)reach(best);else notify('No nearby hold that way.');}
window.addEventListener('keydown',e=>{if(!started||ended)return;const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='q')selectHand(0);else if(k==='e'||k===' ')selectHand(1-activeHand);else if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(k)){const map={arrowup:'w',arrowleft:'a',arrowdown:'s',arrowright:'d'};moveDirectional(map[k]||k);}});

let stamina=100, lastMoveAt=0, audio=null, soundOn=true;
function playTone(freq=420,duration=.08){if(!soundOn)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.055,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}catch(_){}}
document.querySelector('#sound-btn').addEventListener('click',()=>{soundOn=!soundOn;document.querySelector('#sound-btn span').textContent=soundOn?'SOUND ON':'SOUND OFF';if(soundOn)playTone(540,.1);});
function updateHud(){const progress=THREE.MathUtils.clamp((bodyPos.y+2.2)/(goalY+2.2),0,1);document.querySelector('#altitude').textContent=Math.round(progress*1800).toLocaleString();document.querySelector('#progress-fill').style.width=`${progress*100}%`;document.querySelector('#stamina-value').textContent=`${Math.round(stamina)}%`;const bar=document.querySelector('#stamina-fill');bar.style.width=`${stamina}%`;bar.classList.toggle('low',stamina<28);const note=document.querySelector('#stamina-note');note.textContent=stamina<25?'Pause on a hold. Breathe it back.':stamina<55?'Easy does it. Your grip is tiring.':'Steady hands. Keep going.';}
function startGame(){started=true;document.querySelector('#intro').classList.remove('visible');document.querySelector('#climb-hint').style.opacity='1';lastMoveAt=elapsed;playTone(520,.12);}
document.querySelector('#start-btn').addEventListener('click',startGame);
let startClock=0;
function finish(){if(ended)return;ended=true;document.querySelector('#climb-hint').style.opacity='0';document.querySelector('#final-time').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;document.querySelector('#ending').classList.add('visible');playTone(660,.25);setTimeout(()=>playTone(830,.4),180);}
function resetGame(){stamina=100;elapsed=0;started=false;ended=false;moving=false;activeHand=0;handPositions[0].copy(initialLeft.pos);handPositions[1].copy(initialRight.pos);moveFrom[0].copy(handPositions[0]);moveFrom[1].copy(handPositions[1]);moveTo[0].copy(handPositions[0]);moveTo[1].copy(handPositions[1]);bodyPos.set(0,-1.8,1.5);focusY=3.3;selectHand(0);updateHud();document.querySelector('#ending').classList.remove('visible');document.querySelector('#intro').classList.add('visible');}
document.querySelector('#again-btn').addEventListener('click',resetGame);

// Soft clouds drift by behind the cliff; small flecks add scale to the air.
const cloudGroups=[];
for(let i=0;i<6;i++){
  const cloud=new THREE.Group();const cloudMat=new THREE.MeshBasicMaterial({color:'#f0e9d8',transparent:true,opacity:.27,depthWrite:false});
  for(let j=0;j<4;j++){const puff=new THREE.Mesh(new THREE.CircleGeometry(.65+random()*.42,16),cloudMat);puff.position.set((j-1.5)*.62,(random()-.5)*.3,0);puff.scale.y=.48;cloud.add(puff);}
  cloud.position.set((random()-.5)*36,-8+i*12,-28);scene.add(cloud);cloudGroups.push(cloud);
}
const dust=[];
for(let i=0;i<48;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.025+random()*.028,6,5),new THREE.MeshBasicMaterial({color:'#fff1d2',transparent:true,opacity:.35}));dot.position.set((random()-.5)*21,random()*54-2,2.4+random()*2);dot.userData.speed=.12+random()*.3;scene.add(dot);dust.push(dot);}

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);elapsed+=started&&!ended?dt:0;
  if(moving){moveTime+=dt;const t=THREE.MathUtils.clamp(moveTime/.31,0,1),smooth=t*t*(3-2*t);handPositions[activeHand].lerpVectors(moveFrom[activeHand],moveTo[activeHand],smooth);if(t>=1){handPositions[activeHand].copy(moveTo[activeHand]);moving=false;lastMoveAt=elapsed;playTone(520,.045);}}
  if(started&&!ended&&!moving&&elapsed-lastMoveAt>.7)stamina=Math.min(100,stamina+dt*(bodyPos.y>10?8:6));
  drawClimber(dt);const targetFocus=bodyPos.y+5.25;focusY=THREE.MathUtils.lerp(focusY,targetFocus,1-Math.exp(-dt*1.7));camera.position.y=focusY;camera.lookAt(0,focusY,0);
  if(hovered&&started&&!ended){targetRing.visible=true;targetRing.position.set(hovered.pos.x,hovered.pos.y,1.32);const d=handPositions[activeHand].distanceTo(hovered.pos);targetRing.material.color.set(d<=4.35?'#fff0bd':'#e99a83');targetRing.scale.setScalar(1+Math.sin(elapsed*5)*.06);}else targetRing.visible=false;
  for(const cloud of cloudGroups){cloud.position.x+=dt*.16;if(cloud.position.x>22)cloud.position.x=-22;}
  for(const dot of dust){dot.position.y+=dt*dot.userData.speed;if(dot.position.y>focusY+12)dot.position.y=focusY-16;}
  wife.rotation.y=Math.sin(elapsed*.7)*.07;heart.scale.setScalar(.9+Math.sin(elapsed*2.7)*.12);
  if(started&&!ended&&bodyPos.y>=goalY)finish();
  updateHud();renderer.render(scene,camera);if(started)document.querySelector('#loading').classList.add('done');
}
// Start at the foot of the wall; allow the first frame to render before hiding the loader.
drawClimber(0);updateHud();animate();setTimeout(()=>loading.classList.add('done'),450);
