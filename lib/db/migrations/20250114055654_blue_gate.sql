/*
  # Add verified slips tracking

  1. New Tables
    - `verified_slips`
      - `id` (serial, primary key)
      - `trans_ref` (text, unique) - Transaction reference from slip
      - `amount` (decimal) - Transaction amount
      - `verified_at` (timestamp) - When the slip was verified
      - `user_id` (integer, foreign key) - User who verified the slip
*/

CREATE TABLE IF NOT EXISTS "verified_slips" (
  "id" serial PRIMARY KEY NOT NULL,
  "trans_ref" text NOT NULL UNIQUE,
  "amount" decimal NOT NULL,
  "verified_at" timestamp DEFAULT now() NOT NULL,
  "user_id" integer REFERENCES users(id)
);