import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

function walk(dir) {
  const out=[];
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}
const root=path.resolve('src');
let failed=0;
for (const file of walk(root).concat([path.resolve('App.tsx')])) {
  const code=fs.readFileSync(file,'utf8');
  const result=ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},fileName:file,reportDiagnostics:true});
  const errors=(result.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  if (errors.length) { failed++; console.error(`Syntax errors in ${file}`); for (const d of errors) console.error(ts.flattenDiagnosticMessageText(d.messageText,' ')); }
}
if (failed) process.exit(1);
console.log('Forge TypeScript/TSX syntax check passed.');
