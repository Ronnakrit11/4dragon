/*
  # Add 2FA fields to users table

  1. Changes
    - Add two_factor_secret column to store TOTP secret
    - Add two_factor_enabled column to track 2FA status
*/

ALTER TABLE users 
ADD COLUMN two_factor_secret text,
ADD COLUMN two_factor_enabled boolean DEFAULT false;