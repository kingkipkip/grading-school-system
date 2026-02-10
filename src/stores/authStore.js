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
                .maybeSingle()
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
                    .maybeSingle()
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
                    // Always false (Pending) for now as we only allow teacher registration
                    is_approved: false
                }
            ])

            if (profileError) {
                // Handle duplicate key (user already exists in public table)
                if (profileError.code === '23505') {
                    throw new Error('อีเมลนี้ถูกลงทะเบียนไว้แล้ว โปรดเข้าสู่ระบบหรือใช้อีเมลอื่น')
                }
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
