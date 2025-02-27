import { DateTime, Day } from "https://js.sabae.cc/DateTime.js";
import { CSV } from "https://js.sabae.cc/CSV.js";

const ana = {}

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
    if (path) {
      const n = parseInt(path.substring(1));
      if (!isNaN(n) && "/" + n == path) {
        if (!ana[n]) {
          ana[n] = 0;
        }
        ana[n]++;
      }
    }
  }
  console.log(fn, cnt);
  return cnt;
};

const list = [];
//for (let i = new Day("20231225"); i.year == 2023; i = i.nextDay()) {
for (let i = new Day("20230101"); i.year == 2023; i = i.nextDay()) {
  const fn = "2023/" + i.toStringYMD() + ".log";
  list.push(await chk(fn));
}
console.log(list.reduce((i, cur) => cur + i, 0) / list.length); // average 2661

const ana2 = Object.entries(ana);
ana2.sort((a, b) => b[1] - a[1])
console.log(ana2);
ana2.unshift(["id", "count"]);
await Deno.writeTextFile("ana2.csv", CSV.encode(ana2));
