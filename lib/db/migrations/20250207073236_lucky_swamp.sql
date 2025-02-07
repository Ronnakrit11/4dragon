/*
  # Add phone field to users table

  1. Changes
    - Add phone column to users table for storing contact numbers
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone varchar(20);
  END IF;
END $$;