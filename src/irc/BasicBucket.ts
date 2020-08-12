"use strict"

import {Logger} from "../helper/Logger"

export class BasicBucket {
  private static TICKET_RETURN_TIMEOUT = 30000
  private _usedTickets: number
  private readonly _limit: number

  constructor (limit: number) {
    this._usedTickets = 0
    this._limit = limit || 20
  }

  get ticketsRemaining (): number {
    return this._limit - this._usedTickets
  }

  /**
   * Take a ticket and start the returnTicket timeout
   * @returns Was a ticket taken? If false = no tickets left. Try again later.
   */
  takeTicket (): boolean {
    if (this._usedTickets < this._limit) {
      this._usedTickets++
      setTimeout(() => this.returnTicket(), BasicBucket.TICKET_RETURN_TIMEOUT)
      return true
    } else {
      return false
    }
  }

  /**
   * Returns one used ticket and there for reduces the used tickets amount by one.
   */
  private returnTicket () {
    if (this._usedTickets > 0) {
      this._usedTickets--
    } else {
      Logger.error("Ticket returned when there where none given out!")
    }
  }
}

