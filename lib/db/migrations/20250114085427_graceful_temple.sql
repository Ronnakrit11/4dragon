/*
  # Add gold assets tracking

  1. New Tables
    - `gold_assets`
      - `id` (serial, primary key)
      - `user_id` (integer, foreign key) - References users table
      - `gold_type` (varchar) - Type of gold (e.g., ทองสมาคม, ทอง 99.99%)
      - `amount` (decimal) - Amount of gold owned
      - `purchase_price` (decimal) - Price per unit at purchase
      - `created_at` (timestamp) - When the asset was first acquired
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on `gold_assets` table
    - Add policy for users to read their own assets
*/

CREATE TABLE IF NOT EXISTS "gold_assets" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer REFERENCES users(id) NOT NULL,
  "gold_type" varchar(50) NOT NULL,
  "amount" decimal NOT NULL DEFAULT 0,
  "purchase_price" decimal NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE gold_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own gold assets"
  ON gold_assets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gold assets"
  ON gold_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gold assets"
  ON gold_assets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);