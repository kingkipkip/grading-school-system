-- PROMOTE TO REGISTRAR 👑
-- Replace 'YOUR_EMAIL_HERE' with the email you registered with.

UPDATE public.users 
SET 
    role = 'registrar', 
    is_approved = true 
WHERE 
    email = 'ukrit.t@nsru.ac.th'; -- ใส่ Email ของคุณตรงนี้
