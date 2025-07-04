// lib/openrouter.ts

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const FREE_MODELS = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'microsoft/phi-3-medium-128k-instruct:free',
    'qwen/qwen-2-7b-instruct:free',
    'google/gemma-2-9b-it:free',

];

export async function analyzeMessageForRating(message: string): Promise<{
    suggestedRating: number;
    reasoning: string;
}> {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not found');
    }

    for (const model of FREE_MODELS) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin || 'http://localhost:5173',
                    'X-Title': 'Daily Log Analyzer'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an AI assistant that analyzes employee daily work logs and rates them based on actual work accomplished.

Rating Guidelines based on WORK COMPLETED:

5 STARS - Exceptional Work Output:
- Completed multiple significant tasks or exceeded daily targets
- Delivered concrete deliverables (features, reports, designs, etc.)
- Shows measurable progress with specific outcomes
- Includes quantifiable achievements (e.g., "completed 5 features", "resolved 10 tickets")

4 STARS - Good Work Output:
- Completed planned tasks for the day
- Clear progress on ongoing projects
- Specific work items mentioned with completion status
- Shows productive use of time with tangible results

3 STARS - Average Work Output:
- Some tasks completed but not all planned work
- Progress made but lacks specific details
- General statements about work without clear outcomes
- Minimal quantifiable achievements

2 STARS - Below Average Work Output:
- Little actual work completed
- Mostly planning, meetings, or non-productive activities
- Vague descriptions without concrete accomplishments
- Blocked progress with no alternative tasks completed

1 STAR - Poor Work Output:
- No clear work completed
- Only mentions being busy without specifics
- Excuses without any actual progress
- No tangible deliverables or achievements

Focus on ACTUAL WORK DONE, not just communication quality. Look for:
- Specific tasks completed
- Deliverables produced
- Problems solved
- Progress milestones reached
- Quantifiable achievements

Respond with ONLY a JSON object in this format:
{"rating": <number 1-5>, "reason": "<brief explanation focusing on work output>"}`
                        },
                        {
                            role: 'user',
                            content: `Analyze this employee's work log and rate based on actual work completed today: "${message}"`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                console.log(`Model ${model} failed, trying next...`);
                continue;
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.log(`Invalid response from ${model}, trying next...`);
                continue;
            }

            const content = data.choices[0].message.content.trim();
            console.log('AI Response from', model, ':', content);

            try {
                const parsed = JSON.parse(content);
                return {
                    suggestedRating: Math.max(1, Math.min(5, parsed.rating || 3)),
                    reasoning: parsed.reason || 'Work output analysis completed'
                };
            } catch (parseError) {
                // Fallback parsing if JSON parsing fails
                const ratingMatch = content.match(/["']?rating["']?\s*:\s*(\d)/i);
                const reasonMatch = content.match(/["']?reason["']?\s*:\s*["']([^"']+)["']/i);

                const rating = ratingMatch ? parseInt(ratingMatch[1]) : 3;
                const reason = reasonMatch ? reasonMatch[1] : 'Work output analysis completed';

                return {
                    suggestedRating: Math.max(1, Math.min(5, rating)),
                    reasoning: reason
                };
            }
        } catch (error) {
            console.log(`Error with model ${model}:`, error);
            continue;
        }
    }

    throw new Error('All free models failed. Please try again later.');
}