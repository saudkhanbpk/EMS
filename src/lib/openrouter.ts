// lib/openrouter.ts

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const FREE_MODELS = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemma-2-9b-it:free',
    'microsoft/phi-3-medium-128k-instruct:free',
    'qwen/qwen-2-7b-instruct:free'
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
                            content: 'You are an AI assistant that analyzes employee daily log messages and suggests appropriate star ratings from 1-5.\n\nRating Guidelines:\n- 5 stars: Exceptional update - detailed progress, proactive problem-solving, went above and beyond\n- 4 stars: Good update - clear progress made, good communication, met expectations\n- 3 stars: Average update - basic progress reported, adequate detail\n- 2 stars: Below average - minimal detail, unclear progress, needs improvement\n- 1 star: Poor update - very brief, no clear progress, concerning issues\n\nRespond with ONLY a JSON object in this format:\n{"rating": <number 1-5>, "reason": "<brief explanation in 1-2 sentences>"}'
                        },
                        {
                            role: 'user',
                            content: `Analyze this employee daily log update and suggest a star rating: "${message}"`
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
                    reasoning: parsed.reason || 'Analysis completed'
                };
            } catch (parseError) {
                const ratingMatch = content.match(/["']?rating["']?\s*:\s*(\d)/i);
                const rating = ratingMatch ? parseInt(ratingMatch[1]) : 3;

                return {
                    suggestedRating: Math.max(1, Math.min(5, rating)),
                    reasoning: 'Analysis completed with basic parsing'
                };
            }
        } catch (error) {
            console.log(`Error with model ${model}:`, error);
            continue;
        }
    }

    throw new Error('All free models failed. Please try again later.');
}