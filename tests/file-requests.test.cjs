// Exercise the client-side workflow without uploading files or running a server.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
const source=readFileSync(join(__dirname,'../app/assets/file-requests.js'),'utf8');
const KEY='cloudike-demo-file-requests-v1';
class Element {
  constructor(tag='div'){this.tag=tag;this.textContent='';this.children=[];this.value='';this.files=[];this.hidden=false;this.disabled=false;this.listeners={};this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
  addEventListener(type,fn){this.listeners[type]=fn;}
  fire(type){return this.listeners[type]?.({preventDefault(){}});}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  focus(){}
  select(){this.selected=true;}
  showModal(){this.open=true;}
  close(){this.open=false;}
  setCustomValidity(message){this.validationMessage=message;}
  reportValidity(){return !this.validationMessage;}
}
function boot(storage=new Map(),hash='',storageFails=false){
  const elements=new Map();
  const $=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const location={origin:'https://acmexii.github.io',pathname:'/cloudikehome/app/file-requests/',hash};
  const events={};
  class DemoTransfer {constructor(){this.files=[];this.items={add:file=>this.files.push(file)};}}
  const context={document:{getElementById:$,createElement:tag=>new Element(tag),querySelectorAll:()=>[]},crypto:{randomUUID},Date,JSON,Number,Array,Error,encodeURIComponent,decodeURIComponent,File,DataTransfer:DemoTransfer,
    localStorage:{getItem:key=>{if(storageFails)throw Error('Blocked');return storage.get(key)||null;},setItem:(key,value)=>{if(storageFails)throw Error('Blocked');storage.set(key,value);}},
    location,history:{replaceState(a,b,url){location.hash=url.includes('#')?url.slice(url.indexOf('#')):'';}},window:{addEventListener(type,fn){events[type]=fn;}}};
  $('request-form').reset=()=>{for(const id of ['request-title','request-description','request-due'])$(id).value='';};
  $('request-form').reportValidity=()=>!!$('request-title').value&&!!$('request-due').value&&!$('request-title').validationMessage;
  $('submission-form').reset=()=>{$('submission-name').value='';$('submission-files').files=[];};
  $('submission-form').reportValidity=()=>!!$('submission-name').value&&$('submission-files').files.length>0&&!$('submission-name').validationMessage;
  vm.runInNewContext(source,context);
  return {$,storage,location,events,create(title='프로젝트 산출물',due='2099-10-31'){$('new-request').fire('click');$('request-title').value=title;$('request-description').value='실습 파일을 제출해 주세요.';$('request-due').value=due;$('request-form').fire('submit');},submit(files,name='김실습'){$('submission-name').value=name;$('submission-files').files=files;$('submission-form').fire('submit');}};
}
test('create, submit multiple files, aggregate and restore after reload',()=>{
  const app=boot();assert.equal(app.$('request-empty').hidden,false);
  app.create('  10월 프로젝트 산출물 제출  ');
  assert.equal(app.$('detail-title').textContent,'10월 프로젝트 산출물 제출');
  assert.equal(app.$('request-count').textContent,1);
  assert.equal(app.$('file-count').textContent,0);
  const files=[{name:'결과물.txt',size:2048},{name:'검토 메모.pdf',size:4096}];
  app.submit(files);
  assert.equal(app.$('file-count').textContent,2);
  assert.equal(app.$('submission-rows').children.length,2);
  assert.match(app.$('fr-status').textContent,/접수 완료/);
  const saved=JSON.parse(app.storage.get(KEY));assert.equal(saved[0].files[1].submitter,'김실습');
  assert.deepEqual(Object.keys(saved[0].files[0]).sort(),['id','name','size','submissionId','submittedAt','submitter']);
  const restored=boot(app.storage,app.location.hash);
  assert.equal(restored.$('file-count').textContent,2);
  assert.equal(restored.$('submission-rows').children[0].children[0].textContent,'결과물.txt');
  restored.create('별도 요청');assert.equal(restored.$('request-count').textContent,2);assert.equal(restored.$('detail-total').textContent,'제출 0건 · 파일 0개');
});
test('reject whitespace titles, missing files, blank submitters and batches above 10',()=>{
  const app=boot();app.create('   ');assert.equal(app.$('request-count').textContent,0);
  app.create();app.submit([]);assert.equal(app.$('file-count').textContent,0);
  app.submit([{name:'example.txt',size:1}],' ');assert.equal(app.$('file-count').textContent,0);
  app.$('submission-name').fire('input');
  app.submit(Array.from({length:11},(_,i)=>({name:`file-${i}`,size:1})));assert.equal(app.$('file-count').textContent,0);assert.match(app.$('fr-status').textContent,/10개/);
});
test('expired requests cannot accept files',()=>{
  const storage=new Map([[KEY,JSON.stringify([{id:'expired',title:'마감된 요청',due:'2000-01-01',files:[]}])]]);
  const app=boot(storage,'#request=expired');assert.equal(app.$('submit-files').disabled,true);
  app.submit([{name:'late.txt',size:1}]);assert.equal(app.$('file-count').textContent,0);assert.match(app.$('fr-status').textContent,/기한이 지난/);
});
test('render user text literally and continue in memory when storage is blocked',()=>{
  const app=boot(new Map(),'',true);assert.equal(app.$('storage-warning').hidden,false);
  const title='<img src=x onerror=alert(1)>';app.create(title);assert.equal(app.$('detail-title').textContent,title);
  app.submit([{name:'<b>example</b>.txt',size:0}]);assert.equal(app.$('submission-rows').children[0].children[0].textContent,'<b>example</b>.txt');assert.equal(app.$('file-count').textContent,1);
});
test('unknown request links do not open someone else’s request',()=>{
  const app=boot(new Map(),'#request=missing');assert.match(app.$('fr-status').textContent,/해당 요청이 없습니다/);
});
test('built-in sample files follow the same submission workflow',()=>{
  const app=boot();app.create();app.$('sample-files').fire('click');
  const files=app.$('submission-files').files;assert.equal(files.length,2);assert.equal(files[0].name,'프로젝트_산출물_예시.txt');
  app.submit(files);assert.equal(app.$('file-count').textContent,2);
});

test('request link opens the selected request in the same browser',()=>{
  const app=boot();app.create('10월 프로젝트 산출물 제출');
  const link=new URL(app.$('request-link').value);
  assert.equal(link.origin,'https://acmexii.github.io');
  assert.equal(link.pathname,'/cloudikehome/app/file-requests/');
  const reopened=boot(app.storage,link.hash);
  assert.equal(reopened.$('detail-title').textContent,'10월 프로젝트 산출물 제출');
});

test('count one submission per batch and preserve the count after reload',()=>{
  const app=boot();app.create('10월 프로젝트 산출물 제출');
  app.submit([{name:'a.txt',size:1},{name:'b.txt',size:2}]);
  assert.equal(app.$('detail-total').textContent,'제출 1건 · 파일 2개');
  app.submit([{name:'c.txt',size:3}]);
  assert.equal(app.$('detail-total').textContent,'제출 2건 · 파일 3개');
  const restored=boot(app.storage,app.location.hash);
  assert.equal(restored.$('detail-total').textContent,'제출 2건 · 파일 3개');
  assert.equal(restored.$('request-rows').children[0].children[2].textContent,'2건 · 3개');
});

test('copy failure selects the link for manual copying',async()=>{
  const app=boot();app.create();
  await app.$('copy-request-link').fire('click');
  assert.equal(app.$('request-link').selected,true);
  assert.match(app.$('fr-status').textContent,/직접 복사/);
});
