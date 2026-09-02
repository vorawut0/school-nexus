/**
 * Email & Identity Validation Utilities
 * Ensures email addresses conform to real, valid existing standards.
 */

// Standard RFC 5322 compliant email regex with valid multi-level domain support
const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Obvious dummy or fake domains to filter out
const BANNED_DUMMY_DOMAINS = [
  'test.com',
  'test.test',
  'fake.com',
  'example.com',
  'sample.com',
  'temp.com',
  'tempmail.com',
  'dummy.com',
  'none.com',
  'null.com',
  'asdf.com',
  'aaa.com',
  'bbb.com',
  '123.com',
  'abc.com',
];

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail?: string;
}

/**
 * Validates whether an email string is a real, structurally sound, and reachable format
 */
export function validateRealEmail(email: string): EmailValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'กรุณาระบุที่อยู่อีเมล' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Basic length check
  if (cleanEmail.length < 6 || cleanEmail.length > 254) {
    return { isValid: false, error: 'ความยาวอีเมลต้องอยู่ระหว่าง 6 - 254 ตัวอักษร' };
  }

  // 2. Must have exactly one @
  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง ต้องมีเครื่องหมาย @ หนึ่งตัว เช่น yourname@gmail.com' };
  }

  const [localPart, domainPart] = parts;

  // 3. Local part validations
  if (!localPart || localPart.length < 1 || localPart.length > 64) {
    return { isValid: false, error: 'ชื่อผู้ใช้อีเมล (ก่อน @) ไม่ถูกต้อง' };
  }

  // 4. Domain part validations
  if (!domainPart || !domainPart.includes('.')) {
    return {
      isValid: false,
      error: 'กรุณาระบุชื่อโดเมนของอีเมลให้ครบถ้วน เช่น @gmail.com, @hotmail.com หรือ @school.ac.th',
    };
  }

  // Check for consecutive dots
  if (domainPart.includes('..') || cleanEmail.includes('..')) {
    return { isValid: false, error: 'อีเมลต้องไม่มีจุด (.) ต่อกัน' };
  }

  // Check top-level domain (TLD)
  const domainSegments = domainPart.split('.');
  const tld = domainSegments[domainSegments.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { isValid: false, error: 'นามสกุลโดเมน (TLD) ไม่ถูกต้อง เช่น .com, .net, .co.th, .ac.th' };
  }

  // 5. Strict Regex test
  if (!STRICT_EMAIL_REGEX.test(cleanEmail)) {
    return { isValid: false, error: 'รูปแบบอีเมลไม่ถูกต้องตามมาตรฐานสากล' };
  }

  // 6. Filter out known dummy domains
  if (BANNED_DUMMY_DOMAINS.includes(domainPart)) {
    return {
      isValid: false,
      error: `โดเมน @${domainPart} เป็นโดเมนทดสอบ กรุณาใช้อีเมลจริงของคุณ เช่น @gmail.com หรืออีเมลสถานศึกษา`,
    };
  }

  return {
    isValid: true,
    normalizedEmail: cleanEmail,
  };
}
