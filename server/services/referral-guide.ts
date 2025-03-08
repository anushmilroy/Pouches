import OpenAI from "openai";
import { ReferralService } from "./referral-service";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI API key');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ReferralGuideService {
  static async generatePersonalizedGuide(userId: number): Promise<{
    insights: string;
    recommendations: string[];
    potentialEarnings: number;
  }> {
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
      // Note: the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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

      const result = JSON.parse(response.choices[0].message.content);

      return {
        insights: result.insights,
        recommendations: result.recommendations,
        potentialEarnings: result.potentialEarnings
      };
    } catch (error) {
      console.error("Error generating referral guide:", error);
      throw new Error("Failed to generate referral strategy guide");
    }
  }
}
