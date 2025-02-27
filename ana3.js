import { CSV } from "https://js.sabae.cc/CSV.js";

const ana2 = await CSV.fetchJSON("ana2.csv");
const no20230101 = 3812;
const no20231231 = no20230101 + 365 - 1;
const ana3 = ana2.filter(i => i.id >= no20230101 && i.id <= no20231231);
console.log(ana3, ana3.length);
await Deno.writeTextFile("ana3.csv", CSV.stringify(ana3));
