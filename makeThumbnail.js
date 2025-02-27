export const makeThumbnail = (body) => {
  const b = body;
  const n = b.indexOf("<img ");
  if (n < 0) {
    return;
  }
  const n2 = b.indexOf(">", n);
  const b2 = b.substring(n, n2);
  let m = b2.indexOf(' src="');
  if (m >= 0) {
    const m2 = b2.indexOf('"', m + 6);
    if (m2 >= 0) {
      return b2.substring(m + 6, m2);
    }
    return null;
  }
  m = b2.indexOf(" src='");
  if (m >= 0) {
    const m2 = b2.indexOf("'", m + 6);
    if (m2 >= 0) {
      return b2.substring(m + 6, m2);
    }
    return null;
  }
  m = b2.indexOf(" src=");
  if (m >= 0) {
    const m2 = b2.indexOf(" ", m + 5);
    if (m2 >= 0) {
      return b2.substring(m + 5, m2);
    }
    return b2.substring(m + 5);
  }
  return null;
};

