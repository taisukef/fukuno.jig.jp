import { CSV } from "https://js.sabae.cc/CSV.js";

const ana2 = await CSV.fetchJSON("ana2.csv");
const data = await CSV.fetchJSON("./static/blog.csv");
data.forEach(d => {
  const ana = ana2.find(i => i.id == d.id);
  d.count = ana ? ana.count : 0;
  delete d.img;
});
data.sort((a, b) => b.count - a.count);
await Deno.writeTextFile("./static/blog-ranking-2023.csv", CSV.stringify(data));
