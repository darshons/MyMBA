import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const prompt = `You are an AI workflow designer. The user wants to create a department agent. Analyze their description and generate a comprehensive AI agent that can handle the full workflow.

User's request: "${description}"

Generate a JSON response with a single agent that handles ALL aspects of the workflow:
{
  "agent": {
    "name": "Agent Name",
    "instructions": "Comprehensive instructions for handling the ENTIRE workflow from start to finish. Be very detailed and specific about all steps the agent should take."
  }
}

Guidelines:
- Agent name should be PROFESSIONAL and department-focused (e.g., "Marketing", "Sales", "Customer Support", "Operations")
- DO NOT use creative or whimsical names - keep it strictly professional
- Use the department/function name as the agent name
- The agent should be capable of handling intake, processing, AND response
- Instructions should cover the complete workflow:
  1. How to receive and understand input
  2. What processing/analysis to perform
  3. How to format and deliver the final output
- Instructions should be specific, actionable, and thorough
- Think of this as a senior-level agent that owns the entire process

IMPORTANT: Return ONLY valid JSON. Ensure all strings are properly escaped. Use \\n for newlines within strings, not literal newlines. The JSON must be parseable by JSON.parse().`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

    // Extract JSON from response (in case Claude adds markdown formatting)
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let jsonString = jsonMatch ? jsonMatch[0] : responseText;

    let workflow;
    try {
      // Try to parse the JSON as-is first
      workflow = JSON.parse(jsonString);
    } catch (firstError) {
      // If parsing fails, try to fix common issues
      console.log('First parse attempt failed, attempting to fix JSON...');

      try {
        // Remove any trailing commas and fix common JSON issues
        let fixedJsonString = jsonString
          // Remove literal newlines/tabs/etc from JSON values
          .replace(/("(?:[^"\\]|\\.)*")|[\n\r\t]/g, (match, group1) => {
            if (group1) return group1; // Keep quoted strings as-is
            return ''; // Remove control chars outside strings
          })
          // Remove trailing commas before closing braces/brackets
          .replace(/,(\s*[}\]])/g, '$1');

        workflow = JSON.parse(fixedJsonString);
      } catch (secondError) {
        // Last resort: extract just the name and instructions with regex
        console.log('Second parse failed, extracting fields manually...');
        const nameMatch = jsonString.match(/"name"\s*:\s*"([^"]+)"/);
        const instructionsMatch = jsonString.match(/"instructions"\s*:\s*"((?:[^"\\]|\\.)*)"/);

        workflow = {
          agent: {
            name: nameMatch ? nameMatch[1] : 'New Agent',
            instructions: instructionsMatch ? instructionsMatch[1].replace(/\\n/g, '\n') : 'Handle assigned tasks professionally and efficiently.',
          },
        };
      }
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Generate workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to generate workflow' },
      { status: 500 }
    );
  }
}
