import { AdapterDateFnsBase } from '@mui/x-date-pickers/AdapterDateFnsBase';
import {
  format,
  parse,
  parseISO,
  isValid,
  isWithinInterval,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addMonths,
  addYears,
  setMonth,
  setYear,
  setDate,
  setHours,
  setMinutes,
  setSeconds,
  getYear,
  getMonth,
  getDate,
  getHours,
  getMinutes,
  getSeconds,
  isSameDay,
  isSameMonth,
  isSameYear,
  isAfter,
  isBefore,
  isEqual,
} from 'date-fns';

export class CustomAdapterDateFns extends AdapterDateFnsBase {
  constructor({ locale } = {}) {
    super({ locale });

    this.format = (date, formatString) => format(date, formatString, { locale: this.locale });
    this.parse = (value, formatString) => parse(value, formatString, new Date(), { locale: this.locale });
    this.parseISO = (isoString) => parseISO(isoString);
    this.isValid = (date) => isValid(date);
    this.isWithinInterval = (date, interval) => isWithinInterval(date, interval);
    this.startOfDay = (date) => startOfDay(date);
    this.endOfDay = (date) => endOfDay(date);
    this.startOfMonth = (date) => startOfMonth(date);
    this.endOfMonth = (date) => endOfMonth(date);
    this.startOfYear = (date) => startOfYear(date);
    this.endOfYear = (date) => endOfYear(date);
    this.addDays = (date, amount) => addDays(date, amount);
    this.addMonths = (date, amount) => addMonths(date, amount);
    this.addYears = (date, amount) => addYears(date, amount);
    this.setMonth = (date, month) => setMonth(date, month);
    this.setYear = (date, year) => setYear(date, year);
    this.setDate = (date, day) => setDate(date, day);
    this.setHours = (date, hours) => setHours(date, hours);
    this.setMinutes = (date, minutes) => setMinutes(date, minutes);
    this.setSeconds = (date, seconds) => setSeconds(date, seconds);
    this.getYear = (date) => getYear(date);
    this.getMonth = (date) => getMonth(date);
    this.getDate = (date) => getDate(date);
    this.getHours = (date) => getHours(date);
    this.getMinutes = (date) => getMinutes(date);
    this.getSeconds = (date) => getSeconds(date);
    this.isSameDay = (date1, date2) => isSameDay(date1, date2);
    this.isSameMonth = (date1, date2) => isSameMonth(date1, date2);
    this.isSameYear = (date1, date2) => isSameYear(date1, date2);
    this.isAfter = (date, comparingDate) => isAfter(date, comparingDate);
    this.isBefore = (date, comparingDate) => isBefore(date, comparingDate);
    this.isEqual = (date, comparingDate) => isEqual(date, comparingDate);
  }
}