-- Enable RLS (just in case)
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to be safe
DROP POLICY IF EXISTS "Everyone can view academic years" ON academic_years;
DROP POLICY IF EXISTS "Registrars can manage academic years" ON academic_years;
DROP POLICY IF EXISTS "Everyone can view semesters" ON semesters;
DROP POLICY IF EXISTS "Registrars can manage semesters" ON semesters;

-- Academic Years Policies
CREATE POLICY "Everyone can view academic years" ON academic_years
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Registrars can manage academic years" ON academic_years
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM users WHERE role = 'registrar')
    );

-- Semesters Policies
CREATE POLICY "Everyone can view semesters" ON semesters
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Registrars can manage semesters" ON semesters
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM users WHERE role = 'registrar')
    );
