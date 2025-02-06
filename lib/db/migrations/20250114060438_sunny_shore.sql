/*
  # Create verified slips table

  1. New Tables
    - `verified_slips`
      - `id` (serial, primary key)
      - `trans_ref` (text, unique)
      - `amount` (decimal)
      - `verified_at` (timestamp)
      - `user_id` (integer, foreign key)
  
  2. Security
    - Enable RLS on `verified_slips` table
    - Add policy for authenticated users to read their own slips
*/

CREATE TABLE IF NOT EXISTS "verified_slips" (
  "id" serial PRIMARY KEY NOT NULL,
  "trans_ref" text NOT NULL UNIQUE,
  "amount" decimal NOT NULL,
  "verified_at" timestamp DEFAULT now() NOT NULL,
  "user_id" integer REFERENCES users(id)
);

ALTER TABLE verified_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own verified slips"
  ON verified_slips
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verified slips"
  ON verified_slips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);