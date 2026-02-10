import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useCourseStore = create((set, get) => ({
  courses: [],
  currentCourse: null,
  loading: false,
  
  fetchCourses: async (semesterId) => {
    set({ loading: true })
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          semester:semesters(*),
          teacher:users!courses_teacher_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
      
      if (semesterId) {
        query = query.eq('semester_id', semesterId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      set({ courses: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching courses:', error)
      set({ loading: false })
    }
  },
  
  fetchCourseById: async (courseId) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          semester:semesters(*),
          teacher:users!courses_teacher_id_fkey(*),
          enrollments:course_enrollments(
            *,
            student:students(*)
          )
        `)
        .eq('id', courseId)
        .single()
      
      if (error) throw error
      set({ currentCourse: data, loading: false })
      return data
    } catch (error) {
      console.error('Error fetching course:', error)
      set({ loading: false })
    }
  },
  
  createCourse: async (courseData) => {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single()
    
    if (error) throw error
    
    set(state => ({ courses: [data, ...state.courses] }))
    return data
  },
  
  updateCourse: async (courseId, updates) => {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single()
    
    if (error) throw error
    
    set(state => ({
      courses: state.courses.map(c => c.id === courseId ? data : c),
      currentCourse: state.currentCourse?.id === courseId ? data : state.currentCourse
    }))
    
    return data
  },
  
  closeCourse: async (courseId) => {
    return get().updateCourse(courseId, { is_closed: true })
  }
}))
