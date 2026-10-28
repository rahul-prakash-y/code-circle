// Helper to get student college, always defaulting to 'BIT'
export const getStudentCollege = (user: any): string => {
  if (user?.college && String(user.college).trim()) {
    return String(user.college).trim();
  }
  return 'BIT';
};

// Helper to derive year label from prefix number (2-digit or 4-digit)
// Rule: starts with 2023 / 23 -> 4th Year, 2024 / 24 -> 3rd Year, 2025 / 25 -> 2nd Year, 2026+ / 26+ -> 1st Year
const deriveYearFromPrefix = (prefixNum: number): string => {
  const y = prefixNum < 100 ? 2000 + prefixNum : prefixNum;
  if (y <= 2023) return '4th Year';
  if (y === 2024) return '3rd Year';
  if (y === 2025) return '2nd Year';
  if (y >= 2026) return '1st Year';
  return '1st Year';
};

// Helper to derive student year accurately, ensuring it is always present
export const getStudentYear = (user: any): string => {
  if (!user) return '1st Year';

  const roll = String(user.rollNo || '').toUpperCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  // 1. 4-digit Year Prefix (e.g. 2023..., 2026..., 2026UAD1021, 2023CS101)
  const fourDigitMatch = roll.match(/^(20\d{2})/);
  if (fourDigitMatch) {
    return deriveYearFromPrefix(parseInt(fourDigitMatch[1], 10));
  }

  // 2. Anna University register format: 7376YY... (e.g. 7376231CS272 -> 23 -> 4th Year, 7376261CS101 -> 26 -> 1st Year)
  const auMatch = roll.match(/^7376(\d{2})/);
  if (auMatch) {
    return deriveYearFromPrefix(parseInt(auMatch[1], 10));
  }

  // 3. 2-digit roll format: e.g. 23CS012 -> 4th Year, 241CS222 -> 3rd Year, 26AD105 -> 1st Year
  const twoDigitRollMatch = roll.match(/^(\d{2})/);
  if (twoDigitRollMatch) {
    const val = parseInt(twoDigitRollMatch[1], 10);
    if (val >= 18 && val <= 30) {
      return deriveYearFromPrefix(val);
    }
  }

  // 4. Institutional email format: .ad26@bitsathy.ac.in (26 -> 1st Year) or .cs23@bitsathy.ac.in (23 -> 4th Year)
  const emailMatch = email.match(/([a-z]+)(\d{2})@bitsathy\.ac\.in/);
  if (emailMatch) {
    return deriveYearFromPrefix(parseInt(emailMatch[2], 10));
  }

  // 5. Fallback to explicitly stored user.year if roll/email didn't match
  if (user.year) {
    const yStr = String(user.year).trim();
    if (/^[1-4]$/.test(yStr)) {
      const map: Record<string, string> = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
      return map[yStr] || `${yStr} Year`;
    }
    if (yStr.toLowerCase().includes('year')) return yStr;
    return `${yStr} Year`;
  }

  return '1st Year';
};
