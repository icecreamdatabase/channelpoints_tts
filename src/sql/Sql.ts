"use strict"
/* eslint-disable @typescript-eslint/ban-ts-comment */

import Mysql from "mysql2/promise"

import * as config from "../config.json"

//cast bit(1) to boolean
//https://www.bennadel.com/blog/3188-casting-bit-fields-to-booleans-using-the-node-js-mysql-driver.htm
// @ts-ignore
config.mysqloptions.typeCast = function castField(field, useDefaultTypeCasting) {
    // We only want to cast bit fields that have a single-bit in them. If the field
    // has more than one bit, then we cannot assume it is supposed to be a Boolean.
    if ((field.type === "BIT") && (field.length === 1)) {
        const bytes = field.buffer()
        //Account for the (hopefully rare) case in which a BIT(1) field would be NULL
        if (bytes === null) {
            return null
        }
        // A Buffer in Node represents a collection of 8-bit unsigned integers.
        // Therefore, our single "bit field" comes back as the bits '0000 0001',
        // which is equivalent to the number 1.
        return (bytes[0] === 1)
    }
    return (useDefaultTypeCasting())
}

class Sql {
    public pool: Mysql.Pool;

    constructor () {
        this.pool = Mysql.createPool(config.mysqloptions)
    }

    static get instance (): Sql {
        // @ts-ignore
        if (global.SqlSingletonInstance === undefined) {
            // @ts-ignore
            global.SqlSingletonInstance = new Sql()
        }
        // @ts-ignore
        return global.SqlSingletonInstance
    }
}

export = Sql.instance.pool
