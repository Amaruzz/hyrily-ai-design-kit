
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type = 'feedback' } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const GEMINI_API_KEY = 'AIzaSyC1NSXdsZ1V12wZ1VBv4FfbAt0EmiPU3vM';
    
    let systemPrompt = '';
    
    switch (type) {
      case 'feedback':
        systemPrompt = `You are an expert interview coach. Analyze the following interview response and provide:
        1. A score from 1-5
        2. Specific feedback on strengths and areas for improvement
        3. Actionable suggestions for better responses
        
        Format your response as JSON: {
          "score": number,
          "feedback": "string",
          "suggestions": ["string1", "string2", "string3"]
        }`;
        break;
      case 'followup':
        systemPrompt = `You are an experienced interviewer. Based on the candidate's response, generate a thoughtful follow-up question that digs deeper into their experience or clarifies their answer. Keep it professional and relevant.`;
        break;
      case 'transcription':
        systemPrompt = `Convert the following audio description to clean, professional text suitable for an interview response.`;
        break;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser Input: ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response generated from Gemini');
    }

    console.log('Gemini response:', generatedText);

    // For feedback type, try to parse as JSON
    if (type === 'feedback') {
      try {
        const parsedFeedback = JSON.parse(generatedText);
        return new Response(JSON.stringify(parsedFeedback), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        // If JSON parsing fails, return a structured response anyway
        return new Response(JSON.stringify({
          score: 3.5,
          feedback: generatedText,
          suggestions: ["Practice with more specific examples", "Structure your response using the STAR method"]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
