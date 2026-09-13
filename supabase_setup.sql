-- SQL script to initialize the "students" table in your Supabase database.
-- Copy and paste this into the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query) and click Run.

CREATE TABLE IF NOT EXISTS students (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "parentName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "class" TEXT NOT NULL,
  "board" TEXT NOT NULL,
  "subjects" INTEGER NOT NULL,
  "fee" INTEGER NOT NULL,
  "status" TEXT DEFAULT 'Pending',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  "id" TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "month" TEXT NOT NULL, -- Format: YYYY-MM (e.g. '2026-08')
  "amount" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("studentId", "month")
);

-- Note: Since our Express backend server acts as a proxy using your secret API key,
-- it will bypass Row Level Security (RLS) to manage the data.
-- You can leave RLS disabled for both tables, since only your Express server 
-- (not client browsers) will query them directly.

-- Monthly enrolment and teacher salary migration (safe to run on existing tables).
ALTER TABLE students ADD COLUMN IF NOT EXISTS "admissionDate" DATE;
UPDATE students s SET "admissionDate" = LEAST((s.created_at AT TIME ZONE 'Asia/Kolkata')::date,
  (SELECT MIN((p.month || '-01')::date) FROM payments p WHERE p."studentId" = s.id)) WHERE s."admissionDate" IS NULL;
ALTER TABLE students ALTER COLUMN "admissionDate" SET NOT NULL;

CREATE TABLE IF NOT EXISTS teacher_classes (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  "studentId" TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "studentName" TEXT NOT NULL,
  "studentClass" TEXT NOT NULL,
  subject TEXT NOT NULL,
  "teacherId" TEXT NOT NULL CHECK ("teacherId" IN ('subrata', 'mukta', 'sanjay')),
  classes INTEGER NOT NULL CHECK (classes >= 0),
  "teacherShare" NUMERIC(12,2) NOT NULL CHECK ("teacherShare" >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, "studentId", subject)
);

-- Upgrade an existing salary ledger to one teacher per student subject.
-- Resolve any duplicate subject assignments before running this index statement.
CREATE UNIQUE INDEX IF NOT EXISTS teacher_classes_student_subject_month
ON teacher_classes (month, "studentId", subject);
ALTER TABLE teacher_classes DROP CONSTRAINT IF EXISTS teacher_classes_classes_check;
ALTER TABLE teacher_classes ADD CONSTRAINT teacher_classes_classes_check CHECK (classes >= 0);

CREATE TABLE IF NOT EXISTS student_month_exclusions (
  "studentId" TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY ("studentId", month)
);
