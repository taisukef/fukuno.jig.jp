const fixIgnoreChar = (s) => {
  const s2 = [];
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c == 0x8) {
      continue;
    }
    s2.push(s.charAt(i));
  }
  return s2.join("");
};

const checkAll = async (func) => {
  const dirs = Deno.readDirSync("../xml");
  const list = [];
  for (const dir of dirs) {
    //console.log(dir);
    if (!dir.isDirectory) {
      continue;
    }
    const files = Deno.readDirSync("../xml/" + dir.name);
    for (const file of files) {
      await func("../xml/" + dir.name + "/" + file.name);
    }
  }
};

const fixAll = async () => {
  await checkAll(async (fn) => {
    const s = await Deno.readTextFile(fn);
    const s2 = fixIgnoreChar(s);
    if (s != s2) {
      console.log(file.name, s.length - s2.length);
      await Deno.writeTextFile(fn, s2);
    }
  });
};

await fixAll();
//const s = Deno.readTextFileSync("20191211.xml");
