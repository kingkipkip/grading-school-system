import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAcademicStore = create((set, get) => ({
    academicYears: [],
    loading: false,

    fetchAcademicYears: async () => {
        set({ loading: true })
        try {
            const { data, error } = await supabase
                .from('academic_years')
                .select(`
          *,
          semesters (*)
        `)
                .order('year_name', { ascending: false })

            if (error) throw error

            // Sort semesters within each year
            const sortedData = data?.map(year => ({
                ...year,
                semesters: year.semesters?.sort((a, b) => {
                    // Sort by semester_type: 1, 2, summer
                    const typeOrder = { '1': 1, '2': 2, 'summer': 3 }
                    return typeOrder[a.semester_type] - typeOrder[b.semester_type]
                })
            }))

            set({ academicYears: sortedData || [], loading: false })
        } catch (error) {
            console.error('Error fetching academic years:', error)
            set({ loading: false })
        }
    },

    createAcademicYear: async (yearData) => {
        try {
            const { data, error } = await supabase
                .from('academic_years')
                .insert([yearData])
                .select()
                .single()

            if (error) throw error

            // Refresh list
            await get().fetchAcademicYears()
            return { success: true }
        } catch (error) {
            console.error('Error creating academic year:', error)
            return { success: false, error }
        }
    },

    createSemester: async (semesterData) => {
        try {
            // If setting this as active, we might want to deactivate others? 
            // Database constraint/trigger might handle this, or we handle it here.
            // For now, let's just insert.

            const { data, error } = await supabase
                .from('semesters')
                .insert([semesterData])
                .select()
                .single()

            if (error) throw error

            await get().fetchAcademicYears()
            return { success: true }
        } catch (error) {
            console.error('Error creating semester:', error)
            return { success: false, error }
        }
    },

    toggleActiveSemester: async (semesterId) => {
        try {
            // 1. Deactivate all semesters
            await supabase.from('semesters').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000') // hack to update all? No, RLS/Policy might block bulk update if not careful.
            // Better: DB function or just loop? 
            // SQL: UPDATE semesters SET is_active = (id = semesterId);
            // Let's try two steps: Unset all, then Set one. 

            await supabase.from('semesters').update({ is_active: false }).neq('id', semesterId)

            // 2. Set target to true
            const { error } = await supabase
                .from('semesters')
                .update({ is_active: true })
                .eq('id', semesterId)

            if (error) throw error

            // Also update parent academic year to be active?
            // We probably should find the years and set proper active status too if needed.

            await get().fetchAcademicYears()
            return { success: true }
        } catch (error) {
            console.error('Error toggling active semester:', error)
            return { success: false, error }
        }
    },

    deleteAcademicYear: async (id) => {
        try {
            const { error } = await supabase.from('academic_years').delete().eq('id', id)
            if (error) throw error
            await get().fetchAcademicYears()
            return { success: true }
        } catch (error) {
            return { success: false, error }
        }
    },

    deleteSemester: async (id) => {
        try {
            const { error } = await supabase.from('semesters').delete().eq('id', id)
            if (error) throw error
            await get().fetchAcademicYears()
            return { success: true }
        } catch (error) {
            return { success: false, error }
        }
    }
}))
