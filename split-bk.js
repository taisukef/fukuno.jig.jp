import { SAXParser } from "https://deno.land/x/xmlp/mod.ts";
const parser = new SAXParser();
parser.on("start_element", (e) => {
  if (e._qName !== "item") {
    return;
  }
  console.log(e);
  Deno.exit(0);
});
const reader = await Deno.open("../rss.xml");
await parser.parse(reader);
reader.close();
