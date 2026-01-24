import { useEffect, useMemo, useState } from "react";

import { formatCountdown } from "@/lib/format";

const getZonedParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const grab = (type) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: grab("year"),
    month: grab("month"),
    day: grab("day"),
    hour: grab("hour"),
    minute: grab("minute"),
    second: grab("second"),
  };
};

const getTimeZoneOffsetMinutes = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const tz = formatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = tz?.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2] || "0");
  return hours * 60 + (hours >= 0 ? minutes : -minutes);
};

const getNextDrawTimestamp = (nowMs) => {
  const timeZone = "America/New_York";
  const now = new Date(nowMs);
  const parts = getZonedParts(now, timeZone);
  const isAfterDraw =
    parts.hour > 14 || (parts.hour === 14 && parts.minute >= 20);

  let year = parts.year;
  let month = parts.month;
  let day = parts.day;

  if (isAfterDraw) {
    const nextDay = new Date(Date.UTC(year, month - 1, day));
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    year = nextDay.getUTCFullYear();
    month = nextDay.getUTCMonth() + 1;
    day = nextDay.getUTCDate();
  }

  const baseUtc = new Date(Date.UTC(year, month - 1, day, 14, 20, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(baseUtc, timeZone);
  return Date.UTC(year, month - 1, day, 14, 20, 0) - offsetMinutes * 60 * 1000;
};

const useNextDrawCountdown = () => {
  const [now, setNow] = useState(Date.now());
  const [nextDrawAt, setNextDrawAt] = useState(() =>
    getNextDrawTimestamp(Date.now())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= nextDrawAt) {
        setNextDrawAt(getNextDrawTimestamp(current + 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrawAt]);

  return useMemo(
    () => formatCountdown(nextDrawAt - now),
    [nextDrawAt, now]
  );
};

export default useNextDrawCountdown;
