"use strict"

import console from "console"
import sql from "./sql/Sql"
import util from "util"
import {DiscordLog} from "./helper/DiscordLog";
import {Logger} from "./helper/Logger";

console.log("xd")

sql.query("SELECT * FROM counters").then(data => {
  console.log(util.inspect(data))
})
