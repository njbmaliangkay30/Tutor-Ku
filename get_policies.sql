SELECT pol.policyname, pol.permissive, pol.roles, pol.cmd, pol.qual, pol.with_check 
FROM pg_policy pol 
JOIN pg_class tbl ON pol.polrelid = tbl.oid 
WHERE tbl.relname = 'messages';
