'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a natural language summary
 * of daily classroom attendance for administrators.
 *
 * - adminDailyAttendanceSummary - A function that generates an attendance summary for a given day.
 * - AdminDailyAttendanceSummaryInput - The input type for the adminDailyAttendanceSummary function.
 * - AdminDailyAttendanceSummaryOutput - The return type for the adminDailyAttendanceSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const AdminDailyAttendanceSummaryInputSchema = z.object({
  date: z.string().describe('The date for which to generate the attendance summary in YYYY-MM-DD format.'),
  totalStudentsRegistered: z.number().describe('The total number of unique students registered across all subjects in the system.'),
  dailyAttendanceRecords: z.array(
    z.object({
      studentId: z.string().describe('The ID of the student.'),
      subject: z.string().describe('The subject the student attended.'),
      timestamp: z.string().describe('The timestamp of the attendance record (e.g., ISO string).'),
      latitude: z.number().describe('The latitude of the student\'s attendance.'),
      longitude: z.number().describe('The longitude of the student\'s attendance.'),
    })
  ).describe('An array of all attendance records for the given day.'),
  classroomCoordinates: z.object({
    latitude: z.number().describe('The latitude of the classroom.'),
    longitude: z.number().describe('The longitude of the classroom.'),
  }).describe('The geographical coordinates of the classroom.'),
});
export type AdminDailyAttendanceSummaryInput = z.infer<typeof AdminDailyAttendanceSummaryInputSchema>;

// Output Schema
const AdminDailyAttendanceSummaryOutputSchema = z.object({
  summary: z.string().describe('A natural language summary of the daily attendance performance, highlighting key metrics and potential issues.'),
});
export type AdminDailyAttendanceSummaryOutput = z.infer<typeof AdminDailyAttendanceSummaryOutputSchema>;

// Wrapper function
export async function adminDailyAttendanceSummary(
  input: AdminDailyAttendanceSummaryInput
): Promise<AdminDailyAttendanceSummaryOutput> {
  return adminDailyAttendanceSummaryFlow(input);
}

// Prompt Definition
const adminDailyAttendanceSummaryPrompt = ai.definePrompt({
  name: 'adminDailyAttendanceSummaryPrompt',
  input: {schema: AdminDailyAttendanceSummaryInputSchema},
  output: {schema: AdminDailyAttendanceSummaryOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing classroom attendance data. Your task is to generate a natural language summary of the attendance for a given day.\n\nYou are provided with the following data:\n- Date: {{{date}}}\n- Total unique students registered in the system: {{{totalStudentsRegistered}}}\n- Raw attendance records for the day: {{{json dailyAttendanceRecords}}}\n- Classroom coordinates for context: Latitude {{{classroomCoordinates.latitude}}}, Longitude {{{classroomCoordinates.longitude}}}\n\nBased on this data, please provide a concise summary that includes:\n1.  **Total Unique Students Present**: Count how many distinct students marked attendance.\n2.  **Overall Attendance Percentage**: Calculate this as (Total Unique Students Present / Total Unique Students Registered) * 100. If 'Total Unique Students Registered' is 0, consider the percentage 0 or not applicable.\n3.  **Subjects with Unusually Low Turnout**: Identify any subjects where the number of unique students present is significantly lower compared to other subjects or a very low absolute number (e.g., fewer than 3 unique students for a subject). List these subjects and the number of unique students who attended them.\n4.  Highlight any other notable trends or observations from the attendance records.\n\nPresent the summary in a professional, easy-to-read natural language format.\n`
});

// Flow Definition
const adminDailyAttendanceSummaryFlow = ai.defineFlow(
  {
    name: 'adminDailyAttendanceSummaryFlow',
    inputSchema: AdminDailyAttendanceSummaryInputSchema,
    outputSchema: AdminDailyAttendanceSummaryOutputSchema,
  },
  async (input) => {
    const {output} = await adminDailyAttendanceSummaryPrompt(input);
    if (!output) {
      throw new Error('Failed to generate attendance summary.');
    }
    return output;
  }
);
