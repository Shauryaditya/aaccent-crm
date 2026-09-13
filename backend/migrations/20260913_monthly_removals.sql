-- Run in the Supabase SQL Editor for the live project.
-- Preserves existing students and payment records.
BEGIN;

CREATE TABLE IF NOT EXISTS public.student_month_exclusions (
  "studentId" TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY ("studentId", month)
);

ALTER TABLE public.student_month_exclusions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.student_month_exclusions TO service_role;
NOTIFY pgrst, 'reload schema';

COMMIT;
