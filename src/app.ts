"use strict"

import console from "console"
import sql from "./sql/Sql"
import util from "util"

console.log("xd")

sql.query("SELECT * FROM counters").then(data => {
    console.log(util.inspect(data))
})
