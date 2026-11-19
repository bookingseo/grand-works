import { mkdir, readdir, readFile, writeFile, lstat, mkdtemp, rename, rm, realpath } from "node:fs/promises";
import { join, posix, sep } from "node:path";
import { createHash } from "node:crypto";
const root=import.meta.dirname, gamesDir=join(root,"games");
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const escapeHtml=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
async function create(slug,title){
  if(!slugPattern.test(slug||"")||!title?.trim())throw Error("new <slug> <title>");
  const folder=join(gamesDir,slug);
  await mkdir(folder);
  const game={title:{vi:title,en:title},blurb:{vi:"",en:""},publish:false,order:100,files:["index.html"]};
  await writeFile(join(folder,"game.json"),JSON.stringify(game,null,2)+"\n");
  await writeFile(join(folder,"index.html"),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHtml(title)+'</title><a href="../../index.html">Studio</a><h1>'+escapeHtml(title)+'</h1><button id="play">Start</button><output id="result"></output><script>document.querySelector("#play").onclick=()=>{ document.querySelector("#result").textContent="Ready"; };</script></html>\n');
  console.log(folder);
}
async function bundle(){
  const catalog=[], files=new Map();
  for(const dir of await readdir(gamesDir,{withFileTypes:true})){
    if(!dir.isDirectory())continue;
    const slug=dir.name, folder=join(gamesDir,slug), m=JSON.parse(await readFile(join(folder,"game.json"),"utf8"));
    if(!slugPattern.test(slug)||typeof m.publish!=="boolean")throw Error("Invalid manifest: "+slug);
    if(!m.publish)continue;
    if(![m.title?.vi,m.title?.en,m.blurb?.vi,m.blurb?.en].every(s=>typeof s==="string"&&s.trim())||
       !Array.isArray(m.files)||!m.files.includes("index.html")||!m.files.includes(m.cover)||
       !Number.isFinite(m.order)||new Set(m.files).size!==m.files.length)throw Error("Incomplete game: "+slug);
    for(const name of m.files){
      if(typeof name!=="string" || !name.split("/").every(part=>/^[a-z0-9][a-z0-9._-]*$/i.test(part)))throw Error("Invalid asset: "+name);
      const input=join(folder,name);
      if(!(await lstat(input)).isFile() || !(await realpath(input)).startsWith(await realpath(folder)+sep))throw Error("Expected game file: "+input);
      files.set("games/"+slug+"/"+name,await readFile(input));
    }
    for(const name of m.files.filter(n=>/\.(css|html)$/.test(n))){
      const source=files.get("games/"+slug+"/"+name).toString();
      const pattern=name.endsWith(".css") ? /url\(\s*["']?([^"'\s)]+)["']?\s*\)/gi
        : /<(?:script|img|link)\b[^>]*?\s(?:src|href)\s*=\s*["']([^"']+)["']/gi;
      for(const [,ref] of source.matchAll(pattern)){
        if(/^(?:[a-z]+:|\/|#)/i.test(ref))continue;
        const local=posix.join(posix.dirname(name),ref.split(/[?#]/)[0]);
        if(!m.files.includes(local))throw Error(`${slug}/${name} references missing asset ${local}`);
      }
    }
    catalog.push({slug,title:m.title,blurb:m.blurb,cover:m.cover,order:m.order});
  }
  if(!catalog.length)throw Error("No games marked for release");
  catalog.sort((a,b)=>a.order-b.order||a.slug.localeCompare(b.slug));
  files.set("index.html",await readFile(join(root,"index.html")));
  files.set("catalog.js",Buffer.from("const catalog = "+JSON.stringify(catalog)+";\n"));
  files.set(".nojekyll",Buffer.alloc(0));
  return {files,catalog};
}
async function build(files){
  const out=join(root,"out");await mkdir(out,{recursive:true});
  const hash=createHash("sha256");
  for(const name of [...files.keys()].sort()){hash.update(name+"\0");hash.update(createHash("sha256").update(files.get(name)).digest());}
  const target=join(out,hash.digest("hex").slice(0,16));
  const staging=await mkdtemp(join(out,".build-"));
  try{
    for(const [name,contents] of files){
      const path=join(staging,name);await mkdir(join(path,".."),{recursive:true});await writeFile(path,contents);
    }
    try{await rename(staging,target);}catch(e){if(!["EEXIST","ENOTEMPTY"].includes(e.code))throw e;
      for(const [name,expected] of files){if(!(await readFile(join(target,name))).equals(expected))throw Error("Damaged previous build: "+name);}
    }
    console.log(target);
  }finally{await rm(staging,{recursive:true,force:true});}
}
try{
  const [cmd,slug,...title]=process.argv.slice(2);
  if(cmd==="new")await create(slug,title.join(" "));
  else if(cmd==="check"||cmd==="build"){const result=await bundle();
    if(cmd==="build")await build(result.files);
    else console.log(result.catalog.map(game=>game.slug).join(", ")+" · "+result.files.size+" files");
  }else throw Error("Use new <slug> <title>, check, or build");
}catch(e){console.error(e.message);process.exitCode=1;}
