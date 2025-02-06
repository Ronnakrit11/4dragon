/*
  # Add gold products management tables

  1. New Tables
    - `product_categories`
      - `id` (serial, primary key)
      - `name` (varchar) - Category name
      - `description` (text) - Category description
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `gold_products`
      - `id` (serial, primary key)
      - `category_id` (integer, foreign key)
      - `code` (varchar) - Unique product code
      - `name` (varchar) - Product name
      - `description` (text)
      - `weight` (decimal) - Weight in grams or baht
      - `weight_unit` (varchar) - 'gram' or 'baht'
      - `purity` (decimal) - Gold purity percentage
      - `selling_price` (decimal)
      - `workmanship_fee` (decimal)
      - `image_url` (text)
      - `status` (varchar) - 'active' or 'inactive'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access
*/

-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create gold products table
CREATE TABLE IF NOT EXISTS gold_products (
  id serial PRIMARY KEY,
  category_id integer REFERENCES product_categories(id),
  code varchar(50) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  description text,
  weight decimal NOT NULL,
  weight_unit varchar(10) NOT NULL CHECK (weight_unit IN ('gram', 'baht')),
  purity decimal NOT NULL,
  selling_price decimal NOT NULL,
  workmanship_fee decimal NOT NULL,
  image_url text,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold_products ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage product categories"
  ON product_categories
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage gold products"
  ON gold_products
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Add some default categories
INSERT INTO product_categories (name, description) VALUES
  ('ทองรูปพรรณ', 'เครื่องประดับทองคำ'),
  ('ทองแท่ง', 'ทองคำแท่งมาตรฐาน'),
  ('เครื่องประดับ', 'เครื่องประดับและอัญมณี')
ON CONFLICT DO NOTHING;