// ゲームを jsdom で第一話・第二話とも最初から終章まで通しプレイする。途中の誤答メッセージは目視用に表示する
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','game','index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/'});
const w=dom.window,d=w.document;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
const note=()=>d.querySelector('[data-win="note"]');
function submitStep(i,fill){const f=note().querySelector(`form[data-s="${i}"]`);fill(f);f.dispatchEvent(new w.Event('submit',{cancelable:true}));const fb=d.getElementById('fb-'+i);return fb?fb.textContent:'';}
const txt=(i,v)=>submitStep(i,f=>f.querySelector('input').value=v);
const ch=(i,v)=>submitStep(i,f=>f.querySelector(`input[value="${v}"]`).checked=true);
const mu=(i,arr)=>submitStep(i,f=>f.querySelectorAll('input[type=checkbox]').forEach(c=>c.checked=arr.includes(+c.value)));
const next=()=>d.getElementById('nx').click();
const open=id=>d.querySelector(`#icons [data-app="${id}"]`).click();

d.getElementById('start').click();
console.log('narr:',d.querySelector('#narr .who').textContent,'| windows:',[...d.querySelectorAll('.win')].map(x=>x.dataset.win).join(','));
console.log(txt(0,'toru'));txt(0,'ghostwire');next();
console.log('chat badge:',!!d.querySelector('#icons [data-app=chat] .badge'));open('chat');console.log('chat badge after open:',!!d.querySelector('#icons [data-app=chat] .badge'));
// ヒントは問題ごと。開いても入力途中の答えは消えない
const hintBtn=()=>note().querySelector('[data-hint]');
note().querySelector('.opts input').checked=true;hintBtn().click();hintBtn().click();
const hintOk=note().querySelectorAll('.hint').length===2&&!hintBtn()&&note().querySelector('.opts input').checked;
console.log('hints:',hintOk?'ok':'NG');
console.log(mu(0,[0,3]));mu(0,[0,1,2]);console.log('next step hints:',note().querySelectorAll('.hint').length,'/',hintBtn().textContent);
console.log(txt(1,'渋谷'));txt(1,'月見台二丁目');next();
// 配信の録画: 左右反転で透が一言反応し、語りに差しこまれる。再生は始めて止められる（音は jsdom では鳴らない）
d.getElementById('lvflip').click();d.getElementById('lvplay').click();d.getElementById('lvplay').click();
const liveOk=d.querySelector('#live svg').style.transform==='scaleX(-1)'&&/左右が逆/.test(d.querySelector('#narr .txt').textContent+NRtext());
console.log('live:',liveOk?'ok':'NG');
open('map');console.log('map pins',d.querySelectorAll('.pin').length);
const inp=d.getElementById('mq');inp.value='ランドリー';inp.dispatchEvent(new w.Event('input'));console.log('results',d.querySelectorAll('#mres button').length);
d.querySelector('#mres button').click();console.log(d.querySelector('.placecard .ttl').textContent);
console.log(txt(0,'北総貨物線'));txt(0,'東湾貨物線');console.log(txt(1,'ーリドンラ ミキツ'));txt(1,'ツキミ ランドリー');console.log(txt(2,'メゾン月見台'));txt(2,'コーポ月見台');next();
const t=d.getElementById('tin'),tf=d.getElementById('tform');for(const c of ['history','analytics UA-48213077-2','constructor','curl kuga-housing.jp/properties/corpo-tsukimi']){t.value=c;tf.dispatchEvent(new w.Event('submit',{cancelable:true}))}
t.value='';t.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowUp'}));console.log('history recall:',t.value);t.value='';
console.log(d.getElementById('tout').textContent.slice(-200));
txt(0,'kuga-housing.jp');console.log(txt(1,'301'));txt(1,'302');next();
open('hash');const rows=d.querySelectorAll('#htab tr.pick');rows[1].click();rows[7].click();console.log(d.getElementById('hcmp').textContent);
console.log(txt(0,'10/09'));txt(0,'10月12日');ch(1,1);open('video');txt(2,'腕時計');next();
open('seam');d.querySelector('.seg button[data-v="d"]').click();console.log(d.getElementById('dcap').textContent);
console.log(txt(0,'黒澄レイ'));txt(0,'久我圭吾');console.log(ch(1,1));ch(1,0);ch(2,1);console.log(ch(3,1));ch(3,2);ch(4,3);
// 対決で3回まちがえると、最初の言い分からやり直しになる
txt(5,'天井裏');const duelOk=!!note().querySelector('form[data-s="1"]')&&d.querySelector('#narr .who').textContent==='久我';
console.log('duel reset:',duelOk?'ok':'NG');
ch(1,0);ch(2,1);ch(3,2);ch(4,3);txt(5,'押入れ');next();

const ok1=d.querySelector('.ending h2')?.textContent==='招かれた者';
console.log(d.querySelector('.ending .endbtns').previousElementSibling.textContent);
console.log('第一話:',ok1?'クリア':'終章に届かない');

// 第二話: エンディングからタイトルに戻って始める
d.getElementById('endBack').click();d.getElementById('menuBtn').click();d.getElementById('mtitle').click();
console.log('title buttons:',d.getElementById('start').textContent,'/',d.getElementById('start2').textContent);
d.getElementById('start2').click();
console.log('ep2 theme:',d.getElementById('screen').className,'| windows:',[...d.querySelectorAll('.win')].map(x=>x.dataset.win).join(','));
console.log(txt(0,'10/12'));console.log(txt(0,'10/10'));txt(0,'10月11日');console.log(ch(1,0));ch(1,1);next();
console.log(mu(0,[0,3]));mu(0,[0,1,2]);console.log(ch(1,2));ch(1,1);
open('term');for(const c of ['whois utsuro.tv','trace https://utsuro.tv/live','constructor']){t2(c)}
console.log(d.getElementById('tout').textContent.slice(-160));
console.log(txt(2,'tsubaki'));txt(2,'holly');next();
console.log(txt(0,'真壁さんの家'));txt(0,'月見台の跡地');ch(1,0);console.log(mu(2,[0,3]));mu(2,[0,1,2]);next();
open('search');const sq=d.getElementById('sq');sq.value='木工務店 4721';sq.form.dispatchEvent(new w.Event('submit',{cancelable:true}));console.log('search hits:',d.querySelectorAll('#sres .doc').length);
console.log(txt(0,'並木工務店'));txt(0,'高木工務店');console.log(txt(1,'9/30'));txt(1,'10/1');txt(2,'9/27');console.log(ch(3,1));ch(3,2);next();
d.querySelector('[data-day="10/11"]').click();console.log('net bars:',d.querySelectorAll('#netbox rect').length);
txt(0,'4月14日');console.log(txt(1,'5:14'));txt(1,'3:52');console.log(ch(2,0));ch(2,2);next();
console.log(mu(0,[0,1,2,3,4]));mu(0,[0,1,2,3]);console.log(txt(1,'10/27'));txt(1,'10/28');ch(2,1);next();
ch(0,0);ch(1,1);ch(2,0);console.log(ch(3,1));ch(3,0);console.log(txt(4,'天井'));txt(4,'ポケットの合鍵');next();
const ok2=d.querySelector('.ending h2')?.textContent==='不在証明';
console.log('第二話:',ok2?'クリア':'終章に届かない');

// 両方の終章まで進めてスクリプトエラーがなければ成功
const ok=ok1&&ok2&&hintOk&&duelOk&&liveOk&&errs.length===0;
console.log(ok?'OK: 全章クリア':'NG: 終章に到達しないか、エラーが出た','errors:',errs);
process.exit(ok?0:1);
// 語りは一文字ずつ出るので、出しきってから読む（語りをクリックすると全文が出る）
function NRtext(){d.getElementById('narr').click();return d.querySelector('#narr .txt').textContent}
function t2(c){const t=d.getElementById('tin');t.value=c;d.getElementById('tform').dispatchEvent(new w.Event('submit',{cancelable:true}))}
