import { CSV } from "https://code4sabae.github.io/js/CSV.js";

const json = CSV.toJSON(CSV.decode(await Deno.readTextFile("../cedlist.csv")));
console.log(json);

const parseBody = (s) => {
  const help1 = "<div id='helptips'><div id='helptipscontent'>";
  const n = s.indexOf(help1);
  if (n < 0) {
    console.log("err n!");
    return null;
  }
  const m = s.indexOf("</div></div>", n);
  if (m < 0) {
    console.log("err m!");
    return null;
  }
  return s.substring(n + help1.length, m);
};

const encodeXML = (s) => {
  return s.replace(/&/g, "&amp;");
};

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const makeXMLDate = (d) => {
  const day = d.getDay();
  const mon = d.getMonth();
  const date = d.getDate();
  const year = d.getFullYear();
  return DAY[day] + ", " + date + " " + MONTH[mon] + " " + year +
    " 00:00:00 +0900";
};

const makeXML = (id, title, date, body) => {
  const xmldate = makeXMLDate(date); //Wed, 26 Jun 2019 23:55:00 +0900
  console.log(xmldate);
  const s = `<item>
<title>${encodeXML(title)}</title>
<guid>https://fukuno.jig.jp/${id}</guid>
<pubDate>${xmldate}</pubDate>
<description><![CDATA[<p>
${encodeXML(body)}
</p>]]></description>
</item>`;
  return s;
};

const makeDate = (year, day) => {
  const d = new Date(year + "/1/1 00:00");
  console.log(d);
  const d2 = new Date(d.getTime() + (day - 1) * (24 * 60 * 60 * 1000));
  console.log(d2);
  return d2;
};

const saveXML = async (guid, s) => {
  const dir = "../xml/" + Math.floor(guid / 100);
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(dir + "/" + guid + ".xml", s);
};

for (const d of json) {
  const id = parseInt(d.id) + 2012000;
  const date = makeDate(2012, d.id);
  const s = await (await fetch("https://fukuno.jig.jp/2012/" + d.name)).text();
  const body = parseBody(s);
  const title = d.title;
  const tags = d.tags.split(", ").map((s) => "#" + s).join(" ") + " #ced2012";
  console.log(body, id, title, tags);
  const path = "https://fukuno.jig.jp/2012/" + d.name;
  const body2 = "<a href=" + path + "><img src=" + path +
    ".jpg width=610><br>「" + encodeXML(title) + "」</a><br>" + body;
  const xml = makeXML(id, title + " " + tags, date, body2);
  console.log(xml);
  await saveXML(id, xml);
  //break;
}
