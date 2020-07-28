"use strict"
import {Logger} from "./Logger";

export class IdHelper {
  private constructor () {
  }

  static IdToNumber (id: number | string): number {
    return typeof id === "number" ? id : parseInt(id)
  }

  static IdToString (id: number | string): string {
    return typeof id === "string" ? id : String(id)
  }
}
