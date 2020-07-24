"use strict"

import console from "console"
//import {setTimeout, clearTimeout} from "timers"
//import util from "util"

console.log("qwer")

const timeout = setTimeout(() => { return "xd" }, 1000)
clearTimeout(timeout)

global.clearTimeout(timeout)

console.log("asdf")

console.log("xd")
