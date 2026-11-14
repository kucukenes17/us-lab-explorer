import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rankStudies,filterRows,comparisonSummary,exportRows,csvCell} from '../src/research-model.js';
const root=new URL('../dist/assets/research/',import.meta.url);
const knowledge=JSON.parse(readFileSync(new URL('investigations.json',root)));
const data=JSON.parse(readFileSync(new URL('experimental-tables.json',root)));
const flex=data.datasets.find(d=>d.accession==='PSI-69');
test('purpose ranking distinguishes suppression, extinction and instrument validation',()=>{
 const suppression=rankStudies(knowledge.investigations,{purpose:'suppression'}).map(r=>r.study.id);
 assert(suppression.includes('flex'));assert(suppression.includes('bass'));assert(!suppression.includes('bass-ii'));
 const detection=rankStudies(knowledge.investigations,{purpose:'detection'});
 assert.deepEqual(detection.slice(0,2).map(r=>r.study.id),['same','same-r']);assert(detection.some(r=>r.study.id==='daft'));
 assert(rankStudies(knowledge.investigations,{purpose:'prevention'}).some(r=>r.study.id==='bre'));
 assert.equal(rankStudies(knowledge.investigations,{query:'unmatchedxyz'}).length,0);
 assert(rankStudies(knowledge.investigations,{query:'Kapton'}).some(r=>r.study.id==='same-r'));
});
test('filtering preserves missing, qualified and envelope distinctions',()=>{
 assert.equal(filterRows(flex,{query:'Methanol'}).length,157);
 const records=filterRows(flex,{query:'Methanol',field:'ambientPressureMmHg',min:'750',max:'770'});
 assert.equal(records.length,78);assert(records.every(r=>r.values.ambientPressureMmHg>=750&&r.values.ambientPressureMmHg<=770));
 const fixture={records:[{kind:'test-record',raw:['2'],values:{x:2},qualifiers:{x:'numeric'}},{kind:'test-record',raw:['~2'],values:{x:2},qualifiers:{x:'approximate'}},{kind:'test-record',raw:[''],values:{x:null},qualifiers:{x:'blank'}}]};
 assert.equal(filterRows(fixture,{field:'x',min:'1'}).length,1);
 assert.equal(filterRows(fixture,{field:'x',min:'1',includeUnknown:true}).length,3);
 const envelope=data.datasets.find(d=>d.accession==='PSI-68');assert(envelope.records.every(r=>r.kind==='configuration-envelope'));
 assert.equal(filterRows(envelope,{field:'initialDropletDiameterRangeMm',min:'2'}).length,0);
});
test('coverage and untouched source checksums match packaged metadata',()=>{
 assert.equal(knowledge.investigations.length,23);assert.equal(data.datasets.length,9);
 assert.equal(data.datasets.reduce((n,d)=>n+d.records.length,0),671);
 assert.equal(data.datasets.reduce((n,d)=>n+d.records.reduce((sum,r)=>sum+r.raw.length,0),0),8546);
 for(const d of data.datasets){assert.equal(d.records.length,d.recordCount);assert.equal(createHash('sha256').update(readFileSync(new URL(d.source.localCsv,root))).digest('hex'),d.source.sha256);for(const r of d.records){assert.equal(r.raw.length,d.fields.length);assert.equal(Object.keys(r.values).length,d.fields.length);}}
});
test('exports retain provenance, qualifiers and safe spreadsheet cells',()=>{
 const csv=exportRows(flex,flex.records.slice(0,2));assert(csv.includes('source_accession'));assert(csv.includes('burnTimeS__qualifier'));assert(csv.includes('"PSI-69","2","test-record"'));
 assert.equal(csvCell('=HYPERLINK("x")'),'"\'=HYPERLINK(""x"")"');assert.equal(csvCell(-1.2),'"-1.2"');
 const summary=comparisonSummary(knowledge.investigations.filter(s=>['same','same-r'].includes(s.id)));assert(summary.shared.includes('Duman algılama'));
});
test('FLEX source headings remain intact while scientific corrections are cited',()=>{
 const burning=flex.fields.find(f=>f.key==='burningRateSourceUnit');assert.equal(burning.sourceHeader,'Burning rate; mm');assert.equal(burning.unit,'mm²/s');assert(burning.corroboration.url.includes('20150023456'));
 assert.equal(flex.fields.find(f=>f.key==='coHeaderMoleFraction').chemicalSpecies,'CO2');
 const outcomes=flex.records.reduce((a,r)=>(a[r.values.testEnd]=(a[r.values.testEnd]||0)+1,a),{});assert.deepEqual(outcomes,{Disruption:61,Extinction:186,Completion:27});
});
