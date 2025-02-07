/*
  # Add phone field to users table

  1. Changes
    - Add phone column to users table
*/

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone varchar(20);