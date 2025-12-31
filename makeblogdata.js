import { dir2csv } from "./dir2csv.js";
import { csv2rssxml } from "./csv2rssxml.js";

export const makeblogdata = async () => {
  await dir2csv();
  await csv2rssxml();
};
