// Daily stays are priced per night, like a hotel, the same way the server prices them.
const DAY_MS = 24 * 60 * 60 * 1000;
const day = (date) => Math.floor(Date.parse(String(date).slice(0, 10)) / DAY_MS);

/** Nights from check-in to check-out (YYYY-MM-DD dates); a same-day check-out counts as one. */
export function stayNights(checkIn, checkOut) {
  return Math.max(1, day(checkOut) - day(checkIn));
}

export const isDaily = (item) => item?.stayType === 'DAILY';
