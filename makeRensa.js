import { Rensa } from "https://RensaData.github.io/Rensa-es/Rensa.js";
import Ed25519 from "https://taisukef.github.io/forge-es/lib/ed25519.js";
import { TAI64N } from "https://code4fukui.github.io/TAI64N-es/TAI64N.js";
import { CBOR } from "https://js.sabae.cc/CBOR.js";
import { RensaIMI } from "https://RensaData.github.io/imi/RensaIMI.js";

const keyfn = "/Users/fukuno/memo/key/key-taisukef-20220101.cbor";
const key = CBOR.decode(await Deno.readFile(keyfn))
const pubkey = key[RensaIMI.publicKey.url];
const prikey = key[RensaIMI.privateKey.url];

export const makeRensa = async (fn, json) => {
  //console.log(fn);
  const fn2 = fn.substring(0, fn.length - 4).replace("/xml/", "/rensa/") + ".rensa";
  try {
    const frensa = await Deno.stat(fn2);
    if (frensa.isFile) {
      const fxml = await Deno.stat(fn);
      if (frensa.mtime.getTime() > fxml.mtime.getTime()) {
        return;
      }
      console.log(frensa.mtime.getTime(), fxml.mtime.getTime());
    }
  } catch (e) {
    console.log(e);
  }
  const trx = new Rensa((signData) => {
    const sig = Ed25519.sign({
        privateKey: prikey,
        message: signData,
        encoding: "binary"
      });
    return [pubkey, sig];
  });
  trx.addAndSign(1, json);
  //console.log("verify", trx.verify());
  //console.log(trx.toString());
  const bin = trx.toCBOR();
  console.log(fn2);
  await Deno.mkdir(fn2.substring(0, fn2.lastIndexOf("/")), { recursive: true });
  await Deno.writeFile(fn2, bin);
};
