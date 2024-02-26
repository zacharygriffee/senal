import {test} from "brittle";
import * as rxjs from "rxjs";
import * as rxjsOperators from "rxjs/operators";
import {tada} from "../lib/tada.js";

const rx = {...rxjsOperators, rxjs};

test("A rxjs op can work", async t => {

});