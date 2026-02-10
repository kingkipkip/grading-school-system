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

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
    }
}))
