import {skip, test, solo} from "brittle";
import {senal} from "../lib/senal.js";
import {tada} from "../lib/tada.js";
import {serialize, deserialize} from "siero";
import { hash } from "object-code";

test("serialize senal", async t => {
    const s = senal({ten: 10, func: () => 10});

    const w = serialize(s);
    const h = hash(w);
    const r = senal(deserialize(w));

    const ttt = await r.func();
    t.is(ttt, 10);
    t.is(r.ten, 10);
});