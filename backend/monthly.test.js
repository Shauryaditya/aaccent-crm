const { test } = require('node:test');
const assert = require('node:assert/strict');
const { enrolledInMonth, activeInMonth, withLegacyAdmission, growthReport, eligibleTeachers, validDate, validMonth } = require('./monthly');
test('A legacy September-created profile with an August payment belongs in August', () => {
  const student = { id: 'diya', created_at: '2026-09-12T01:57:49Z' };
  const payments = [{ studentId: 'diya', month: '2026-08' }, { studentId: 'diya', month: '2026-09' }];
  assert.equal(activeInMonth(withLegacyAdmission(student, payments), '2026-08'), true);
  assert.equal(activeInMonth(withLegacyAdmission(student, payments), '2026-09'), true);
  assert.equal(activeInMonth(withLegacyAdmission(student, []), '2026-08'), false);
  assert.equal(withLegacyAdmission({ ...student, admissionDate: '2026-09-01' }, payments).admissionDate, '2026-09-01');
});
test('Removing from August preserves September and restoring preserves other months', () => {
  const student = { id: '1', admissionDate: '2026-08-01' };
  const exclusions = [{ studentId: '1', month: '2026-08' }];
  assert.equal(activeInMonth(student, '2026-08', exclusions), false);
  assert.equal(activeInMonth(student, '2026-09', exclusions), true);
  assert.equal(activeInMonth(student, '2026-08', []), true);
});
test('Growth reports monthly net changes and quarter/year closing counts without future months', () => {
  const students = [{ id: '1', admissionDate: '2026-01-01' }, { id: '2', admissionDate: '2026-09-01' }];
  const report = growthReport(students, [{ studentId: '1', month: '2026-08' }], 2026, '2026-09');
  assert.equal(report.monthly.length, 9);
  assert.equal(report.monthly[7].total, 0);
  assert.equal(report.monthly[7].removed, 1);
  assert.equal(report.monthly[8].total, 2);
  assert.equal(report.monthly[8].added, 2);
  assert.equal(report.quarterly[2].change, 1);
  assert.equal(report.yearly.total, 2);
  assert.equal(report.yearly.change, 2);
});
test('September admission never appears in August, but appears from September onwards', () => {
  const student = { admissionDate: '2026-09-15' };
  assert.equal(enrolledInMonth(student, '2026-08'), false);
  assert.equal(enrolledInMonth(student, '2026-09'), true);
  assert.equal(enrolledInMonth(student, '2026-10'), true);
});
test('Legacy records fall back to creation date and explicit admission takes precedence', () => {
  assert.equal(enrolledInMonth({ created_at: '2026-09-15T12:00:00Z' }, '2026-08'), false);
  assert.equal(enrolledInMonth({ admissionDate: '2026-08-01', created_at: '2026-09-15T12:00:00Z' }, '2026-08'), true);
});
test('Teacher assignments respect subject and grade boundaries', () => {
  assert.deepEqual(eligibleTeachers('Class 7', 'Maths').map(t => t.id), ['subrata', 'sanjay']);
  assert.deepEqual(eligibleTeachers('Class 8', 'Maths').map(t => t.id), ['subrata']);
  assert.deepEqual(eligibleTeachers('Class 10', 'Chemistry').map(t => t.id), ['mukta']);
  assert.deepEqual(eligibleTeachers('Class 11', 'Chemistry'), []);
  assert.deepEqual(eligibleTeachers('Class 12', 'Physics').map(t => t.id), ['mukta']);
  assert.deepEqual(eligibleTeachers('Class 12', 'Computer').map(t => t.id), ['sanjay']);
});
test('Reject invalid dates and months', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2026-09-13'), true);
  assert.equal(validMonth('2026-13'), false);
});
