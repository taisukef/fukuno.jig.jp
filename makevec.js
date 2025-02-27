import { txt2vec } from "https://code4fukui.github.io/txt2vec/ADA002.js";
import { CSV } from "https://js.sabae.cc/CSV.js";
import { IEEE32 } from "https://code4fukui.github.io/IEEE754/IEEE32.js";
import { Base64URL } from "https://code4fukui.github.io/Base64URL/Base64URL.js";
import { html2txt } from "https://code4fukui.github.io/html2txt/html2txt.js";

const fn = "./static/blog-all.csv";
const data = await CSV.fetchJSON(fn);
const input = data.map(d => html2txt(d.body));
//console.log(input)

const fn2 = "./static/blog-vec.csv";

const data2 = await (async () => {
  try {
    return await CSV.fetchJSON(fn2);
  } catch (e) {
  }
  return data.map(i => ({ id: i.id }));
})();

const txt2vec_retry = async (txt) => {
  for (;;) {
    try {
      return await txt2vec(txt);
    } catch (e) {
      console.log(e);
      const ss = txt.split("\n");
      const ss2 = [];
      for (let i = 0; i < ss.length * .75; i++) {
        ss2.push(ss[i]);
      }
      txt = ss2.join("\n");
      console.log(ss.length, "->", ss2.length);
    }
  }
};

for (let i = 0; i < input.length; i++) {
  console.log(i, input.length, data2.length);
  //console.log(i, data2[i].ada002);
  if (i < data2.length && data2[i].ada002) continue;
  console.log(i, input[i])
  const res = await txt2vec_retry(input[i]);
  console.log(res, i);
  const ada002 = Base64URL.encode(IEEE32.encode(res));
  data2.push({ id: data[i].id, ada002 });
  await Deno.writeTextFile(fn2, CSV.stringify(data2));
}
