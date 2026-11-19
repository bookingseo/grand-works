"use strict";
const IronShift = (() => {
  const cols = 7, rows = 5;
  const directions = [[1,0],[0,1],[-1,0],[0,-1]];
  const jobs = [{kind:"ore", count:3},{kind:"bar", count:4},{kind:"gear", count:5}];
  const types = ["belt","furnace","press","mine","dock"];
  const cell = (type, dir=0) => ({type, dir, cargo:null, wait:0});
  function fresh() {
    const tiles = Array(cols * rows).fill(null);
    for (let x=0; x<cols; x++) {
      if (x !== 3) tiles[2*cols+x] = cell(x === 0 ? "mine" : x === cols-1 ? "dock" : "belt");
    }
    return {version:1, tiles, tick:0, job:0, count:0, shipped:0};
  }
  function valid(s) {
    const integer = n => Number.isSafeInteger(n) && n >= 0;
    return s && s.version === 1 && Array.isArray(s.tiles) && s.tiles.length === cols*rows &&
      [s.tick,s.job,s.count,s.shipped].every(integer) && s.job <= jobs.length &&
      (s.job === jobs.length ? s.count === 0 : s.count < jobs[s.job].count) &&
      s.tiles.every(t => t === null || (t && types.includes(t.type) && integer(t.dir) && t.dir < 4 &&
        [null,"ore","bar","gear"].includes(t.cargo) && integer(t.wait) && t.wait <= 3));
  }
  function build(s,index,type,dir) {
    if (!Number.isInteger(index) || index < 0 || index >= s.tiles.length) return;
    if (type === "erase") s.tiles[index] = null;
    else if (types.includes(type)) {
      const old = s.tiles[index];
      if (old && old.type === type) old.dir = dir;
      else s.tiles[index] = cell(type,dir);
    }
  }
  function nextIndex(index,dir) {
    const [dx,dy] = directions[dir];
    const x = index % cols + dx, y = Math.floor(index / cols) + dy;
    return x < 0 || y < 0 || x >= cols || y >= rows ? -1 : y*cols+x;
  }
  function step(s) {
    s.tick++;
    const ready = s.tiles.map(t => t && t.cargo && t.wait === 0);
    for (const t of s.tiles) {
      if (!t) continue;
      if (t.wait > 0 && --t.wait === 0) {
        if (t.type === "furnace") t.cargo = "bar";
        if (t.type === "press") t.cargo = "gear";
      }
      if (t.type === "mine" && !t.cargo && s.tick % 3 === 0) t.cargo = "ore";
    }
    const moved = [];
    for (let i=0; i<s.tiles.length; i++) {
      if (!ready[i]) continue;
      const t = s.tiles[i], dest = nextIndex(i,t.dir), receiver = s.tiles[dest];
      if (!receiver || receiver.cargo || receiver.type === "mine") continue;
      if ((receiver.type === "furnace" && t.cargo !== "ore") || (receiver.type === "press" && t.cargo !== "bar")) continue;
      moved.push({from:i,to:dest,kind:t.cargo});
      if (receiver.type === "dock") {
        s.shipped++;
        const job = jobs[s.job];
        if (job && job.kind === t.cargo && ++s.count === job.count) { s.job++; s.count = 0; }
      } else {
        receiver.cargo = t.cargo;
        receiver.wait = receiver.type === "furnace" ? 3 : receiver.type === "press" ? 2 : 0;
      }
      t.cargo = null;
    }
    return moved;
  }
  return {cols,rows,directions,jobs,fresh,valid,build,step};
})();
if (typeof module !== "undefined") module.exports = IronShift;
