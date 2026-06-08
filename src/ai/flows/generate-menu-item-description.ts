'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating luxurious and evocative Persian descriptions
 * for menu items based on provided keywords, assisting cafe administrators in enriching their menu content.
 *
 * - generateMenuItemDescription - A function that handles the menu item description generation process.
 * - GenerateMenuItemDescriptionInput - The input type for the generateMenuItemDescription function.
 * - GenerateMenuItemDescriptionOutput - The return type for the generateMenuItemDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMenuItemDescriptionInputSchema = z.object({
  itemName: z.string().describe('The name of the menu item.'),
  keywords: z
    .array(z.string())
    .describe('A list of keywords or characteristics of the menu item.'),
});
export type GenerateMenuItemDescriptionInput = z.infer<
  typeof GenerateMenuItemDescriptionInputSchema
>;

const GenerateMenuItemDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A luxurious and evocative Persian description for the menu item.'),
});
export type GenerateMenuItemDescriptionOutput = z.infer<
  typeof GenerateMenuItemDescriptionOutputSchema
>;

export async function generateMenuItemDescription(
  input: GenerateMenuItemDescriptionInput
): Promise<GenerateMenuItemDescriptionOutput> {
  return generateMenuItemDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMenuItemDescriptionPrompt',
  input: {schema: GenerateMenuItemDescriptionInputSchema},
  output: {schema: GenerateMenuItemDescriptionOutputSchema},
  prompt: `شما یک متخصص برجسته در زمینه نگارش منو برای یک کافه لوکس فارسی به نام "کافه دیدار" هستید.
وظیفه شما ایجاد یک توصیف لوکس و جذاب به زبان فارسی برای یک آیتم منو است که بر اساس نام و کلمات کلیدی داده شده باشد.
نام آیتم: {{{itemName}}}
کلمات کلیدی: {{{keywords.join(", ")}}}

یک توصیف خلاقانه و مسحورکننده در فارسی ارائه دهید که مشتریان خاص و مشکل‌پسند را جذب کند.
`,
});

const generateMenuItemDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMenuItemDescriptionFlow',
    inputSchema: GenerateMenuItemDescriptionInputSchema,
    outputSchema: GenerateMenuItemDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
