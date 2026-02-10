
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkCourse() {
    const { data, error } = await supabase
        .from('courses')
        .select('id, course_code, course_name, academic_year, semester_id')
        .eq('course_code', 'ค31102')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Course Data:', data)
    }
}

checkCourse()
