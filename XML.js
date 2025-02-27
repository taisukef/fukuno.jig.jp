const XML = {};

XML.toJSON = (xml) => { // xml: XML object on Web, attribute無視、名前重なったら配列化
  const f = (xml) => {
    const json = {};
    const text = [];
    let hasxml = false;
    for (let i = 0; i < xml.childNodes.length; i++) {
      const node = xml.childNodes[i];
      const name = node.nodeName;
      if (name == "#text") {
        text.push(node.textContent);
      } else {
        hasxml = true;
        if (json[name] == null) {
          json[name] = f(node);
        } else {
          if (!(json[name] instanceof Array)) {
            json[name] = [json[name]];
          }
          json[name].push(f(node));
        }
      }
    }
    return hasxml ? json : text.join("");
  };
  return f(xml);
};

export { XML };
