const $=id=>document.getElementById(id),val=id=>$(id).value;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(k,d=[])=>{try{return JSON.parse(localStorage.getItem('tt_'+k))??d}catch{return d}},put=(k,v)=>localStorage.setItem('tt_'+k,JSON.stringify(v));
const API=['https://api.genshin.dev','https://genshin.jmp.blue'];
const FALLBACK=['Traveler','Amber','Kaeya','Lisa','Barbara','Xiangling','Bennett','Fischl','Xingqiu','Diluc','Jean','Qiqi','Mona','Keqing','Venti','Klee','Zhongli','Albedo','Ganyu','Xiao','Hu Tao','Kazuha','Yelan','Raiden Shogun','Nahida','Furina','Neuvillette'].map(name=>({name}));
let D={chars:[],weapons:[],arts:[]},BUILDS={builds:{},teams:[]};
// ---- tabs
const names=[['home','Home'],['banners','Banners'],['roster','Roster'],['characters','Builds'],['teams','Teams'],['weapons','Weapons'],['artifacts','Artifacts'],['compare','Compare'],['rankings','Rankings'],['farming','Farming'],['calculator','Damage'],['account','Account'],['map','Map']];
names.forEach(([id,l],i)=>{const b=document.createElement('button');b.textContent=l;b.className=i?'':'active';b.onclick=()=>{document.querySelectorAll('section').forEach(s=>s.classList.remove('active'));document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');b.classList.add('active');scrollTo(0,0)};$('tabs').appendChild(b)});
// ---- data
async function jget(u,ms=12000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw 0;return await r.json()}finally{clearTimeout(t)}}
const norm=(a,f)=>(Array.isArray(a)?a:Object.values(a||{})).map(f).filter(x=>x.name);
async function loadData(force){
  const c=get('cache',null);
  if(c&&!force){D.raw=c;apply();}
  if(c&&!force&&Date.now()-c.t<6048e5){status();return}
  $('dataStatus').textContent='Loading game data…';
  for(const base of API){try{
    const [ch,w,a]=await Promise.all(['characters','weapons','artifacts'].map(k=>jget(base+'/'+k+'/all')));
    D.raw={t:Date.now(),chars:norm(ch,x=>({name:x.name,vision:x.vision,weapon:x.weapon,rarity:x.rarity,nation:x.nation})),
      weapons:norm(w,x=>({name:x.name,type:x.type,rarity:x.rarity,sub:x.subStat,atk:x.baseAttack,passive:x.passiveName})),
      arts:norm(a,x=>({name:x.name,r:x.max_rarity,b2:x['2-piece_bonus'],b4:x['4-piece_bonus']}))};
    if(D.raw.chars.length<5)throw 0;put('cache',D.raw);apply();status();return}catch(e){}}
  apply();status('Could not reach the game-data API. '+(c?'Showing cached data.':'Showing a small built-in list.'));
}
function apply(){const r=D.raw||{},cu=get('custom',[]);
  const m=(l,k)=>[...(l||[]),...cu.filter(x=>x.k==k).map(x=>({name:x.name,custom:1}))].sort((p,q)=>p.name.localeCompare(q.name));
  D.chars=m(r.chars?.length?r.chars:FALLBACK,'chars');D.weapons=m(r.weapons,'weapons');D.arts=m(r.arts,'arts');fillSelects();render();}
function status(m){const r=D.raw;$('dataStatus').innerHTML=(m?'<span class="warn">'+esc(m)+'</span><br>':'')+(r?`${D.chars.length} characters · ${D.weapons.length} weapons · ${D.arts.length} artifact sets · fetched ${new Date(r.t).toLocaleDateString()}<br>Community data can lag new releases.`:'')}
function fillSelects(){document.querySelectorAll('select[data-src]').forEach(s=>{const v=s.value;s.innerHTML='<option value="">— choose —</option>'+D[s.dataset.src].map(x=>`<option>${esc(x.name)}</option>`).join('');s.value=v});
  const els=[...new Set(D.chars.map(x=>x.vision).filter(Boolean))].sort(),ty=[...new Set(D.weapons.map(x=>x.type).filter(Boolean))].sort();
  const f=(id,a,t)=>{const v=$(id).value;$(id).innerHTML=`<option value="">${t}</option>`+a.map(x=>`<option>${esc(x)}</option>`).join('');$(id).value=v};f('fEl',els,'Any element');f('wT',ty,'Any weapon type')}
// ---- banners
async function loadBanners(){let d=null;const u=get('feed','');
  for(const src of [u,'banners.json']){if(!src)continue;try{d=await jget(src);break}catch(e){}}
  if(!d)return $('bannerMeta').innerHTML='<span class="warn">Could not load banners.</span>';
  const age=d.updated?Math.floor((Date.now()-new Date(d.updated))/864e5):null,now=Date.now();
  const bs=(d.banners||[]).map(b=>{const s=b.start&&Date.parse(b.start),e=b.end&&Date.parse(b.end);b.st=s&&e?(now<s?'upcoming':now>e?'ended':'current'):(b.status||'unverified');return b}).filter(b=>b.st!='ended');
  const left=b=>b.end?` · ends in ${Math.max(0,Math.ceil((Date.parse(b.end)-now)/864e5))} days`:'';
  const h=bs.map(b=>`<div class="item"><span class="tag">${esc(b.st)}</span><span class="tag">${esc(b.type)}</span> <b>${esc(b.name)}</b>${left(b)}<div class="small"><span class="t5">★5 ${esc((b.five||[]).join(', '))}</span><br><span class="t4">★4 ${esc((b.four||[]).join(', '))}</span>${b.start?'<br>'+esc(b.start.slice(0,10))+' → '+esc((b.end||'?').slice(0,10)):''}</div></div>`).join('')||'<p class="small">No banners listed.</p>';
  $('bannerList').innerHTML=h;$('homeBanners').innerHTML=bs.filter(b=>b.st!='upcoming').slice(0,3).map(b=>`<b>${esc(b.name)}</b>: ${esc((b.five||[]).join(', '))}`).join('<br>')||'None listed.';
  $('bannerMeta').innerHTML=`Feed updated: ${esc(d.updated||'unknown')}${age>21?' <span class="warn">— '+age+' days old, may be outdated</span>':''}`;}
function saveFeed(){put('feed',val('feedUrl').trim());loadBanners()}
// ---- catalogues
const filt=(a,q)=>a.filter(x=>!q||x.name.toLowerCase().includes(q.toLowerCase()));
function render(){
  const q=val('fQ'),el=val('fEl'),rr=val('fR');
  $('rosterList').innerHTML=filt(D.chars,q).filter(x=>(!el||x.vision==el)&&(!rr||String(x.rarity)==rr)).map(x=>`<div class="item pick" onclick="pickChar('${esc(x.name).replace(/'/g,'')}')"><b>${esc(x.name)}</b> <span class="${x.rarity==5?'t5':'t4'}">${x.rarity?'★'.repeat(x.rarity):''}</span><div class="small">${esc([x.vision,x.weapon,x.nation].filter(Boolean).join(' · '))}${x.custom?' · custom':''}</div></div>`).join('')+customForm('chars');
  const wr=val('wR'),wt=val('wT');
  $('weaponCat').innerHTML=filt(D.weapons,val('wQ')).filter(x=>(!wr||String(x.rarity)==wr)&&(!wt||x.type==wt)).map(x=>`<div class="item"><b>${esc(x.name)}</b> <span class="${x.rarity==5?'t5':'t4'}">${x.rarity?'★'.repeat(x.rarity):''}</span><div class="small">${esc([x.type,x.atk&&'ATK '+x.atk,x.sub,x.passive].filter(Boolean).join(' · '))}</div></div>`).join('')||'<p class="small">No weapon data loaded yet.</p>';
  $('artCat').innerHTML=filt(D.arts,val('aQ')).map(x=>`<div class="item"><b>${esc(x.name)}</b><div class="small">${x.b2?'2pc: '+esc(x.b2)+'<br>':''}${x.b4?'4pc: '+esc(x.b4):''}</div></div>`).join('')||'<p class="small">No artifact data loaded yet.</p>';
  list('characters','characterList',x=>'<b>'+esc(x.name)+'</b> · '+esc(x.weapon)+'<div class="small">'+esc(x.set)+' | '+esc(x.notes)+'</div>');
  list('teams','teamList',x=>'<b>'+x.members.filter(Boolean).map(esc).join(' / ')+'</b><div class="small">'+esc(x.notes)+'</div>');
  list('weapons','weaponList',x=>'<b>'+esc(x.name)+'</b> · '+esc(x.user)+'<div class="small">'+esc(x.notes)+'</div>');
  list('farming','farmList',(x,i)=>{const h=+x.have||0,n=+x.amount||0,p=n?Math.min(100,h/n*100):0;return `<b>${esc(x.char||'')}</b> ${esc(x.type||'')} ${esc(x.item)}<div class="small">${h} / ${n||'?'} <button class="x" onclick="farmAdj(${i},-1)">−</button> <button class="x" onclick="farmAdj(${i},1)">+</button> <button class="x" onclick="farmAdj(${i},10)">+10</button></div><div class="bar"><i style="width:${p}%"></i></div>`});
  list('rankings','rankList',x=>esc(x.note));
  const tl=get('tiers'),ord='SABCD';$('tierList').innerHTML=ord.split('').map(t=>{const m=tl.map((x,i)=>[x,i]).filter(([x])=>x.tier==t);return m.length?`<div class="item"><b class="t5">${t}</b> `+m.map(([x,i])=>`<span class="tag" onclick="del('tiers',${i})">${esc(x.name)} ✕</span>`).join('')+'</div>':''}).join('');
  list('owned','ownList',x=>esc(x.name)+' <span class="tag">'+esc(x.c)+'</span>');
  homeInfo();const d=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()],n=new Date().getDay();
  $('today').innerHTML=`<b>${d}:</b> `+(n==0?'all talent-book domains are open.':`talent domains with the ${['','1st','2nd','3rd'][[0,1,2,3,1,2,3][n]]} book of each region are open (Mon/Thu 1st, Tue/Fri 2nd, Wed/Sat 3rd).`);
  const b=BUILDS.builds[val('charName')];$('recBuild').innerHTML=b?`<span class="tag">Recommended</span>${esc(b.weapons.join(' / '))} · ${esc(b.sets)}<br>${esc(b.stats)}`:'';
  const ct=val('t1')||val('t2')||val('t3')||val('t4');$('recTeams').innerHTML='<b>Recommended teams</b><br>'+BUILDS.teams.map(t=>`${esc(t.name)}: ${t.members.map(esc).join(' / ')} <button class="x" onclick='useTeam(${JSON.stringify(t.members)})'>Use</button>`).join('<br>');
}
function customForm(k){return `<div class="item"><div class="small">Missing a newly released character? Add it:</div><div class="row"><input id="cu_${k}" placeholder="Name"><button class="action" onclick="addCustom('${k}')">Add</button></div></div>`}
function addCustom(k){const n=val('cu_'+k).trim();if(!n)return;const c=get('custom');c.push({k,name:n});put('custom',c);apply()}
function go(id){document.querySelectorAll('nav button')[names.findIndex(x=>x[0]==id)].click()}
function pickChar(n){$('charName').value=n;$('farmChar').value=n;$('ownChar').value=n;go('characters');render()}
['fQ','fEl','fR','wQ','wR','wT','aQ','charName'].forEach(i=>$(i).addEventListener('input',render));
function useTeam(m){m.forEach((n,i)=>{$('t'+(i+1)).value=D.chars.some(c=>c.name==n)?n:''})}
// ---- storage helpers
function add(k,o){const a=get(k);a.push(o);put(k,a);render()}
function del(k,i){const a=get(k);a.splice(i,1);put(k,a);render()}
function list(k,id,fn){$(id).innerHTML=get(k).map((x,i)=>`<div class="item"><button class="x" aria-label="Delete" onclick="del('${k}',${i})">✕</button>${fn(x,i)}</div>`).join('')}
function saveCharacter(){if(!val('charName'))return alert('Choose a character first.');add('characters',{name:val('charName'),weapon:val('charWeapon'),set:val('charSet'),notes:val('charNotes')})}
function saveTeam(){const m=['t1','t2','t3','t4'].map(val).filter(Boolean);if(!m.length)return alert('Choose at least one character.');if(new Set(m).size<m.length)return alert('A character appears twice.');add('teams',{members:m,notes:val('teamNotes')})}
function saveWeapon(){if(!val('weaponName'))return alert('Choose a weapon first.');add('weapons',{name:val('weaponName'),user:val('weaponUser'),notes:val('weaponNotes')})}
function saveFarm(){if(!val('farmChar')&&!val('farmItem').trim())return alert('Choose a character or enter details.');add('farming',{char:val('farmChar'),type:val('farmType'),item:val('farmItem'),amount:val('farmAmount'),have:0})}
function farmAdj(i,d){const a=get('farming');a[i].have=Math.max(0,(+a[i].have||0)+d);put('farming',a);render()}
function saveRank(){if(val('rankNote').trim())add('rankings',{note:val('rankNote')})}
function saveTier(){if(!val('tierChar'))return;const t=get('tiers').filter(x=>x.name!=val('tierChar'));t.push({name:val('tierChar'),tier:val('tierVal')});put('tiers',t);render()}
function saveOwn(){if(!val('ownChar'))return;const t=get('owned').filter(x=>x.name!=val('ownChar'));t.push({name:val('ownChar'),c:val('ownC')});t.sort((a,b)=>a.name.localeCompare(b.name));put('owned',t);render()}
// ---- calculators
const n=id=>Number(val(id))||0;
function scoreArtifact(){$('artifactResult').textContent='Estimated score: '+(n('cr')*2+n('cd')+n('atk')*.5+n('er')*.3).toFixed(1)+' points'}
function calcDamage(){const raw=n('baseAtk')*n('mult')/100*(1+n('bonus')/100);$('damageResult').textContent='Non-crit: '+Math.round(raw).toLocaleString()+' · Crit: '+Math.round(raw*(1+n('crit')/100)).toLocaleString()}
function compare(){const f=p=>n(p+'a')*n(p+'m')/100*(1+n(p+'b')/100)*(1+Math.min(100,n(p+'r'))/100*n(p+'d')/100),A=f('a'),B=f('b');
  $('cmpResult').innerHTML=`A: ${Math.round(A).toLocaleString()}<br>B: ${Math.round(B).toLocaleString()}<br>${A==B?'Equal':(A>B?'A':'B')+' is '+(Math.abs(A-B)/Math.min(A,B)*100).toFixed(1)+'% higher'}`}
function saveAccount(){put('account',{ar:val('ar'),wl:val('wl'),primos:val('primos'),fates:val('fates'),pityC:val('pityC'),pityW:val('pityW'),notes:val('accountNotes')});
  const p=Math.floor(n('primos')/160)+n('fates');$('accountResult').innerHTML=`Saved on this device.<br>${p} pulls available · ${Math.max(0,90-n('pityC'))} to character hard pity · ${Math.max(0,80-n('pityW'))} to weapon hard pity`}
// ---- init
const a=get('account',null);if(a){['ar','wl','primos','fates','pityC','pityW'].forEach(k=>$(k).value=a[k]||'');$('accountNotes').value=a.notes||''}
$('feedUrl').value=get('feed','');
apply();loadBanners();jget('builds.json').then(b=>{BUILDS=b;render()}).catch(()=>{});loadData();

// ---- home, resin, map
const TILES=[['banners','✦','Banners','#f0b232'],['roster','◈','Roster','#b57dff'],['characters','⚔','Builds','#ff6a4d'],['teams','❖','Teams','#3b8cff'],['map','✧','Map','#33d6b5'],['farming','☼','Farming','#8bd13f'],['compare','⇄','Compare','#9fe8f0'],['account','♜','Account','#f0b232']];
$('tiles').innerHTML=TILES.map(([id,g,l,c])=>`<button class="tile" style="--c:${c}" onclick="go('${id}')"><span>${g}</span>${l}</button>`).join('');
function setResin(){const v=Math.max(0,Math.min(160,n('resinIn')));put('resin',{v,t:Date.now()});homeInfo()}
function homeInfo(){const h=new Date().getHours();$('greet').textContent=(h<5?'Still up':h<12?'Good morning':h<18?'Good afternoon':'Good evening')+', Traveler';
  const dn=new Date().getDay();$('homeDay').textContent=dn==0?'Sunday: all talent domains are open.':'Today: '+['','1st','2nd','3rd'][[0,1,2,3,1,2,3][dn]]+' talent books.';
  const r=get('resin',null);if(r){const v=Math.min(160,r.v+Math.floor((Date.now()-r.t)/48e4));$('resinNow').textContent=v;const m=(160-v)*8;$('resinFull').textContent=v>=160?'Full! Spend it.':'Full in '+Math.floor(m/60)+'h '+m%60+'m'}else{$('resinNow').textContent='–';$('resinFull').textContent='Enter your resin to track it'}
  const o=get('owned'),a=get('account',null);$('homeStats').innerHTML=`${o.length} characters logged${a&&a.ar?' · AR '+esc(a.ar):''}${a&&a.wl?' · WL '+esc(a.wl):''}<br>${get('characters').length} builds · ${get('teams').length} teams saved`}
setInterval(homeInfo,3e4);
const MAPS=[['Teyvat Map',''],['Enkanomiya','enkanomiya/'],['The Chasm','chasm/'],['Sea of Bygone Eras','sea-of-bygone-eras/'],['Ancient Sacred Mountain','ancient_sacred_mountain/'],['Temple of Space','temple_of_space/'],['Frost Moon','frost_moon/']];
const MB='https://genshin-impact-map.appsample.com/';
$('mapSel').innerHTML=MAPS.map(([l,p])=>`<option value="${p}">${l}</option>`).join('');$('mapSel').value=get('mapSel','');
$('mapSel').onchange=()=>{put('mapSel',val('mapSel'));if(!$('mapFrame').hidden)loadMap()};
function loadMap(){const f=$('mapFrame');f.hidden=false;f.src=MB+val('mapSel')}
function openMap(){window.open(MB+val('mapSel'),'_blank','noopener')}
function fsMap(){const f=$('mapFrame');if(f.hidden)loadMap();(f.requestFullscreen||f.webkitRequestFullscreen||(()=>openMap())).call(f)}
homeInfo();
