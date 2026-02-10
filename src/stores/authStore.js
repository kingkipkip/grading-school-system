import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
    user: null,
    profile: null,
    loading: true,

    initialize: async () => {
        set({ loading: true })

        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null

        let profile = null
        if (user) {
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()
            profile = data
        }

        set({ user, profile, loading: false })

        // Listen for changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            const user = session?.user ?? null
            let profile = null

            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                profile = data
            }

            set({ user, profile, loading: false })
        })
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        return data
    },

    signUp: async (email, password, fullName, role) => {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, role: role }
            }
        })
        if (authError) throw authError

        if (authData.user) {
            // 2. Create Public Profile
            const { error: profileError } = await supabase.from('users').insert([
                {
                    id: authData.user.id,
                    email: email,
                    full_name: fullName,
                    role: role,
                    // Teachers need approval (false), others (students) auto-approved (true)
                    is_approved: role !== 'teacher'
                }
            ])

            if (profileError) {
                // Optional: Rollback auth user creation if profile fails? 
                // For MVP, just throw error. User exists in Auth but not public table is a bad state, 
                // but we can handle it by checking "if user && !profile" then force profile creation on login.
                throw profileError
            }
        }

        return authData
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
    }
}))
