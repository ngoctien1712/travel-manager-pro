-- Seed admin user (run after schema.sql)
-- Default: admin@travel.vn / Admin123!

-- Get role ids
DO $$
DECLARE
  admin_role_id UUID;
  new_user_id UUID;
  password_hash TEXT := '$2a$10$YourBcryptHashHere'; -- Replace with actual bcrypt hash for 'Admin123!'
BEGIN
  SELECT id_role INTO admin_role_id FROM roles WHERE code = 'ADMIN' LIMIT 1;
  
  IF admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Role ADMIN not found. Run schema.sql first.';
  END IF;
  
  -- Check if admin already exists
  IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@travel.vn') THEN
    RAISE NOTICE 'Admin user already exists.';
    RETURN;
  END IF;
  
  -- Insert admin user (password: Admin123!)
  -- Generate hash with: node -e "console.log(require('bcryptjs').hashSync('Admin123!', 10))"
  INSERT INTO users (id_user, email, phone, full_name, password_hash, status, email_verified_at, created_at, updated_at)
  VALUES (
    uuid_generate_v4(),
    'admin@travel.vn',
    '0900000000',
    'Quản trị viên',
    '$2a$10$rQZ8K9xM5nL3jF2vB4dP1eY6wA7cH8gI9kJ0lM1nO2pQ3rS4tU5vW6xY7zA8bC', -- Replace with bcrypt hash
    'active',
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id_user INTO new_user_id;
  
  -- Assign ADMIN role
  INSERT INTO role_detail (id_role, id_user) VALUES (admin_role_id, new_user_id);
  
  -- Create admin profile
  INSERT INTO admin_profile (id_user, department) VALUES (new_user_id, 'Quản trị hệ thống');
  
  RAISE NOTICE 'Admin user created: admin@travel.vn';
END $$;
