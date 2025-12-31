import { CSV } from "https://js.sabae.cc/CSV.js";
import { fix0 } from "https://code4sabae.github.io/js/fix0.js";
import { makeThumbnail } from "./makeThumbnail.js";
import { makeRensa } from "./makeRensa.js";
import { CBOR } from "https://js.sabae.cc/CBOR.js";

const makeDate = (s) => {
  const d = new Date(s);
  return d.getFullYear() + "-" + fix0(d.getMonth() + 1, 2) + "-" +
    fix0(d.getDate(), 2) + "T" + fix0(d.getHours(), 2) + ":" +
    fix0(d.getMinutes(), 2) + ":" + fix0(d.getSeconds(), 2);
};

const sortByDate = (a, b) => {
  const ad = new Date(a.date).getTime();
  const bd = new Date(b.date).getTime();
  return ad - bd;
};

const parse = async (s) => {
  const guid = parseInt(
    s.match(/<guid>https:\/\/fukuno.jig.jp\/(\d+)<\/guid>/)[1],
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
  //console.log(date);
  const body = s.substring(s.indexOf("<description><![CDATA[<p>") + 25, s.indexOf("</p>]]></description>"))

  const dir = "static/xml/" + Math.floor(guid / 100);

  await Deno.mkdir(dir, { recursive: true });
  const fn = dir + "/" + guid + ".xml";
  let sbk = null;
  try {
    sbk = await Deno.readTextFile(fn);
  } catch (e) {
  }
  if (sbk != s) {
    //await Deno.writeTextFile(fn, s); // ignore to write XML
  }

  // const xml = "https://fukuno.jig.jp/xml/" + Math.floor(guid / 100) + "/" + guid + ".xml";
  const url = "https://fukuno.jig.jp/" + guid;
  return { id: guid, date, title, tags, url, body };
};

const xml2json = async (fn) => {
  const xml = await Deno.readTextFile(fn);
  const n = xml.indexOf("<item>");
  if (n < 0) {
    return null;
  }
  const m = xml.indexOf("</item>", n);
  const s = xml.substring(n, m + 7);
  const d = await parse(s);
  return d;
};

export const dir2csv = async () => {
  const dirs = Deno.readDirSync("static/xml");
  const list = [];
  for (const dir of dirs) {
    console.log(dir);
    if (!dir.isDirectory) {
      continue;
    }
    const files = Deno.readDirSync("static/xml/" + dir.name);
    for (const file of files) {
      if (file.name == ".DS_Store") {
        continue;
      }
      const fn = "static/xml/" + dir.name + "/" + file.name;
      const d = await xml2json(fn);
      if (!d) {
        console.log("err", d, fn);
        Deno.exit(0);
      }
      d.img = makeThumbnail(d.body);
      list.push(d);
      //
      //console.log(d);
      await makeRensa(fn, d);
    }
  }
  list.sort(sortByDate);
  console.log(list);
  await Deno.writeTextFile("static/blog-all.csv", CSV.encode(CSV.fromJSON(list)));
  list.forEach(l => delete l.body);
  await Deno.writeTextFile("static/blog.csv", CSV.encode(CSV.fromJSON(list)));
  const listid = list.map(l => l.id);
  await Deno.writeFile("static/blog-id.cbor", CBOR.encode(listid));
  await Deno.writeTextFile("static/blog-id.json", JSON.stringify(listid));
};
