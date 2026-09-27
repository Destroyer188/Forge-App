import assert from 'node:assert/strict';

const pad2=n=>String(n).padStart(2,'0');
const localDate=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
function generate30DayPlan(type,current,target){
  const isStrength=type==='strength';
  const base=Math.max(isStrength?1:5,Math.floor(current*(isStrength?.8:.6)));
  const build=Math.max(isStrength?1:5,Math.floor(current*(isStrength?1.1:.75)));
  const peak=Math.max(isStrength?1:5,Math.floor(target*(isStrength?.7:.5)));
  const gtg=Math.max(isStrength?1:5,Math.floor(current*(isStrength?.6:.5)));
  const p=[]; for(let day=1;day<=30;day++){
    let type2='workout', reps=base;
    if(day<=10){if([2,5,8].includes(day)) type2='rest'; else if(day===10){type2='test';reps=Math.max(1,Math.round(target*.9));}}
    else if(day<=20){if(day===11) type2='rest'; else if(day===14){type2='gtg';reps=gtg;} else if(day===17){type2='deload';reps=Math.max(1,Math.floor(build*.6));} else if(day===20){type2='test';reps=Math.max(1,Math.round(target*.95));} else reps=build;}
    else {if(day===21) type2='rest'; else if(day<=27) {reps=Math.max(1,Math.round(peak*(.78+(day-21)*.035)));} else if(day<=29){type2='deload';reps=Math.max(1,Math.floor(peak*.45));} else {type2='test';reps=target;}}
    p.push({day,type:type2,reps});
  } return p;
}
function streak(dates,today){const s=new Set(dates);let cur=today;if(!s.has(cur)){const d=new Date(today+'T12:00:00');d.setDate(d.getDate()-1);cur=localDate(d);}let n=0;while(s.has(cur)){n++;const d=new Date(cur+'T12:00:00');d.setDate(d.getDate()-1);cur=localDate(d);}return n;}
const plan=generate30DayPlan('endurance',10,20);
assert.equal(plan.length,30); assert.deepEqual(plan.filter(d=>d.type==='rest').map(d=>d.day),[2,5,8,11,21]); assert.equal(plan.find(d=>d.day===14).type,'gtg'); assert.equal(plan.find(d=>d.day===17).type,'deload'); assert.equal(plan.find(d=>d.day===30).reps,20);
const today='2026-09-27'; assert.equal(streak(['2026-09-25','2026-09-26'],today),2); assert.equal(streak(['2026-09-20','2026-09-26'],today),1);
console.log('Forge self-check passed: 30-day plan invariants, tests/deload/GTG days, and local-date streak logic.');
