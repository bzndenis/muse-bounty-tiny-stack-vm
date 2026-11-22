// Tiny Stack VM: faithful interpreter for the make.fun tiny stack ISA.
// B[op] = [immediate bytes, pops, pushes]; arithmetic ops 16-34 (not 31)
// use the fallback row. Traps: 2 underflow, 3 overflow, 4 div0, 5 opcode,
// 6 address, 7 call depth, 8 ret empty, 9 PC range, 10 steps, 11 output.
import{readdirSync,readFileSync,writeFileSync,mkdirSync}from"node:fs";
import{join}from"node:path";
const B={0:[0,0,0],1:[1,0,1],2:[4,0,1],3:[0,1,0],4:[0,1,2],5:[0,2,2],6:[0,2,3],7:[0,3,3],48:[2,0,0],49:[2,1,0],50:[2,1,0],51:[2,0,0],52:[0,0,0],64:[0,1,1],65:[0,2,0],80:[0,1,0],81:[0,1,0],82:[0,0,1],83:[0,1,0]};
function run(p,q){
const D=new Int32Array(256);let s=0;const C=new Int32Array(64);let c=0;const M=new Int32Array(256);
const o=new Uint8Array(65536);let l=0,i=0,pc=0,st=0;
const R=x=>({o:o.slice(0,l),c:x});
try{for(;;){
if(st===1e6)throw 10;
if(pc<0||pc>=p.length)throw 9;
const op=p[pc];let t=B[op];
if(!t){if(op>15&&op<35&&op!==31)t=[0,op===23||op===27?1:2,1];else throw 5}
const[im,po,pu]=t;
if(pc+im>=p.length)throw 9;
st++;
if(s<po)throw 2;
if(s-po+pu>256)throw 3;
pc+=1+im;
if(op>15&&op<35){
const b=D[s-1],a=D[s-2];let r;
if(op===16)r=(a+b)|0;
else if(op===17)r=(a-b)|0;
else if(op===18)r=Math.imul(a,b);
else if(op===19){if(!b)throw 4;r=a===-2147483648&&b===-1?a:(a/b)|0}
else if(op===20){if(!b)throw 4;r=b===-1?0:a%b|0}
else if(op===21){if(!b)throw 4;r=Math.floor((a>>>0)/(b>>>0))|0}
else if(op===22){if(!b)throw 4;r=(a>>>0)%(b>>>0)|0}
else if(op===23)r=-D[s-1]|0;
else if(op===24)r=a&b;
else if(op===25)r=a|b;
else if(op===26)r=a^b;
else if(op===27)r=~D[s-1];
else if(op===28)r=a<<(b&31);
else if(op===29)r=a>>(b&31);
else if(op===30)r=a>>>(b&31)|0;
else if(op===32)r=a===b?1:0;
else if(op===33)r=a<b?1:0;
else r=a>>>0<b>>>0?1:0;
s-=po;D[s++]=r;continue;
}
switch(op){
case 0:return R(0);
case 1:D[s++]=(p[pc-1]<<24)>>24;break;
case 2:D[s++]=p[pc-4]|p[pc-3]<<8|p[pc-2]<<16|p[pc-1]<<24;break;
case 3:s--;break;
case 4:D[s]=D[s-1];s++;break;
case 5:{const t=D[s-1];D[s-1]=D[s-2];D[s-2]=t;break}
case 6:D[s]=D[s-2];s++;break;
case 7:{const a=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=a;break}
case 48:pc+=((p[pc-2]|p[pc-1]<<8)<<16)>>16;break;
case 49:case 50:{const v=D[--s];if((op===49)===(v===0))pc+=((p[pc-2]|p[pc-1]<<8)<<16)>>16;break}
case 51:if(c===64)throw 7;C[c++]=pc;pc=p[pc-2]|p[pc-1]<<8;break;
case 52:if(!c)throw 8;pc=C[--c];break;
case 64:{const a=D[s-1];if(a<0||a>255)throw 6;D[s-1]=M[a];break}
case 65:{const a=D[s-1],v=D[s-2];if(a<0||a>255)throw 6;s-=2;M[a]=v;break}
case 80:{const g=String(D[s-1]);if(l+g.length>65536)throw 11;s--;for(let k=0;k<g.length;k++)o[l++]=g.charCodeAt(k);break}
case 81:if(l+1>65536)throw 11;o[l++]=D[--s]&255;break;
case 82:D[s++]=i<q.length?q[i++]:-1;break;
case 83:return R(D[--s]&255);
}
}}catch(e){if(typeof e==="number")return R(e);throw e}
}
const I=process.env.MAKEFUN_INPUT_DIR??"/input",O=process.env.MAKEFUN_OUTPUT_DIR??"/output";
for(const id of readdirSync(I).sort()){
let r;try{r=run(new Uint8Array(readFileSync(join(I,id,"program.bin"))),new Uint8Array(readFileSync(join(I,id,"input.bin"))))}catch{r={o:new Uint8Array(0),c:1}}
mkdirSync(join(O,id),{recursive:true});
writeFileSync(join(O,id,"stdout.bin"),r.o);
writeFileSync(join(O,id,"exit.txt"),r.c+"\n");
}
