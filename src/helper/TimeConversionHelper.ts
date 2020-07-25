"use strict"

import {TimeConversion} from "../Enums"

export class TimeConversionHelper {
  /**
   * Converts seconds to formatted YY MM DD HH MM SS string
   */
  public static secondsToYYMMDDHHMMSS (inputSeconds: number | string, fullUnit: boolean = false): string {
    const secNum = parseInt(inputSeconds + "", 10) // don't forget the second param
    /* eslint-disable no-multi-spaces */
    const years = Math.floor(secNum / TimeConversion.YearToSeconds)
    const months = Math.floor((secNum - years * TimeConversion.YearToSeconds) / TimeConversion.MonthToSeconds)
    const days = Math.floor((secNum - years * TimeConversion.YearToSeconds - months * TimeConversion.MonthToSeconds) / TimeConversion.DayToSeconds)
    const hours = Math.floor((secNum - years * TimeConversion.YearToSeconds - months * TimeConversion.MonthToSeconds - days * TimeConversion.DayToSeconds) / TimeConversion.HourToSeconds)
    const minutes = Math.floor((secNum - years * TimeConversion.YearToSeconds - months * TimeConversion.MonthToSeconds - days * TimeConversion.DayToSeconds - hours * TimeConversion.HourToSeconds) / TimeConversion.MinuteToSeconds)
    const seconds = Math.floor(secNum - years * TimeConversion.YearToSeconds - months * TimeConversion.MonthToSeconds - days * TimeConversion.DayToSeconds - hours * TimeConversion.HourToSeconds - minutes * TimeConversion.MinuteToSeconds)
    /* eslint-enable no-multi-spaces */

    return this.valuesToString(fullUnit, seconds, minutes, hours, days, months, years)
  }

  /**
   * Converts seconds to formatted HH MM SS string
   */
  public static secondsToHHMMSS (inputSeconds: number | string, fullUnit: boolean = false): string {
    const secNum = parseInt(inputSeconds + "", 10) // don't forget the second param
    /* eslint-disable no-multi-spaces */
    const hours = Math.floor(secNum / TimeConversion.HourToSeconds)
    const minutes = Math.floor((secNum - hours * TimeConversion.HourToSeconds) / TimeConversion.MinuteToSeconds)
    const seconds = Math.floor(secNum - hours * TimeConversion.HourToSeconds - minutes * TimeConversion.MinuteToSeconds)
    /* eslint-enable no-multi-spaces */

    return this.valuesToString(fullUnit, seconds, minutes, hours)
  }

  /**
   * converts seconds to formatted HH MM string
   */
  public static secondsToHHMM (inputSeconds: number | string, fullUnit: boolean = false): string {
    const secNum = parseInt(inputSeconds + "", 10) // don't forget the second param
    /* eslint-disable no-multi-spaces */
    const hours = Math.floor(secNum / TimeConversion.HourToSeconds)
    const minutes = Math.floor((secNum - hours * TimeConversion.HourToSeconds) / TimeConversion.MinuteToSeconds)
    /* eslint-enable no-multi-spaces */

    return this.valuesToString(fullUnit, 0, minutes, hours)
  }

  /**
   * Creates a nicely formatted string for things like uptime
   */
  public static valuesToString (fullUnit: boolean = false, seconds: number = 0, minutes: number = 0, hours: number = 0, days: number = 0, months: number = 0, years: number = 0): string {
    let time = ""
    if (seconds > 0) {
      time = seconds + this.unitSecond(fullUnit, seconds > 1) + " " + time
    }
    if (minutes > 0 || hours > 0) {
      time = minutes + this.unitMinute(fullUnit, minutes > 1) + " " + time
    }
    if (hours > 0) {
      time = hours + this.unitHour(fullUnit, hours > 1) + " " + time
    }
    if (days > 0) {
      time = days + this.unitDay(fullUnit, days > 1) + " " + time
    }
    if (months > 0) {
      time = months + this.unitMonth(fullUnit, months > 1) + " " + time
    }
    if (years > 0) {
      time = years + this.unitYear(fullUnit, years > 1) + " " + time
    }
    return time
  }

  public static unitSecond (fullUnit: boolean = false, plural: boolean = false): string {
    return fullUnit ? " second" + (plural ? "s" : "") : "s"
  }

  public static unitMinute (fullUnit: boolean = false, plural: boolean = false): string {
    return fullUnit ? " minute" + (plural ? "s" : "") : "m"
  }

  public static unitHour (fullUnit: boolean = false, plural: boolean = false): string {
    return fullUnit ? " hour" + (plural ? "s" : "") : "h"
  }

  public static unitDay (fullUnit: boolean = false, plural: boolean = false): string {
    return fullUnit ? " day" + (plural ? "s" : "") : "d"
  }

  public static unitMonth (fullUnit: boolean = false, plural: boolean = false): string {
    return fullUnit ? " month" + (plural ? "s" : "") : "m"
  }

  public static unitYear (fullUnit: boolean = false, plural: boolean = false): string {
    return fullUnit ? " year" + (plural ? "s" : "") : "y"
  }
}

