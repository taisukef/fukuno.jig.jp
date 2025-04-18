import { fix0 } from "https://code4sabae.github.io/js/fix0.js";
import { CSV } from "https://code4sabae.github.io/js/CSV.js";

const makeDate = (s) => {
  const d = new Date(s);
  return d.getFullYear() + "-" + fix0(d.getMonth() + 1, 2) + "-" +
    fix0(d.getDate(), 2) + "T" + fix0(d.getHours(), 2) + ":" +
    fix0(d.getMinutes(), 2) + ":" + fix0(d.getSeconds(), 2);
};

const parse = async (s) => {
  //console.log(s);
  const guid = 2013000 + parseInt(
    s.match(/<guid>http:\/\/fukuno.jig.jp\/LTECHS\/(\d+)<\/guid>/)[1],
  );
  //console.log(guid);
  const titletags = s.substring(
    s.indexOf("<title>") + 7,
    s.indexOf("</title>"),
  );
  //console.log(titletags);
  const ss = titletags.split(" ");
  let n = titletags.length;
  for (let i = ss.length - 1; i >= 0; i--) {
    if (ss[i].charAt(0) == "#") {
      n -= ss[i].length + 1;
    }
  }
  const tags = titletags.substring(n + 1);
  const title = titletags.substring(0, n).trim();
  //console.log(tags, "**", title);

  const date = makeDate(
    s.substring(s.indexOf("<pubDate>") + 7, s.indexOf("</pubDate>")),
  );
  console.log(date);

  const dir = "./static/xml/" + Math.floor(guid / 100);

  let s2 = s.replace("<guid>http://fukuno.jig.jp/LTECHS/", "<guid>https://fukuno.jig.jp/201300")
  s2 = s2.replace("<title>", "<title>LTECHS ")
  s2 = s2.replace("</title>", " #LTECHS</title>")
  console.log(s2);
  console.log(dir, guid);
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(dir + "/" + guid + ".xml", s2);

  // const xml = "https://fukuno.jig.jp/xml/" + Math.floor(guid / 100) + "/" + guid + ".xml";
  const url = "https://fukuno.jig.jp/" + guid;
  return { id: guid, date, title, tags, url };
};

const xml = await Deno.readTextFile("static/LTECHS/rss.xml");
let off = 0;
let idx = 0;
const list = [];
for (;;) {
  const n = xml.indexOf("<item>", off);
  if (n < 0) {
    break;
  }
  const m = xml.indexOf("</item>", n);
  off = m;
  const s = xml.substring(n, m + 7);
  const d = await parse(s);
  list.unshift(d);
}
//console.log(list);
//await Deno.writeTextFile("../blog.csv", CSV.encode(CSV.fromJSON(list)));
