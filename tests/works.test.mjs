import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, cp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import engine from "../games/iron-shift/model.js";
test("ore, steel and gears travel through working machines",()=>{
  const s=engine.fresh();
  for(let n=0;n<25;n++)engine.step(s);
  assert.equal(s.shipped,0);
  for(const [job,build,index] of [[0,"belt",17],[1,"furnace",16],[2,"press",18]]){
    engine.build(s,index,build,0);
    for(let n=0;n<150 && s.job===job;n++)engine.step(s);
    assert.equal(s.job,job+1);
    assert.ok(engine.valid(JSON.parse(JSON.stringify(s))));
  }
});
test("a rotated belt changes destination; a press cannot process raw ore",()=>{
  const s=engine.fresh();s.tiles.fill(null);
  engine.build(s,10,"belt",1);engine.build(s,17,"press",0);s.tiles[10].cargo="ore";
  engine.step(s);assert.equal(s.tiles[10].cargo,"ore");
  engine.build(s,17,"belt",0);engine.step(s);assert.equal(s.tiles[17].cargo,"ore");
  engine.build(s,17,"belt",3);engine.step(s);assert.equal(s.tiles[10].cargo,"ore");
});
test("a new game goes from draft to a reproducible release with nested assets",async()=>{
  const tmp=await mkdtemp(join(tmpdir(),"grandworks-test-"));
  const cli=(...args)=>execFileSync(process.execPath,[join(tmp,"studio.mjs"),...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
  try{
    const root=resolve(import.meta.dirname,"..");
    await mkdir(join(tmp,"games"));await cp(join(root,"studio.mjs"),join(tmp,"studio.mjs"));
    await cp(join(root,"index.html"),join(tmp,"index.html"));
    const game=cli("new","test-game","A playable draft");
    assert.throws(()=>cli("new","test-game","duplicate"));
    assert.throws(()=>cli("check"),/No games marked for release/);
    const m=JSON.parse(await readFile(join(game,"game.json"),"utf8"));
    Object.assign(m,{publish:true,blurb:{en:"sample",vi:"mẫu"},cover:"art/cover.png",files:["index.html","art/cover.png"]});
    await writeFile(join(game,"game.json"),JSON.stringify(m));
    await mkdir(join(game,"art"));await writeFile(join(game,"art/cover.png"),Buffer.from([137,80,78,71]));
    const output=cli("build");assert.equal(cli("build"),output);
    assert.match(await readFile(join(output,"catalog.js"),"utf8"),/test-game/);
    await writeFile(join(game,"index.html"),'<script src="oops.js"></script>');
    assert.throws(()=>cli("check"),/references missing asset/);
    assert.equal((await readFile(join(output,"games/test-game/index.html"),"utf8")).includes("oops.js"),false);
  }finally{await rm(tmp,{force:true,recursive:true});}
});
