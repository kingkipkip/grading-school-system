-- ========================================
-- GRADE CALCULATION VIEW
-- ========================================

DROP VIEW IF EXISTS v_student_assignment_summary;

CREATE VIEW v_student_assignment_summary AS
WITH 
-- 1. Get Course Configs (Total Score & Special Deductions)
course_stats AS (
    SELECT 
        c.id as course_id,
        c.assignment_total_score,
        -- Sum of max scores for all special assignments in this course
        COALESCE(SUM(a.max_score) FILTER (WHERE a.assignment_type = 'special'), 0) as total_special_max_score,
        -- Count of regular assignments
        COUNT(a.id) FILTER (WHERE a.assignment_type = 'regular') as total_regular_assignments
    FROM courses c
    LEFT JOIN assignments a ON c.id = a.course_id
    GROUP BY c.id
),

-- 2. Calculate "Regular Pool" and "Score Per Regular Assignment"
score_factors AS (
    SELECT 
        course_id,
        assignment_total_score,
        total_special_max_score,
        total_regular_assignments,
        -- Regular Pool = Total Assignment Score - Total Special Max Score
        (assignment_total_score - total_special_max_score) as regular_score_pool,
        -- Score per Regular Assignment (if count > 0)
        CASE 
            WHEN total_regular_assignments > 0 THEN 
                (assignment_total_score - total_special_max_score) / total_regular_assignments
            ELSE 0 
        END as score_per_regular_assignment
    FROM course_stats
),

-- 3. Calculate Student's Regular Assignment Performance
student_regular_stats AS (
    SELECT 
        ce.student_id,
        ce.course_id,
        -- Count submission statuses for regular assignments
        COUNT(sub.id) FILTER (WHERE sub.submission_status = 'submitted') as reg_submitted_count,
        COUNT(sub.id) FILTER (WHERE sub.submission_status = 'late') as reg_late_count,
        COUNT(sub.id) FILTER (WHERE sub.submission_status = 'missing' OR sub.submission_status IS NULL) as reg_missing_count
    FROM course_enrollments ce
    LEFT JOIN assignments a ON ce.course_id = a.course_id AND a.assignment_type = 'regular'
    LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ce.student_id
    GROUP BY ce.student_id, ce.course_id
),

-- 4. Calculate Student's Special Assignment Score
student_special_score AS (
    SELECT 
        ce.student_id,
        ce.course_id,
        -- Sum of actual scores obtained in special assignments
        COALESCE(SUM(sub.score), 0) as total_special_score_obtained
    FROM course_enrollments ce
    LEFT JOIN assignments a ON ce.course_id = a.course_id AND a.assignment_type = 'special'
    LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ce.student_id
    GROUP BY ce.student_id, ce.course_id
)

-- 5. Final Assembly
SELECT 
    ce.student_id,
    ce.course_id,
    s.student_id as student_code, -- The string ID (e.g. "6401001")
    s.first_name,
    s.last_name,
    
    -- Configs exposed for debugging
    sf.assignment_total_score,
    sf.total_special_max_score as deducted_for_special,
    sf.regular_score_pool,
    sf.score_per_regular_assignment,
    
    -- Regular Score Calculation
    -- (Submitted * PerScore) + (Late * PerScore * 0.8)
    CAST(
        (sr.reg_submitted_count * sf.score_per_regular_assignment) +
        (sr.reg_late_count * sf.score_per_regular_assignment * 0.8)
    AS DECIMAL(10,2)) as regular_score_obtained,
    
    -- Special Score Calculation
    CAST(ss.total_special_score_obtained AS DECIMAL(10,2)) as special_score_obtained,
    
    -- Final Total Score (Regular + Special)
    CAST(
        ((sr.reg_submitted_count * sf.score_per_regular_assignment) +
         (sr.reg_late_count * sf.score_per_regular_assignment * 0.8)) +
        ss.total_special_score_obtained
    AS DECIMAL(10,2)) as final_assignment_score

FROM course_enrollments ce
JOIN students s ON ce.student_id = s.id
JOIN score_factors sf ON ce.course_id = sf.course_id
LEFT JOIN student_regular_stats sr ON ce.student_id = sr.student_id AND ce.course_id = sr.course_id
LEFT JOIN student_special_score ss ON ce.student_id = ss.student_id AND ce.course_id = ss.course_id;
