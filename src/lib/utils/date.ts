export function parseRelativeDate(dateString: string | number | undefined | null): string {
  if (!dateString) return new Date().toISOString();
  
  // If it's a number (timestamp)
  if (typeof dateString === 'number') {
    // If it's in seconds (like Reddit), multiply by 1000
    if (dateString < 10000000000) return new Date(dateString * 1000).toISOString();
    return new Date(dateString).toISOString();
  }

  const str = String(dateString).trim().toLowerCase();
  
  // Attempt native parse first
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    // If native parse succeeded but gave a year like 2001 (e.g. "August 28"), fix the year
    if (parsed.getFullYear() === 2001) {
      parsed.setFullYear(new Date().getFullYear());
    }
    return parsed.toISOString();
  }

  // Handle common relative formats
  const now = Date.now();
  
  if (str.includes('just now') || str === 'now') {
    return new Date(now).toISOString();
  }

  const match = str.match(/^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mos|month|months|y|yr|yrs|year|years)\s*(ago)?$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    let ms = 0;
    if (unit.startsWith('s')) ms = value * 1000;
    else if (unit.startsWith('m') && !unit.startsWith('mo')) ms = value * 60 * 1000;
    else if (unit.startsWith('h')) ms = value * 60 * 60 * 1000;
    else if (unit.startsWith('d')) ms = value * 24 * 60 * 60 * 1000;
    else if (unit.startsWith('w')) ms = value * 7 * 24 * 60 * 60 * 1000;
    else if (unit.startsWith('mo')) ms = value * 30 * 24 * 60 * 60 * 1000;
    else if (unit.startsWith('y')) ms = value * 365 * 24 * 60 * 60 * 1000;

    return new Date(now - ms).toISOString();
  }

  // Fallback if completely unparseable
  // Returning a timestamp of 48 hours ago prevents unparseable dates from spamming the "Today" view.
  return new Date(now - 48 * 60 * 60 * 1000).toISOString();
}
