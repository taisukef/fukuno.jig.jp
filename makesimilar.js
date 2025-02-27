import { CSV } from "https://js.sabae.cc/CSV.js";
import { IEEE32 } from "https://code4fukui.github.io/IEEE754/IEEE32.js";
import { Base64URL } from "https://code4fukui.github.io/Base64URL/Base64URL.js";
import * as Vec2 from "https://code4fukui.github.io/txt2vec/Vec2.js";

const data = await CSV.fetchJSON("./static/blog-vec.csv");
data.forEach(d => d.ada002 = IEEE32.decode(Base64URL.decode(d.ada002)));

for (let j = 0; j < data.length; j++) {
  const d = data[j];
  const list = [];
  for (const d2 of data) {
    list.push({
      cos: Vec2.similarity(d.ada002, d2.ada002),
      id: d2.id,
    });
  }
  list.sort((a, b) => b.cos - a.cos);
  for (let i = 0; i < 3; i++) {
    d["similar" + (i + 1)] = list[i + 1].id;
  }
  for (let i = 0; i < 3; i++) {
    d["dissimilar" + (i + 1)] = list[list.length - 1 - i].id;
  }
  console.log(j)
}
data.forEach(d => delete d.ada002);
await Deno.writeTextFile("./static/blog-similar.csv", CSV.stringify(data));
