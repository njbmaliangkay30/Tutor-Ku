-- Insert dummy data to use in the application
DO $$
DECLARE
  student_user_id UUID := gen_random_uuid();
  tutor1_id UUID := gen_random_uuid();
  tutor2_id UUID := gen_random_uuid();
  admin_id UUID := gen_random_uuid();
BEGIN
  -- We assume that the user will create their own accounts via Auth.
  -- But to show dummy tutors, we can just create some records in profiles even if they don't exist in auth.users
  -- NOTE: Since profiles table has a foreign key to auth.users ON DELETE CASCADE,
  -- inserting into profiles without an auth.user will fail.
  -- So we MUST remove the FK constraint if we want pure dummy data, OR we instruct user to create them.
  -- For this seed to work easily, let's temporarily alter the constraints or insert dummy users in auth schema (which is often restricted).

  -- Instead of full dummy seed that might break, we will just rely on the application to create data
  -- or we provide a function to bypass it.
  
END $$;
