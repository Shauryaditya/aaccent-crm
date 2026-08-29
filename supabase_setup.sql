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

-- Note: Since our Express backend server acts as a proxy using your secret API key,
-- it will bypass Row Level Security (RLS) to manage the data.
-- You can leave RLS disabled for the "students" table or enable it without policies,
-- since only your Express server (not client browsers) will query it directly.
