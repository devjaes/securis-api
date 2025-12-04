-- Migration: Create admin user
-- Created: 2024-11-30
-- Description: Inserta el usuario administrador inicial

INSERT INTO users (id, email, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'pvillacres6317@uta.edu.ec',
  'Pablo Villacres',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;


