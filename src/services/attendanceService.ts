import { createClient } from '@/lib/supabase/client';

export const attendanceService = {
    createClient: () => createClient(),

    async markAttendance(sessionId: string, studentId: string) {
        const supabase = this.createClient();
        const { error } = await supabase
            .from('attendance')
            .insert({
                session_id: sessionId,
                student_id: studentId,
                verified_at: new Date().toISOString()
            });

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error("Attendance already marked for this session.");
            }
            throw error;
        }
    },

    async getSessionAttendance(sessionId: string) {
        const supabase = this.createClient();
        const { data } = await supabase
            .from('attendance')
            .select(`
        *,
        profiles:student_id (full_name)
      `)
            .eq('session_id', sessionId);

        if (!data) return [];

        return data.map(record => ({
            id: record.id,
            studentName: (record.profiles as any)?.full_name || 'Unknown',
            verifiedAt: record.verified_at
        }));
    }
};
