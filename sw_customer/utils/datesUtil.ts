import {
  differenceInDays,
  format,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { enGB } from "date-fns/locale";

export function formatDateRelative(dateString: string | null) {
  if (dateString === null) return "";

  const date = parseISO(dateString);

  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }

  const diffInDays = differenceInDays(new Date(), date);
  if (diffInDays === 1) {
    return `${diffInDays} day ago`;
  }

  if (diffInDays <= 5) {
    return `${diffInDays} days ago`;
  }

  return format(date, "dd/MM/yyyy");
}

export function formatDate(date: string | null) {
  if (date === null) return "";
  return format(parseISO(date), "dd/MM/yyyy");
}

export function formatDateTime(date: string | null) {
  if (date === null) return "";
  return format(parseISO(date), "PPpp", { locale: enGB });
}

export function formatDateShortYear(date: string | null) {
  if (date === null) return "";
  return format(parseISO(date), "dd/MM/yy");
}
