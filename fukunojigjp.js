import { CONTENT_TYPE } from "https://js.sabae.cc/CONTENT_TYPE.js";
import { fix0 } from "https://js.sabae.cc/fix0.js";
import { CSV } from "https://js.sabae.cc/CSV.js";
import { parseURL } from "https://js.sabae.cc/parseURL.js";
//import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import { Rensa } from "https://rensadata.github.io/Rensa-es/Rensa.js";
import { DateTime } from "https://js.sabae.cc/DateTime.js";
import { makeThumbnail } from "./makeThumbnail.js";
import { handleWeb } from "https://js.sabae.cc/wsutil.js";

/*
const getListID = async () => JSON.parse(await Deno.readTextFile("static/blog-id.json"));
const getIndex = async () => await Deno.readTextFile("static/index.html");
const getBlogList = async () => CSV.toJSON(CSV.decode(await Deno.readTextFile("static/blog.csv")));
const getBlogAll = async () => CSV.toJSON(CSV.decode(await Deno.readTextFile("static/blog-all.csv")));
*/
let listID, indexhtml, blogList, blogAll;
const updateData = async () => {
  indexhtml = await Deno.readTextFile("static/index.html");

  blogAll = CSV.toJSON(CSV.decode(await Deno.readTextFile("static/blog-all.csv"))).reverse();
  // id,date,title,tags,url,body,img
  blogList = CSV.toJSON(CSV.decode(await Deno.readTextFile("static/blog.csv"))).reverse();
  // id,date,title,tags,url,img
  listID = JSON.parse(await Deno.readTextFile("static/blog-id.json"));
  // [id]
};
await updateData();
const getListID = async () => listID;
const getIndex = async () => indexhtml;
const getBlogList = async () => blogList;
const getBlogAll = async () => blogAll;

const logpath = "log/";
const log = async (req) => {
  if (logpath) {
    const dt = new DateTime();
    const fn = logpath + dt.day.toStringYMD() + ".log";
    const s = dt.toString() + "\t" + req.path + (req.query ? "?" + req.query : "") + "\t" + req.remoteAddr + "\n";
    await Deno.writeTextFile(fn, s, { append: true });
  }
};

const SHORT_LEN = 120;

const templateBody = `
  <div class='section' id='content' itemscope itemtype='http://schema.org/Article'>
    <span itemprop='mainEntityOfPage' value='https://fukuno.jig.jp/'></span>
    <div class='header' id='chead'><a itemprop='url' href='<rep>url</rep>'><h2 itemprop='headline'><rep>title</rep></h2></a></div>
    <div class='datetime' itemprop='dateCreated'><rep>date</rep></div>
    <div class='hash'><rep>hashs</rep></div>
    <div class='article' id='cmain' itemprop='articleBody'>
      <rep>articleBody</rep>
    </div>
    <div class='footer' id='cfoot'>
      <div id='author'>
        <a itemprop='license' href='https://creativecommons.org/licenses/by/4.0/deed.ja'>CC BY 4.0 </a> <a href=https://fukuno.jig.jp/>福野泰介</a> (<a href=<rep>rensaurl</rep>>電子署名付きデータ</a> <a href=./cert-taisukef.rensa>公開鍵</a>) / <a itemprop='author' href='https://twitter.com/taisukef'>@taisukef</a>
        / <rep>nav</rep>
      </div>
      <div class='related'><rep>related</rep></div>
    </div>
  </div>
`;
// <a href="./js">#js</a>&nbsp;<a href="./hanadojo">#hanadojo</a>&nbsp;<a href="./opendata">#opendata</a>&nbsp;<a href="./DXGOV">#DXGOV</a>&nbsp;<a href="./teito">#teito</a>&nbsp;

const templateList = `
  <div class='section' id='content' itemscope itemtype='http://schema.org/Article'>
    <span itemprop='mainEntityOfPage' value='https://fukuno.jig.jp/'></span>
    <div class='header' id='chead'><a itemprop='url' href='<rep>url</rep>'><h2 itemprop='headline'><rep>subtitle</rep></h2></a></div>
    <div class='article' id='cmain' itemprop='articleBody'>
      <rep>articleBody</rep>
    </div>
    <div class='footer' id='cfoot'>
      <div id='author'><a itemprop='license' href='https://creativecommons.org/licenses/by/4.0/deed.ja'>CC BY 4.0 </a> 福野泰介 / <a itemprop='author' href='https://twitter.com/taisukef'>@taisukef</a></div>
      <div class='related'></div>
    </div>
  </div>
`;

const topdata = {
  title: "福野泰介の一日一創 / create every day",
  url: "https://fukuno.jig.jp/",
  img: "https://fukuno.jig.jp/ced3.jpg",
  description: "福井高専出身、株式会社jig.jp 創業者、福野泰介の一日一創ブログです。",
};

/*
<div class='nav' id='pagenav'><a href='?off=10'>NEXT &gt;&gt;</a></div>
		</div>
	</div>
</div>
*/

const readFileStandard = async (fn) => {
  if (fn.endsWith("/")) {
    fn += "index.html";
  }
  try {
    const d = await Deno.readFile("./static" + fn);
    return d;
  } catch (e) {
  }
  try {
    const d = await Deno.readFile("./static" + fn + ".html");
    return d;
    //console.log(e);
  } catch (e) {
  }
  return null;
};

const readFileCore = async (fn, req) => {
  const html = await readFileCoreHTML(fn, req);
  if (typeof html == "string") {
    return new TextEncoder().encode(html);
  }
  return html;
};
const readFileCoreHTML = async (fn, req) => {
  if (fn.indexOf("/", 1) > 0) {
    return await readFileStandard(fn);
  }
  const nquery = req.url.indexOf("/?q=");
  const issearch = nquery >= 0;
  const query = req.url.substring(nquery + 4);
  const fn2 = fn.substring(1);
  const no = parseInt(fn2);
  const ishash = fn2.indexOf("/") == -1 && fn2.indexOf(".") == -1;
  const isdirect = no == fn2;
  const istop = fn == "/index.html" && !issearch;

  const listid = await getListID();
  const getNav = (no) => {
    const idx = listid.indexOf(parseInt(no));
    if (!idx) {
      return null; // err
    }
    const nbefore = listid[idx - 1];
    const nav = [];
    if (nbefore) {
      nav.push(`<a href='${nbefore}'>前のブログ &lt;&lt;</a>`);
    }
    const nafter = listid[idx + 1];
    if (nafter) {
      nav.push(`<a href='${nafter}'>&gt;&gt; 次のブログ</a>`);
    }
    return nav.join("&nbsp;&nbsp;");
  };
  const template = await getIndex();
  
  if (istop) {
    const list = await getBlogList();
    let narticle = 3;
    let html = buildText(template, topdata);
    const bodies = [];
    for (let i = 0; i < narticle; i++) {
      const n = i;
      if (n >= list.length) break;
      const l = list[n];
      const d = await readDirect(l.id);
      let body = buildText(templateBody, d);
      body = body.replace(/<rep>nav<\/rep>/g, getNav(l.id));
      body = body.replace(/<rep>rensaurl<\/rep>/g, d.path.substring("static/".length));
      bodies.push(body);
    }
    html = html.replace(/<rep>body<\/rep>/g, bodies.join("\n"));
    return html;
  } else if (issearch) {
    const key = decodeURIComponent(query);
    const keys = key.split("+");
    //console.log(keys);
    const title = "福野泰介の一日一創 - " + key;
    const blogs = await getBlogAll();
    const list = blogs.filter((l) => {
      for (const key of keys) {
        if (l.title.indexOf(key) == -1 && l.body.indexOf(key) == -1) {
        //if (l.title.indexOf(key) == -1) {
          return false;
        }
      }
      return true;
    });
    //console.log(list);
    const hit = list.map((l) =>
      `<div>${l.date.substring(0, 10)} <a href=${l.url}>${l.title}</a></div>`
    ).join("\n");
    let htmllist = templateList;
    htmllist = htmllist.replace(/<rep>subtitle<\/rep>/g, key);
    htmllist = htmllist.replace(
      /<rep>url<\/rep>/g,
      "https://fukuno.jig.jp/?q=" + encodeURIComponent(query),
    );
    htmllist = htmllist.replace(/<rep>articleBody<\/rep>/g, hit);
    let html = template.replace(/<rep>body<\/rep>/g, htmllist);
    html = html.replace(/<rep>title<\/rep>/g, title);
    return html;
  } else if (isdirect) {
    const d = await readDirect(no);
    const body = buildText(templateBody, d);
    let html = buildText(template, d);
    html = html.replace(/<rep>body<\/rep>/g, body);
    html = html.replace(/<rep>nav<\/rep>/g, getNav(no));
    html = html.replace(/<rep>rensaurl<\/rep>/g, d.path);
    return html;
  } else if (ishash) {
    const hash = "#" + fn2;
    const title = "福野泰介の一日一創 - " + hash;
    const list = await getBlogList();
    const hit = list.filter((l) => l.tags.indexOf(hash) >= 0).map(
      (l) =>
        `<div>${l.date.substring(0, 10)} <a href=${l.url}>${l.title}</a></div>`
    ).join("\n");
    let htmllist = templateList;
    htmllist = htmllist.replace(/<rep>subtitle<\/rep>/g, hash);
    htmllist = htmllist.replace(
      /<rep>url<\/rep>/g,
      fn2,
      //"https://fukuno.jig.jp/" + fn2,
    );
    htmllist = htmllist.replace(/<rep>articleBody<\/rep>/g, hit);
    let html = template.replace(/<rep>body<\/rep>/g, htmllist);
    html = html.replace(/<rep>title<\/rep>/g, title);
    return html;
  }
  /*
  try {
    const d = await Deno.readFile("./static" + fn);
    return d;
  } catch (e) {
    //console.log(e);
  }
  return "not found";
  */
  return null;
};

const readDirect = async (no) => {
  /*
  const sxml = await Deno.readTextFile(
    "static/xml/" + Math.floor(no / 100) + "/" + no + ".xml",
  );
  const json = xml2json(sxml);
  const d = makeData(json);
  //console.log(json);
  //console.log(sxml, d);
  */
  const fn = "static/rensa/" + Math.floor(no / 100) + "/" + no + ".rensa";
  const rensa = Rensa.fromCBOR(await Deno.readFile(fn), false);
  const pubkey = rensa.data[0][Rensa.PD_PUBKEY];
  const json = rensa.playback();
  const d = makeData2(json);
  d.pubkey = pubkey;
  d.path = fn;
  return d;
};

const buildHashLinks = (tag) => {
  if (!tag) {
    return "";
  }
  return tag.split(" ").map((tag) =>
    `<a href=${tag.substring(1)}>${tag}</a>&nbsp;`
  ).join("");
};
const buildText = (template, d) => {
  let s = template;
  s = s.replace(/<rep>title<\/rep>/g, d.title);
  s = s.replace(/<rep>description<\/rep>/g, d.description);
  s = s.replace(/<rep>image<\/rep>/g, d.img);
  s = s.replace(/<rep>date<\/rep>/g, d.dt);
  s = s.replace(/<rep>url<\/rep>/g, d.guid);
  s = s.replace(/<rep>hashs<\/rep>/g, buildHashLinks(d.tag));
  s = s.replace(/<rep>articleBody<\/rep>/g, d.body);
  //console.log(d);
  if (d.id) {
    s = s.replace(/<rep>related<\/rep>/g, getRelated(d.id));
  }
  return s;
};
const similars = await CSV.fetchJSON("./static/blog-similar.csv");
const titles = await CSV.fetchJSON("./static/blog.csv");
const getRelated = (id) => {
  const d = similars.find(i => i.id == id);
  if (!d) return "";
  const list = [];
  list.push("<h3>似た記事リンク</h3><ul>");
  for (let i = 1; i <= 3; i++) {
    const id = d["similar" + i];
    const d2 = titles.find(i => i.id == id);
    const title = d2.title;
    const date = d2.date.substring(0, 10);
    list.push(`<li>${date} <a href=https://fukuno.jig.jp/${id}>${title}</a></li>`);
  }
  list.push("</ul>");
  /*
  list.push("<h3>似てない記事リンク</h3><ul>");
  for (let i = 1; i <= 3; i++) {
    const id = d["dissimilar" + i];
    const title = titles.find(i => i.id == id).title;
    list.push(`<li><a href=https://fukuno.jig.jp/${id}>${title}</a></li>`);
  }
  list.push("</ul>");
  */
  return list.join("\n");
};
const makeData = (d) => {
  d.description = makeShort(d.body);
  d.img = makeThumbnail(d.body);
  d.tag = makeTag(d.title);
  d.title = cutHash(d.title);
  d.dt = makeDate(d.pubDate);
  return d;
};
const makeData2 = (d) => {
  d.body = decodeXML(d.body);
  d.guid = d.id;
  d.description = makeShort(d.body);
  d.img = makeThumbnail(d.body);
  d.tag = makeTag(d.tags);
  delete d.tags;
  d.dt = makeDate(d.date);
  delete d.date;
  return d;
};

const getDate = (d) => {
  if (!d) {
    d = new Date();
  }
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const date = d.getDate();
  //return y + "-" + fix0(m, 2) + "-" + fix0(date, 2) + "T" + fix0(h, 2) + ":" + fix0(min, 2);
  return "" + y + "-" + fix0(m, 2) + "-" + fix0(date, 2);
};

const makeDate = (date) => {
  const d = new Date(date);
  return getDate(d);
};
const makeTag = (title) => {
  const n = title.indexOf("#");
  if (n < 0) {
    return "";
  }
  return title.substring(n);
};

const cutHash = (title) => {
  const n = title.indexOf(" #");
  if (n < 0) {
    return title;
  }
  return title.substring(0, n);
};

const cutTags = (s) => {
  const res = [];
  let idx = 0;
  for (;;) {
    const n = s.indexOf("<", idx);
    if (n < 0) {
      res.push(s.substring(idx));
      break;
    }
    res.push(s.substring(idx, n));
    const m = s.indexOf(">", n);
    if (m < 0) {
      console.log("err!! " + s);
      idx = s.length;
    } else {
      idx = m + 1;
    }
  }
  return res.join("");
};
const cutSpaces = (s) => {
  s = s.replace(/\s/g, "");
  return s;
};
const makeShort = (body) => {
  const b = cutSpaces(cutTags(body));
  const len = Math.min(b.length, SHORT_LEN);
  return b.substring(0, len) + "...";
};

const decodeXML = (s) => {
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&amp;/g, "&");
  return s;
};
const xml2json = (sxml) => {
  const names = ["title", "guid", "pubDate"];
  const res = {};
  for (const name of names) {
    const n = sxml.indexOf("<" + name + ">");
    const m = sxml.indexOf("</" + name + ">", n);
    if (n < 0 || m < 0) {
      return null;
    }
    const s = sxml.substring(n + name.length + 2, m);
    res[name] = decodeXML(s);
  }
  const n = sxml.indexOf("<description><![CDATA[");
  const m = sxml.lastIndexOf("]]></description>");
  const s = sxml.substring(n + 22, m);
  res["description"] = decodeXML(s);
  return res;
};

const handle = async (path, req) => {
  try {
    const getRange = (req) => {
      const range = req.headers.get("Range");
      if (!range || !range.startsWith("bytes=")) {
        return null;
      }
      const res = range.substring(6).split("-");
      if (res.length === 0) {
        return null;
      }
      return res;
    };
    const range = getRange(req);
    const fn = path === "/" || path.indexOf("..") >= 0
      ? "/index.html"
      : path;
    const n = fn.lastIndexOf(".");
    const ext = n < 0 ? "html" : fn.substring(n + 1);
    const readFile = async (fn, range, req) => {
      /*
      if (data) {
        return [data, data.length];
      }

      try {
        const d = await Deno.readFile("./static" + fn);
        return d;
      } catch (e) {
        //console.log(e);
      }
      return "not found";
    
      if (!range) {
        if (!data) {
          return [new Uint8Array(0), 0];
        }
        return [data, data.length];
      }
      const offset = parseInt(range[0]);
      const len = range[1]
        ? parseInt(range[1]) - offset + 1
        : data.length - offset;
      const res = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        res[i] = data[offset + i];
      }
      return [res, data.length];
      */
    };
    //const [data, totallen] = await readFile(fn, range, req);
    const data = await readFileCore(fn, req);
    if (!data) {
      const r = await handleWeb("static", req, path)
      return r;
    }
    const ctype = CONTENT_TYPE[ext] || "text/plain";
    const headers = {
      "Content-Type": ctype,
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": data.length,
    };
    return new Response(data, {
      status: 200,
      headers: new Headers(headers),
    });
    /*
    if (range) {
      headers["Content-Range"] = "bytes " + range[0] + "-" + range[1] +
        "/" + totallen;
    }
    return new Response(data, {
      status: range ? 206 : 200,
      headers: new Headers(headers),
    });
    */
  } catch (e) {
    if (this.err) {
      this.err(e);
    }
    if (path !== "/favicon.ico") {
      // console.log("err", path, e.stack);
    }
  }
};

const service = async (req, conn) => {
  const remoteAddr = conn.remoteAddr.hostname;
  //console.log("remoteAddr", remoteAddr);
  try {
    const url = req.url;
    const purl = parseURL(url);
    //console.log({purl})
    req.path = purl.path;
    req.query = purl.query;
    req.host = purl.host;
    req.port = purl.port;
    req.remoteAddr = remoteAddr;        
    //console.log("REQ", req);
    await log(req);
    const resd = await handle(purl.path, req);
    //console.log(purl.path, resd);
    //res.respondWith(resd);
    return resd;
  } catch (e) {
    if (this.err) {
      this.err(e);
    }
  }
};

class Server {
  constructor(port) {
    this.start(port);
  }
  async start(port) {

    /*
    const hostname = "::";
    console.log(`http://localhost:${port}/`);
    for await (const conn of Deno.listen({ port, hostname })) {
      (async () => {
        for await (const res of Deno.serveHttp(conn)) {
          const req = res.request;
          const purl = parseURL(req.url);
          const resd = handle(purl.path, req);
          res.respondWith(resd);
        }
      })();
    }
    */
    const hostname = "[::]"; // for IPv6
    //const addr = hostname + ":" + port;
    Deno.serve({ port, hostname }, service);
  }
  err(e) {
    console.log(e);
  }
}

//const port = parseInt(Deno.args[0]);
//new Server(port);
// $ deno run -A fukunojigjp.js 8085

// for deno serve
// $ deno serve -A --parallel --host='[::]' --port=8085 fukunojigjp.js
export default { fetch: service };
