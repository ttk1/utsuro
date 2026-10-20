// ゲームを jsdom で序章から終章まで通しプレイする。途中の誤答メッセージは目視用に表示する
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','game','index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/'});
const w=dom.window,d=w.document;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
const note=()=>d.querySelector('[data-win="note"]');
function submitStep(i,fill){const f=note().querySelector(`form[data-s="${i}"]`);fill(f);f.dispatchEvent(new w.Event('submit',{cancelable:true}));const fb=d.getElementById('fb-'+i);return fb?fb.textContent:'';}
const txt=(i,v)=>submitStep(i,f=>f.querySelector('input').value=v);
const ch=(i,v)=>submitStep(i,f=>f.querySelector('select').value=String(v));
const mu=(i,arr)=>submitStep(i,f=>f.querySelectorAll('input[type=checkbox]').forEach(c=>c.checked=arr.includes(+c.value)));
const next=()=>d.getElementById('nx').click();
const open=id=>d.querySelector(`#icons [data-app="${id}"]`).click();

d.getElementById('start').click();
console.log('narr:',d.querySelector('#narr .who').textContent,'| windows:',[...d.querySelectorAll('.win')].map(x=>x.dataset.win).join(','));
console.log(txt(0,'toru'));txt(0,'ghostwire');next();
console.log(mu(0,[0,3]));mu(0,[0,1,2]);console.log(txt(1,'渋谷'));txt(1,'月見台二丁目');next();
open('map');console.log('map pins',d.querySelectorAll('.pin').length);
const inp=d.getElementById('mq');inp.value='ランドリー';inp.dispatchEvent(new w.Event('input'));console.log('results',d.querySelectorAll('#mres button').length);
d.querySelector('#mres button').click();console.log(d.querySelector('.placecard .ttl').textContent);
ch(0,1);console.log(txt(1,'ーリドンラ ミキツ'));txt(1,'ツキミ ランドリー');console.log(txt(2,'メゾン月見台'));txt(2,'コーポ月見台');next();
const t=d.getElementById('tin'),tf=d.getElementById('tform');for(const c of ['history','analytics UA-48213077-2','constructor','curl kuga-housing.jp/properties/corpo-tsukimi']){t.value=c;tf.dispatchEvent(new w.Event('submit',{cancelable:true}))}
console.log(d.getElementById('tout').textContent.slice(-200));
txt(0,'kuga-housing.jp');console.log(txt(1,'301'));txt(1,'302');next();
open('hash');const rows=d.querySelectorAll('#htab tr.pick');rows[1].click();rows[7].click();console.log(d.getElementById('hcmp').textContent);
console.log(txt(0,'10/09'));txt(0,'10月12日');ch(1,1);open('video');txt(2,'腕時計');next();
open('seam');d.querySelector('.seg button[data-v="d"]').click();console.log(d.getElementById('dcap').textContent);
ch(0,1);console.log(ch(1,0));ch(1,3);console.log(mu(2,[0,3]));mu(2,[0,1,2]);next();

// 終章まで進めてスクリプトエラーがなければ成功
const ok=d.querySelector('.ending h2')?.textContent==='招かれた者'&&errs.length===0;
console.log(ok?'OK: 全章クリア':'NG: 終章に到達しないか、エラーが出た','errors:',errs);
process.exit(ok?0:1);
