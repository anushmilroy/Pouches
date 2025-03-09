import OpenAI from "openai";
import { ReferralService } from "./referral-service";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI API key');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Add retry logic
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithDelay(fn, retries - 1, delay * 2);
  }
}

export class ReferralGuideService {
  static async generatePersonalizedGuide(userId: number): Promise<{
    insights: string;
    recommendations: string[];
    potentialEarnings: number;
  }> {
    try {
      // Get user's referral stats
      const stats = await ReferralService.getReferralStats(userId);

      const prompt = `
        Analyze this referral performance data and provide personalized recommendations:

        Current Performance:
        - Total Referrals: ${stats.totalReferrals}
        - Total Earnings: $${stats.totalEarnings}
        - Recent Referrals: ${stats.referrals?.length || 0} in the last 30 days

        Please provide:
        1. A brief analysis of current performance
        2. 3-5 actionable recommendations for improvement
        3. Potential monthly earnings if recommendations are followed

        Format the response as a JSON object with 'insights', 'recommendations' (array), and 'potentialEarnings' (number) fields.
      `;

      try {
        // Use retry logic for OpenAI call
        const response = await retryWithDelay(async () => {
          return await openai.chat.completions.create({
            model: "gpt-4o", // Note: the newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages: [
              {
                role: "system",
                content: "You are an expert referral strategy advisor specializing in wholesale and retail business growth."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" }
          });
        });

        if (!response.choices[0].message.content) {
          throw new Error("Empty response from OpenAI");
        }

        const result = JSON.parse(response.choices[0].message.content);

        // Validate the response format
        if (!result.insights || !Array.isArray(result.recommendations) || typeof result.potentialEarnings !== 'number') {
          throw new Error("Invalid response format from OpenAI");
        }

        return {
          insights: result.insights,
          recommendations: result.recommendations,
          potentialEarnings: result.potentialEarnings
        };
      } catch (error) {
        if (error instanceof Error) {
          // Check for rate limit errors
          if (error.message.includes('429') || error.message.includes('quota')) {
            throw new Error("Service is temporarily unavailable. Please try again in a few minutes.");
          }
          // Handle other OpenAI specific errors
          if (error.message.includes('OpenAI')) {
            throw new Error("Unable to generate recommendations at this time. Please try again later.");
          }
        }
        throw error;
      }
    } catch (error) {
      console.error("Error generating referral guide:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate referral strategy guide");
    }
  }
}