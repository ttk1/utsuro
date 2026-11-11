// ゲームを jsdom で第一話・第二話とも最初から終章まで通しプレイする。途中の誤答メッセージは目視用に表示する
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','game','index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://example.test/'});
const w=dom.window,d=w.document;const errs=[];w.addEventListener('error',e=>errs.push(e.message));
const checks={};const check=(name,ok)=>{checks[name]=!!ok;console.log(name+':',ok?'ok':'NG')};
const note=()=>d.querySelector('[data-win="note"]');
const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
// 語りを最後まで読む（対決の言い分と解明の続きは、語りを読み終えるまでノートに出ない）
const readAll=()=>{for(let k=0;k<12;k++)d.getElementById('narr').click()};
function submitStep(i,fill){readAll();const f=note().querySelector(`form[data-s="${i}"]`);fill(f);f.dispatchEvent(new w.Event('submit',{cancelable:true}));const fb=d.getElementById('fb-'+i);return fb?fb.textContent:'';}
const txt=(i,v)=>submitStep(i,f=>f.querySelector('input').value=v);
const ch=(i,v)=>submitStep(i,f=>f.querySelector(`input[value="${v}"]`).checked=true);
const mu=(i,arr)=>submitStep(i,f=>f.querySelectorAll('input[type=checkbox]').forEach(c=>c.checked=arr.includes(+c.value)));
// 対決: 集めた証拠から一つ選んで突きつける
const ev=ch;
// 証拠をつかむ: ノートの枠の×で全部外してから、アプリの中の要素を押してつかみ、結びつける
const grab=id=>{const el=d.querySelector(`#wins [data-ev="${id}"]`);if(!el)throw new Error('つかめる要素がない: '+id);click(el)};
const ungrab=()=>{let b;while((b=note().querySelector('[data-un]')))click(b)};
// 問題は語りを読み終えるまでノートに出ず、つかむこともできないので、先に読む
const pk=(i,ids)=>{readAll();ungrab();ids.forEach(grab);return submitStep(i,()=>{})};
const next=()=>{readAll();d.getElementById('nx').click()};
const open=id=>d.querySelector(`#icons [data-app="${id}"]`).click();
const S=()=>w.eval('S');
const term=c=>{const t=d.getElementById('tin');t.value=c;d.getElementById('tform').dispatchEvent(new w.Event('submit',{cancelable:true}));return d.getElementById('tout').textContent};
// 語りは一文字ずつ出るので、出しきってから読む（語りをクリックすると全文が出る）
const NRtext=()=>{d.getElementById('narr').click();return d.querySelector('#narr .txt').textContent};

// 効果音を「あり」にして通す（jsdom には AudioContext がないので鳴らないが、鳴らす場所をすべて通って落ちないことを確かめる）
d.getElementById('tsound').click();
check('sound on',/あり/.test(d.getElementById('tsound').textContent)&&/"sound":true/.test(w.localStorage.getItem('utsuro-pref-v1')));
d.getElementById('start').click();
// つかみ: 第一話を初めて始めるときだけ、序章の前に配信が映る。押すと飛ばせて、二度目からは出ない
const cold=d.getElementById('cold');
check('cold open',!cold.hidden&&!!cold.querySelector('.stream svg')&&/招かれます/.test(cold.textContent)&&d.querySelectorAll('.win').length===0);
click(cold);
check('cold open skip',cold.hidden&&!cold.innerHTML&&/"cold":true/.test(w.localStorage.getItem('utsuro-pref-v1'))&&!!note());
d.getElementById('menuBtn').click();d.getElementById('mtitle').click();d.getElementById('start').click();
check('cold open once',cold.hidden&&d.getElementById('title').hidden&&/配信/.test(d.getElementById('cast').textContent));
// 章の語りを読み終えるまで、最初の疑問はノートに出ない
check('question waits',!!note().querySelector('.task.wait')&&!note().querySelector('form[data-s]'));
console.log('narr:',d.querySelector('#narr .who').textContent,'| windows:',[...d.querySelectorAll('.win')].map(x=>x.dataset.win).join(','));
console.log(txt(0,'toru'));txt(0,'ghostwire');
// 章を解き終えると、語りの最後の行にも次へ進むボタンが出る
readAll();check('next in narration',!!d.querySelector('#narr [data-nn]'));d.querySelector('#narr [data-nn]').click();
// チャットの通知と未読の印は、語りが「スマホが震えた」に届いてから。語りを読むまでは、証拠もつかめない
const due0=w.eval('chatDue(CH[S.cur])'),pick0=d.getElementById('wins').classList.contains('picking');readAll();
check('chat after narration',!due0&&!pick0&&w.eval('chatDue(CH[S.cur])'));open('chat');check('chat seen',!w.eval('chatDue(CH[S.cur])'));

// 第一章: 証拠をつかんで結びつける。ヒントを開いても、つかんだ証拠は消えない
['blog','admin','draft','loc'].forEach(open);
const hintBtn=()=>note().querySelector('[data-hint]');
check('picking mark',d.getElementById('wins').classList.contains('picking')&&!d.getElementById('pickbar').hidden);
grab('b2');hintBtn().click();hintBtn().click();
check('hints',note().querySelectorAll('.hint').length===2&&!hintBtn()&&note().querySelectorAll('.slot.on').length===1&&d.querySelector('[data-ev="b2"]').classList.contains('held'));
console.log(pk(0,['b2','a4','b0']));
const m0=S().miss;console.log(pk(0,['b2','b0','d0']));
check('pick hold',S().miss===m0);
// 枠は3つ。4つ目をつかむと、いちばん古いものと入れ替わる
ungrab();['a0','b2','b0','a5'].forEach(grab);
check('pick fifo',w.eval('PK.sel.join()')==='b2,b0,a5');
// 枠がそろうと、下の帯のボタンが「結びつける」になり、そのまま判定できる
check('tray button',!!d.querySelector('#pickbar [data-go]')&&!d.querySelector('#pickbar [data-tonote]'));
click(d.querySelector('#pickbar [data-go]'));check('tray submit',S().done['1-0']!==undefined);
// 書き方の違いに気づいたあと、透の一言（lead）を読み終えるまで、次の疑問は出ない
check('lead after first find',!!note().querySelector('.task.wait')&&/二つの文章/.test(NRtext()));readAll();
console.log('next step hints:',note().querySelectorAll('.hint').length,'/',hintBtn().textContent);
console.log(pk(1,['a5','l0']));console.log(pk(1,['a5','l4']));pk(1,['a5','l5']);
check('pick done',!d.getElementById('wins').classList.contains('picking')&&d.getElementById('pickbar').hidden);next();

// 配信の録画: 左右反転で透が一言反応し、語りに差しこまれる。再生は始めて止められる（音は jsdom では鳴らない）
// 配信のウィンドウは、語りが「ふっと明るくなった」に届くまで黒い画面のまま
const pre0=d.getElementById('live').classList.contains('pre');readAll();
check('live lights up',pre0&&!d.getElementById('live').classList.contains('pre'));
d.getElementById('lvflip').click();d.getElementById('lvplay').click();d.getElementById('lvplay').click();
check('live',d.querySelector('#live svg').style.transform==='scaleX(-1)'&&/左右が逆/.test(d.querySelector('#narr .txt').textContent+NRtext()));
open('map');console.log('map pins',d.querySelectorAll('.pin').length);
const inp=d.getElementById('mq');inp.value='ランドリー';inp.dispatchEvent(new w.Event('input'));console.log('results',d.querySelectorAll('#mres button').length);
d.querySelector('#mres button').click();console.log(d.querySelector('.placecard .ttl').textContent);
console.log(txt(0,'北総貨物線'));txt(0,'とうわんかもつせん');console.log(txt(1,'ーリドンラ ミキツ'));txt(1,'ツキミ ランドリー');console.log(txt(2,'メゾン月見台'));txt(2,'コーポ月見台');next();
// 端末の候補: 引数の要らないものは押すと実行され、引数の候補（これまで端末に出たもの）は入力欄の続きに足される
const chip=s=>[...d.querySelectorAll('#tchips button')].find(b=>b.textContent===s);
chip('history').click();chip('view-source ').click();chip('utsuro.tv').click();
check('term chips',/途切れている/.test(d.getElementById('tout').textContent)&&d.getElementById('tin').value==='view-source utsuro.tv'&&!chip('UA-48213077-2'));
term(d.getElementById('tin').value);term('curl kuga-housing.jp');chip('curl ').click();chip('kuga-housing.jp').click();chip('/properties/corpo-tsukimi').click();
check('term args',!!chip('UA-48213077-2')&&d.getElementById('tin').value==='curl kuga-housing.jp/properties/corpo-tsukimi');
for(const c of ['history','analytics UA-48213077-2','constructor','curl kuga-housing.jp/properties/corpo-tsukimi'])term(c);
const t=d.getElementById('tin');t.value='';t.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowUp'}));console.log('history recall:',t.value);t.value='';
console.log(d.getElementById('tout').textContent.slice(-200));
txt(0,'kuga-housing.jp');console.log(txt(1,'301'));txt(1,'302');next();

// 第四章: ハッシュ値の行をつかむと、比較の欄にも出る
open('hash');
console.log(pk(0,['h6','h1']));console.log(pk(0,['h8','h2']));console.log(pk(0,['h7','h10']));pk(0,['h7','h1']);
console.log(d.getElementById('hcmp').textContent);
check('hash compare',/完全に一致/.test(d.getElementById('hcmp').textContent));
console.log(pk(1,['h7','h8','h9']));pk(1,['h1','h2','h3']);open('video');
// 狭い画面では、気づきの一言で語りを開かない（開くとウィンドウが縮んで、押していた所がずれる）。ウィンドウの上に重ねて出し、「語りを表示」に印を付ける
w.matchMedia=q=>({matches:/max-width:760px/.test(q)});d.querySelector('#narr [data-nh]').click();
const br=d.getElementById('br');br.value='6';br.dispatchEvent(new w.Event('input'));
check('whisper',d.getElementById('narr').hidden&&/人影/.test(d.querySelector('.whisper')?.textContent||'')&&d.getElementById('narrBtn').classList.contains('new'));
d.getElementById('narrBtn').click();
check('whisper opens',!d.getElementById('narr').hidden&&/人影/.test(NRtext())&&!d.querySelector('.whisper')&&!d.getElementById('narrBtn').classList.contains('new'));
delete w.matchMedia;
txt(2,'腕時計');next();

// 第五章: 対決。集めた証拠を突きつける。3回まちがえると、一つ前の言い分に押し返される（最初までは戻らない）
open('seam');d.querySelector('.seg button[data-v="d"]').click();console.log(d.getElementById('dcap').textContent);
console.log(txt(0,'黒澄レイ'));txt(0,'久我圭吾');
readAll();check('evidence list',note().querySelectorAll('.evlist input').length===11&&!!note().querySelector('.fusebox'));
// 新しく手に入れた証拠が上に並び、この章で手に入れたものに「新」と付く
check('evidence order',note().querySelector('.evlist input').value==='key'&&note().querySelectorAll('.evlist .new').length===1&&!!note().querySelector('.evlist label .new').closest('label').querySelector('input[value="key"]'));
console.log(ev(1,'mirror'));ev(1,'freight');
// 崩した言い分は、相手のせりふに取り消し線が付いて残る（「どの証拠を突きつける？」は消える）
check('struck',/ありのまま/.test(note().querySelector('.done-step.duel s.brkq')?.textContent||'')&&!/突きつける？/.test(note().querySelector('.done-step.duel').textContent));
ev(2,'ua');console.log(ev(3,'style'));ev(3,'loc');ev(4,'watch');
txt(5,'天井裏');
check('duel steps back',!note().querySelector('form[data-s="4"]')&&!!note().querySelector('.task.wait')&&d.querySelector('#narr .who').textContent==='久我'&&S().done['5-3']!==undefined&&S().done['5-4']===undefined);
// 時間切れは1回まちがえたのと同じ扱い（jsdom ではタブが隠れた扱いで止まるので、見えていることにして時計を直接進める）
Object.defineProperty(d,'hidden',{get:()=>false,configurable:true});d.getElementById('card').click();
// 語りに読んでいない続きがあるあいだも止まる。最後まで読むと動きだす
w.eval('fuse=50;fuseTick()');const waits=w.eval('fuse')===50;for(let k=0;k<6;k++)d.getElementById('narr').click();
const m1=S().miss;w.eval('fuse=1;fuseTick()');check('fuse waits for narration',waits);
check('fuse timeout',S().miss===m1+1&&S().duel[5]===1&&w.eval('fuse')===90&&/時間切れ/.test(d.getElementById('fb-4').textContent)&&/鍵を閉めます/.test(NRtext()));
// 語りを読み返して未読の続きができても、止まるのは一つの言い分につき合計 20 秒まで。21 秒目から減りはじめる
w.eval('fuseReset();NR.i=0');let g=true;for(let k=0;k<20;k++){w.eval('fuseTick()');g=g&&w.eval('fuse')===90}
w.eval('fuseTick()');check('fuse grace 20s',g&&w.eval('NR.lines.length')>1&&w.eval('fuse')===89);w.eval('NR.i=NR.lines.length-1;fuseReset()');
// 言い分がまだ出ていないあいだ（前の語りを読んでいるところ）は、20 秒を過ぎても減らない
w.eval('NR.hold=true;NR.i=0;for(let k=0;k<30;k++)fuseTick()');check('fuse holds',w.eval('fuse')===90);w.eval('NR.hold=false;NR.i=NR.lines.length-1;fuseReset()');
// メニューを開いているあいだは止まる。「時間制限：なし」にするとゲージが消え、減らなくなる
d.getElementById('menuBtn').click();w.eval('fuse=50;fuseTick()');const paused=w.eval('fuse')===50;
d.getElementById('mtimer').click();d.getElementById('menuBtn').click();w.eval('fuse=1;fuseTick()');
check('fuse off',paused&&S().miss===m1+1&&!note().querySelector('.fusebox')&&d.getElementById('fuse').hidden&&/"timer":false/.test(w.localStorage.getItem('utsuro-pref-v1')));
d.getElementById('menuBtn').click();d.getElementById('mtimer').click();d.getElementById('menuBtn').click();
check('fuse on',!!note().querySelector('.fusebox')&&!d.getElementById('fuse').hidden);
ev(4,'watch');txt(5,'押入れ');next();

const ok1=d.querySelector('.ending h2')?.textContent==='招かれた者';
console.log(d.querySelector('.ending .endbtns').previousElementSibling.textContent);
console.log('第一話:',ok1?'クリア':'終章に届かない');

// 第二話: エンディングからタイトルに戻って始める
d.getElementById('endBack').click();d.getElementById('menuBtn').click();d.getElementById('mtitle').click();
console.log('title buttons:',d.getElementById('start').textContent,'/',d.getElementById('start2').textContent);
d.getElementById('start2').click();
console.log('ep2 theme:',d.getElementById('screen').className,'| windows:',[...d.querySelectorAll('.win')].map(x=>x.dataset.win).join(','));
console.log(txt(0,'10/12'));console.log(txt(0,'10/10'));txt(0,'10月11日');
open('plan');console.log(pk(1,['pA']));pk(1,['pB']);next();
open('chat');console.log(pk(0,['t0','t1','m0']));console.log(pk(0,['t0','m0','m2']));pk(0,['t0','m0','m1']);console.log(ch(1,2));ch(1,1);
open('term');for(const c of ['whois utsuro.tv','trace https://utsuro.tv/live','constructor'])term(c);
console.log(term('connect tohto-sec').slice(-40));
txt(2,'tsubaki');txt(2,'holly');next();
console.log(txt(0,'真壁さんの家'));txt(0,'月見台の跡地');
open('timetable');console.log(pk(1,['y9','s0','s2']));console.log(pk(1,['s1','s2','s3']));pk(1,['y9','s1','s2']);
console.log(mu(2,[0,3]));mu(2,[0,1,2]);next();
open('search');const sq=d.getElementById('sq');sq.value='木工務店 4721';sq.form.dispatchEvent(new w.Event('submit',{cancelable:true}));console.log('search hits:',d.querySelectorAll('#sres .doc').length);
console.log(txt(0,'並木工務店'));txt(0,'高木工務店');console.log(txt(1,'9/30'));txt(1,'10/1');txt(2,'9/27');
const noTerm=!d.querySelector('#icons [data-app="term"]');console.log(txt(3,'10/27'));txt(3,'10/28');

// 第四章の終わり: 警備会社のサーバーに入る。写さない道と、写して自分で消す道の両方を通す（写さない道のあと、保存データを戻してやり直す）
const before=w.localStorage.getItem('utsuro2-save-v3');
readAll();check('breach opens',noTerm&&!!d.querySelector('#icons [data-app="term"]')&&/線を越える/.test(note().querySelector('.task').textContent));
open('term');
console.log(term('ls').slice(-30));term('connect tohto-sec');term('ls');console.log(term('ls 0928').slice(-60));
term('play 9/28 0:37');console.log(term('exit').slice(-60));term('play 1011 0421');
check('breach clips',d.querySelectorAll('#tout .stream svg').length===2&&/猫/.test(w.eval('NR.lines.map(l=>l[1]).join()')));
console.log(term('exit').slice(-30));term('wipe');term('exit');
readAll();check('breach no copy',S().copied===false&&/何もコピーしなかった/.test(note().querySelector('.solved').textContent)&&S().done['4-4']!==undefined);
w.localStorage.setItem('utsuro2-save-v3',before);
d.getElementById('menuBtn').click();d.getElementById('mtitle').click();d.getElementById('start2').click();
open('term');term('connect tohto-sec');term('play 0928 0037');term('play 1011 0421');term('copy 0928 0037');term('wipe');
console.log(term('exit').slice(-110));term('delete');console.log(NRtext());term('wipe');term('exit');
readAll();check('breach copy',S().copied===true&&/自分で消した/.test(note().querySelector('.solved').textContent)&&/信じるな/.test(note().querySelector('.solved').textContent));
next();

d.querySelector('[data-day="10/11"]').click();console.log('net bars:',d.querySelectorAll('#netbox rect').length);
// 回線のグラフは、左右のボタンで 1 分ずつ動かせる（最初の 1 回で 03:30 を選び、そこから 22 回で 03:52）
for(let k=0;k<23;k++)d.querySelector('[data-net="1"]').click();
check('net step',/03:52 ・ 1\d{3} KB/.test(d.getElementById('netcap').textContent));
txt(0,'4月14日');const noVisit=!d.querySelector('#icons [data-app="visit"]');console.log(txt(1,'5:14'));txt(1,'3:52');
open('visit');open('memo2');
console.log(pk(2,['v0','k1']));const m2=S().miss;console.log(pk(2,['v3','k0']));
check('visit',noVisit&&S().miss===m2);pk(2,['v3','k3']);next();
// 第六章: 架純の疑問に、正規に出せるものだけで答える（ゲージもやり直しもない）。「何も出さない」は誤答に数えず、最後の問いだけはそれが正解
// 章の語りを読み終えるまで、架純の最初の疑問はノートに出ない
check('doubt waits',!!note().querySelector('.task.wait')&&!note().querySelector('.evlist'));
console.log(ev(0,'lot'));const m4=S().miss;console.log(ev(0,'pass'));
check('pass not counted',S().miss===m4&&!note().querySelector('.fusebox')&&note().querySelectorAll('.evlist input').length===14);
ev(0,'net');ev(1,'lot');console.log(ev(2,'cal'));ev(2,'scaf');ev(3,'keep');console.log(ev(4,'raw'));console.log(ev(4,'keep'));
check('no duel reset',S().done['6-3']!==undefined);ev(4,'pass');
check('look away',/答えなかった/.test(note().textContent)&&/聞かないでおく/.test(w.eval('NR.lines.map(l=>l[1]).join()')));ch(5,1);next();

// 第七章: 待つ場所を決めると時計が進み、対決が始まる。線を越えて見たものは出せない
console.log('clock:',d.getElementById('clock').textContent);
console.log(pk(0,['p2']));pk(0,['p5']);
check('standby',/鍵穴/.test(NRtext())||/秒針/.test(d.querySelector('#narr .txt').textContent));
console.log(ev(1,'cam'));ev(1,'call');ev(2,'lot');
const m3=S().miss;console.log(ev(3,'warrant'));check('hold',S().miss===m3);ev(3,'scaf');
console.log(ev(4,'raw'));ev(4,'warrant');txt(5,'ポケットの合鍵');

// 時計の早回しが終わるのを待ってから、終章を確かめる
setTimeout(()=>{
  check('clock runs',/03:41/.test(d.getElementById('clock').textContent));
  // 効果音はメニューでも切り替えられる
  d.getElementById('menuBtn').click();d.getElementById('msound').click();
  check('sound off',/なし/.test(d.getElementById('msound').textContent)&&/"sound":false/.test(w.localStorage.getItem('utsuro-pref-v1')));d.getElementById('menuBtn').click();
  next();
  const end=d.querySelector('.ending'),ok2=end?.querySelector('h2')?.textContent==='不在証明';
  check('ending copy',/線を二度/.test(end.textContent)&&/手元に写しました/.test(end.textContent)&&/一度は手元に写して/.test(end.querySelector('.cap').textContent)&&!/手元に写しました/.test(w.eval('S.copied=false;ending2()')));
  console.log('第二話:',ok2?'クリア':'終章に届かない');
  // 両方の終章まで進めて、途中の確認がすべて通り、スクリプトエラーがなければ成功
  const bad=Object.keys(checks).filter(k=>!checks[k]);
  const ok=ok1&&ok2&&!bad.length&&errs.length===0;
  console.log(ok?'OK: 全章クリア':'NG: 終章に到達しないか、エラーが出た','failed:',bad,'errors:',errs);
  process.exit(ok?0:1);
},3200);
