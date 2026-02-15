import { createClient } from '@/lib/supabase/client';

export const sessionService = {
    createClient: () => createClient(),

    async getActiveSession(teacherId: string) {
        const supabase = this.createClient();
        const { data: session } = await supabase
            .from('sessions')
            .select('*')
            .eq('teacher_id', teacherId)
            .eq('is_active', true)
            .single();

        return session;
    },

    async startSession(teacherId: string, subjectName: string) {
        const supabase = this.createClient();
        const { data, error } = await supabase
            .from('sessions')
            .insert({
                teacher_id: teacherId,
                subject: subjectName,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async endSession(sessionId: string) {
        const supabase = this.createClient();
        const { error } = await supabase
            .from('sessions')
            .update({
                is_active: false,
                end_time: new Date().toISOString()
            })
            .eq('id', sessionId);

        if (error) throw error;
    },

    async getActiveSessionsForStudent() {
        const supabase = this.createClient();
        const { data } = await supabase
            .from('sessions')
            .select('*')
            .eq('is_active', true);

        return data || [];
    }
};
