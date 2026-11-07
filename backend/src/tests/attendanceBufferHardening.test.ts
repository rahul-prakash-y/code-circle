import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import attendanceBuffer from '../services/attendanceBuffer';

describe('Attendance Buffer Hardening: Expiry & Per-User Attempt Limits', () => {
  const eventId = 'test-event-hardened-101';
  const userId = 'student-test-user-001';
  const validOtp = '9876';

  beforeEach(() => {
    attendanceBuffer.resetBuffer();
  });

  test('OTP expires after configured TTL', () => {
    // Set OTP with an immediate past expiry (negative TTL)
    const testDay = 1;
    // Set OTP with a 1-minute TTL
    attendanceBuffer.setEventOTP(eventId, validOtp, testDay, 1);
    assert.equal(attendanceBuffer.getEventOTP(eventId, testDay), validOtp);

    // Simulate expiry by setting an expired record directly
    const dayKey = `${eventId}:day:${testDay}`;
    attendanceBuffer.activeOTPs.set(dayKey, { otp: validOtp, expiresAt: Date.now() - 1000 });

    assert.equal(
      attendanceBuffer.getEventOTP(eventId, testDay),
      undefined,
      'Expired OTP must return undefined'
    );

    // Verify submission against expired OTP fails
    const result = attendanceBuffer.verifyAndQueue(userId, eventId, validOtp, testDay);
    assert.equal(result.success, false);
    assert.match(result.error || '', /Invalid or expired OTP/i);
  });

  test('Tracks failed OTP attempts per user per event', () => {
    const testDay = 1;
    attendanceBuffer.setEventOTP(eventId, validOtp, testDay, 30);

    // Attempt 1: Wrong OTP
    const res1 = attendanceBuffer.verifyAndQueue(userId, eventId, '0000', testDay);
    assert.equal(res1.success, false);
    assert.match(res1.error || '', /Attempts remaining: 4/i);

    // Attempt 2: Wrong OTP
    const res2 = attendanceBuffer.verifyAndQueue(userId, eventId, '1111', testDay);
    assert.equal(res2.success, false);
    assert.match(res2.error || '', /Attempts remaining: 3/i);

    // Attempt 3: Wrong OTP
    const res3 = attendanceBuffer.verifyAndQueue(userId, eventId, '2222', testDay);
    assert.equal(res3.success, false);
    assert.match(res3.error || '', /Attempts remaining: 2/i);

    // Attempt 4: Wrong OTP
    const res4 = attendanceBuffer.verifyAndQueue(userId, eventId, '3333', testDay);
    assert.equal(res4.success, false);
    assert.match(res4.error || '', /Attempts remaining: 1/i);

    // Attempt 5: 5th failure triggers lockout
    const res5 = attendanceBuffer.verifyAndQueue(userId, eventId, '4444', testDay);
    assert.equal(res5.success, false);
    assert.match(res5.error || '', /Maximum OTP verification attempts exceeded/i);

    // Attempt 6: Locked out even with the CORRECT OTP
    const res6 = attendanceBuffer.verifyAndQueue(userId, eventId, validOtp, testDay);
    assert.equal(res6.success, false);
    assert.match(res6.error || '', /Account locked/i);
  });

  test('Valid OTP submission clears failed attempt counter', () => {
    const testDay = 1;
    attendanceBuffer.setEventOTP(eventId, validOtp, testDay, 30);

    // 2 failed attempts
    attendanceBuffer.verifyAndQueue(userId, eventId, '0000', testDay);
    attendanceBuffer.verifyAndQueue(userId, eventId, '1111', testDay);

    const attemptKey = `${userId}:${eventId}`;
    assert.equal(attendanceBuffer.failedAttempts.get(attemptKey)?.attempts, 2);

    // Successful attempt
    const successRes = attendanceBuffer.verifyAndQueue(userId, eventId, validOtp, testDay);
    assert.equal(successRes.success, true);

    // Verify counter was cleared
    assert.equal(attendanceBuffer.failedAttempts.has(attemptKey), false);
  });

  test('Lockout is isolated per user and per event', () => {
    const testDay = 1;
    const anotherUser = 'student-test-user-002';
    const anotherEvent = 'test-event-hardened-102';

    attendanceBuffer.setEventOTP(eventId, validOtp, testDay, 30);
    attendanceBuffer.setEventOTP(anotherEvent, validOtp, testDay, 30);

    // Lockout user 1 on event 1
    for (let i = 0; i < 5; i++) {
      attendanceBuffer.verifyAndQueue(userId, eventId, '9999', testDay);
    }

    // Verify user 1 is locked out on event 1
    const resUser1Event1 = attendanceBuffer.verifyAndQueue(userId, eventId, validOtp, testDay);
    assert.equal(resUser1Event1.success, false);
    assert.match(resUser1Event1.error || '', /Account locked/i);

    // Verify user 2 can still mark attendance on event 1
    const resUser2Event1 = attendanceBuffer.verifyAndQueue(anotherUser, eventId, validOtp, testDay);
    assert.equal(resUser2Event1.success, true);

    // Verify user 1 is NOT locked out on event 2
    const resUser1Event2 = attendanceBuffer.verifyAndQueue(userId, anotherEvent, validOtp, testDay);
    assert.equal(resUser1Event2.success, true);
  });
});
