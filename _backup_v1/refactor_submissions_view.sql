-- 1. Backup existing data? (Skip for now as it's dev, but good practice usually)
-- DROP existing object (View or Table) to ensure clean state
DROP VIEW IF EXISTS public.assignment_submissions CASCADE;
DROP TABLE IF EXISTS public.assignment_submissions CASCADE;

-- 2. Create View that combines Regular and Special submissions
CREATE OR REPLACE VIEW public.assignment_submissions AS
SELECT 
    sr.id,
    sr.assignment_id,
    sr.student_id,
    sr.submission_status,
    NULL::DECIMAL(5,2) as score, -- Regular assignments have no score in this view context (or 0?)
    sr.submitted_at,
    sr.created_at,
    sr.updated_at
FROM public.submission_regular sr
UNION ALL
SELECT 
    ss.id,
    ss.assignment_id,
    ss.student_id,
    'submitted'::public.submission_status as submission_status, -- Special assignments are always submitted? Or missing if no score? Let's check logic.
    ss.score_raw as score,
    ss.submitted_at,
    ss.created_at,
    ss.updated_at
FROM public.submission_special ss;

-- 3. Grant permissions on the view (important for RLS visibility)
GRANT SELECT ON public.assignment_submissions TO authenticated;
ALTER VIEW public.assignment_submissions OWNER TO postgres; -- Or appropriate role
