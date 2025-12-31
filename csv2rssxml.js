import { CSV } from "https://js.sabae.cc/CSV.js";

export const rssxml2csv = async () => {
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

export const csv2rssxml = async () => {
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
