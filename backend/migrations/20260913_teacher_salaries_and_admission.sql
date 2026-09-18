-- Run this complete script in the live project's Supabase SQL Editor.
-- Adds the outstanding fields/tables without deleting student or payment records.
BEGIN;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS "admissionDate" DATE;
UPDATE public.students s
SET "admissionDate" = LEAST(
  (s.created_at AT TIME ZONE 'Asia/Kolkata')::date,
  (SELECT MIN((p.month || '-01')::date)
   FROM public.payments p WHERE p."studentId" = s.id)
)
WHERE s."admissionDate" IS NULL;
ALTER TABLE public.students ALTER COLUMN "admissionDate" SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  "studentId" TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  "studentName" TEXT NOT NULL,
  "studentClass" TEXT NOT NULL,
  subject TEXT NOT NULL,
  "teacherId" TEXT NOT NULL CHECK ("teacherId" IN ('subrata', 'mukta', 'sanjay')),
  classes INTEGER NOT NULL CHECK (classes >= 0),
  "teacherShare" NUMERIC(12,2) NOT NULL CHECK ("teacherShare" >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (month, "studentId", subject)
);

ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.teacher_classes TO service_role;
NOTIFY pgrst, 'reload schema';

COMMIT;
