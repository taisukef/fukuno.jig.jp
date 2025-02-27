import { DateTime, Day } from "https://js.sabae.cc/DateTime.js";

const chk = async (fn) => {
  const txt = await Deno.readTextFile(fn);
  const ss = txt.split("\n");
  let cnt = 0;
  for (const line of ss) {
    const s = line.split("\t");
    const dt = s[0];
    const path = s[1];
    if (path == "/") {
      cnt++;
    }
  }
  console.log(fn, cnt);
  return cnt;
};

const list = [];
for (let i = new Day("20230101"); i.year == 2023; i = i.nextDay()) {
  const fn = "2023/" + i.toStringYMD() + ".log";
  list.push(await chk(fn));
}
console.log(list.reduce((i, cur) => cur + i, 0) / list.length); // average 2661

