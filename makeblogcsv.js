import { fix0 } from "https://code4sabae.github.io/js/fix0.js";
import { CSV } from "https://code4sabae.github.io/js/CSV.js";
import { CBOR } from "https://js.sabae.cc/CBOR.js";
import { makeRensa } from "./makeRensa.js";
import { makeThumbnail } from "./makeThumbnail.js";

const makeDate = (s) => {
  const d = new Date(s);
  return d.getFullYear() + "-" + fix0(d.getMonth() + 1, 2) + "-" +
    fix0(d.getDate(), 2) + "T" + fix0(d.getHours(), 2) + ":" +
    fix0(d.getMinutes(), 2) + ":" + fix0(d.getSeconds(), 2);
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

const sortByDate = (a, b) => {
  const ad = new Date(a.date).getTime();
  const bd = new Date(b.date).getTime();
  return ad - bd;
};

const rssxml2csv = async () => {
  const xml = await Deno.readTextFile("static/rss.xml");
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
  console.log(list);
  await Deno.writeTextFile("static/blog.csv", CSV.encode(CSV.fromJSON(list)));
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

const dir2csv = async () => {
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

const csv2rssxml = async () => {
  const list = CSV.toJSON(CSV.decode(Deno.readTextFileSync("static/blog.csv")));
  list.reverse();
  const s = [];
  s.push(`<rss version='2.0' xmlns:media='http://search.yahoo.com/mrss/'>
<channel>

<title>福野泰介の一日一創 / Create every day by Taisuke Fukuno</title>
<description>福井高専出身、株式会社jig.jp 創業者＆会長、福野泰介の一日一創ブログです。</description>
`);
  for (const l of list) {
    const no = l.id;
    const fn = "static/xml/" + Math.floor(no / 100) + "/" + no + ".xml";
    const read = () => {
      const s = Deno.readTextFileSync(fn);
      if (s.indexOf(String.fromCharCode(65533)) == -1) {
        return s;
      }
      const s2 = s.replace(/\ufffd/g, "");
      console.log(fn); // to fix!
      return s2;
    }
    const sxml = read();

    try {
        //console.log(sxml, no);
    } catch (e) {
      for (let i = 0; i < sxml.length; i++) {
        const c = sxml.charCodeAt(i);
        try {
          console.log(sxml.charAt(i));
        } catch (e2) {
          console.log(sxml.charCodeAt(i));
          Deno.exit(0);
        }
        if (c < 31) {
          console.log(c);
        }
      }
      Deno.exit(0);
    }
    s.push(sxml);
  }
  s.push(`</channel>
</rss>
`);
  const xml = s.join("\n");
  //console.log(xml);
  Deno.writeTextFileSync("static/rss.xml", xml);
  console.log(list.length);
};

await dir2csv();
await csv2rssxml();
