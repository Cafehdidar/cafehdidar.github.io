'use server';
/**
 * @fileOverview A Genkit flow for summarizing customer feedback for the Cafe Didar application.
 *
 * - summarizeCustomerFeedback - A function that processes an array of customer feedback entries
 *   and generates a summary highlighting common themes and overall sentiment.
 * - SummarizeCustomerFeedbackInput - The input type for the summarizeCustomerFeedback function.
 * - SummarizeCustomerFeedbackOutput - The return type for the summarizeCustomerFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeCustomerFeedbackInputSchema = z.object({
  feedback: z.array(
    z.object({
      comment: z.string().describe('The customer feedback comment.'),
      rating: z.number().int().min(1).max(5).describe('The star rating given by the customer.'),
      timestamp: z.string().describe('The timestamp of when the feedback was submitted (e.g., "YYYY-MM-DD HH:MM:SS").'),
    })
  ).describe('An array of customer feedback entries to be summarized.'),
});
export type SummarizeCustomerFeedbackInput = z.infer<typeof SummarizeCustomerFeedbackInputSchema>;

const SummarizeCustomerFeedbackOutputSchema = z.object({
  overallSentiment: z.string().describe('The overall sentiment of the feedback (e.g., "very positive", "mixed", "negative").'),
  commonThemes: z.array(z.string()).describe('A list of common themes or topics identified in the feedback.'),
  summary: z.string().describe('A concise summary of all customer feedback, highlighting key insights and areas for improvement.'),
});
export type SummarizeCustomerFeedbackOutput = z.infer<typeof SummarizeCustomerFeedbackOutputSchema>;

export async function summarizeCustomerFeedback(input: SummarizeCustomerFeedbackInput): Promise<SummarizeCustomerFeedbackOutput> {
  return summarizeCustomerFeedbackFlow(input);
}

const summarizeCustomerFeedbackPrompt = ai.definePrompt({
  name: 'summarizeCustomerFeedbackPrompt',
  input: { schema: SummarizeCustomerFeedbackInputSchema },
  output: { schema: SummarizeCustomerFeedbackOutputSchema },
  prompt: `You are an AI assistant tasked with summarizing customer feedback for a luxury Persian cafe called "کافه دیدار".
Your goal is to provide a concise overview of customer satisfaction, highlighting common themes and overall sentiment.
The feedback includes comments, star ratings (1-5), and submission timestamps.

Summarize the following customer feedback:

{{#each feedback}}
Feedback #{{@index}}:
Rating: {{this.rating}} stars
Timestamp: {{this.timestamp}}
Comment: {{this.comment}}
---
{{/each}}

Based on the feedback above, please provide:
1.  The overall sentiment (e.g., "very positive", "mixed", "negative").
2.  A list of 3-5 common themes or recurring topics.
3.  A concise summary highlighting key insights and areas for improvement.`,
});

const summarizeCustomerFeedbackFlow = ai.defineFlow(
  {
    name: 'summarizeCustomerFeedbackFlow',
    inputSchema: SummarizeCustomerFeedbackInputSchema,
    outputSchema: SummarizeCustomerFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeCustomerFeedbackPrompt(input);
    if (!output) {
      throw new Error('Failed to summarize customer feedback.');
    }
    return output;
  }
);
