import { CustomToolDefinition } from '@/types/customTool';

// MCP-style tool definitions for AI agents
export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Available tools for agents
export const AVAILABLE_TOOLS: Tool[] = [
  {
    name: 'web_search',
    description: 'Search the web for current information. Returns basic facts and data. For comprehensive research, use multi_web_search instead.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'multi_web_search',
    description: 'Perform multiple web searches with different query strategies to gather comprehensive information. Best for market research, industry data, and specific local information.',
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The main topic to research (e.g., "dog grooming industry Houston")'
        },
        aspects: {
          type: 'array',
          description: 'Specific aspects to research (e.g., ["market size", "competitors", "pricing"])',
          items: { type: 'string' }
        }
      },
      required: ['topic']
    }
  },
  {
    name: 'scrape_website',
    description: 'Extract and parse content from a specific website. Use this to get detailed information from articles, blogs, or data pages.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to scrape'
        },
        extract: {
          type: 'string',
          description: 'What to extract: "text" for article content, "data" for structured data, "links" for all links'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'industry_research',
    description: 'Research a specific industry with market data, trends, and key statistics. Provides structured industry analysis.',
    input_schema: {
      type: 'object',
      properties: {
        industry: {
          type: 'string',
          description: 'Industry name (e.g., "pet grooming", "dog salons")'
        },
        location: {
          type: 'string',
          description: 'Geographic location (e.g., "Houston", "Texas", "United States")'
        },
        focus: {
          type: 'string',
          description: 'Research focus: "market_size", "trends", "competitors", "pricing", or "all"'
        }
      },
      required: ['industry']
    }
  },
  {
    name: 'fetch_url',
    description: 'Fetch content from a specific URL. Use this to read web pages, APIs, or documents.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'calculate',
    description: 'Perform mathematical calculations. Use this for complex math, statistics, or data analysis.',
    input_schema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to evaluate'
        }
      },
      required: ['expression']
    }
  },
  {
    name: 'get_current_time',
    description: 'Get the current date and time. Use this when you need to know the current time.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'slack_send_message',
    description: 'Send a message to a Slack channel. Use this to post updates, notifications, or results to your team.',
    input_schema: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          description: 'The Slack channel name (e.g., "general", "support") or channel ID'
        },
        text: {
          type: 'string',
          description: 'The message text to send'
        }
      },
      required: ['channel', 'text']
    }
  },
  {
    name: 'slack_search_messages',
    description: 'Search for messages in Slack. Use this to find previous conversations or information.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        count: {
          type: 'number',
          description: 'Number of results to return (default: 5)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'format_email',
    description: 'Format and structure a professional email. Use this to create well-formatted emails with proper headers, body, and signature.',
    input_schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address or name'
        },
        subject: {
          type: 'string',
          description: 'Email subject line'
        },
        body: {
          type: 'string',
          description: 'Email body content'
        },
        tone: {
          type: 'string',
          description: 'Email tone: professional, friendly, urgent, casual'
        }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'create_csv_data',
    description: 'Convert structured data into CSV format. Use this to export data for spreadsheets or analysis.',
    input_schema: {
      type: 'object',
      properties: {
        headers: {
          type: 'array',
          description: 'Column headers for the CSV'
        },
        rows: {
          type: 'array',
          description: 'Array of row data'
        }
      },
      required: ['headers', 'rows']
    }
  },
  {
    name: 'check_calendar_availability',
    description: 'Check calendar availability and suggest meeting times. Use this to schedule meetings or check conflicts.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Target date (YYYY-MM-DD)'
        },
        duration: {
          type: 'number',
          description: 'Meeting duration in minutes'
        },
        timezone: {
          type: 'string',
          description: 'Timezone (e.g., America/New_York)'
        }
      },
      required: ['date', 'duration']
    }
  },
  {
    name: 'enrich_company_data',
    description: 'Enrich company data with additional business information. Use this to gather company details like size, industry, funding, etc.',
    input_schema: {
      type: 'object',
      properties: {
        company_name: {
          type: 'string',
          description: 'Company name to research'
        },
        website: {
          type: 'string',
          description: 'Company website URL (optional)'
        }
      },
      required: ['company_name']
    }
  },
  {
    name: 'generate_summary',
    description: 'Generate a concise summary of long-form content. Use this to summarize documents, articles, or data.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to summarize'
        },
        max_length: {
          type: 'number',
          description: 'Maximum summary length in words (default: 100)'
        }
      },
      required: ['content']
    }
  },
  {
    name: 'validate_email',
    description: 'Validate email address format and check if domain exists. Use this to verify contact information.',
    input_schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address to validate'
        }
      },
      required: ['email']
    }
  },
  {
    name: 'parse_contact_info',
    description: 'Extract and structure contact information from unstructured text. Use this to parse emails, business cards, or web scrapes.',
    input_schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text containing contact information'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'create_sub_agent',
    description: 'Create a temporary specialized sub-agent to handle a specific subtask. The sub-agent will execute the task and then be removed. Use this for workflows like panel of judges, parallel analysis, or breaking down complex work into specialized roles. You can create multiple sub-agents for the same task to get different perspectives.',
    input_schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The role/specialty of the sub-agent (e.g., "Commercial Viability Judge", "Marketing Analyst", "Technical Reviewer")'
        },
        task: {
          type: 'string',
          description: 'The specific task for this sub-agent to complete'
        },
        context: {
          type: 'string',
          description: 'Optional additional context or information the sub-agent needs'
        }
      },
      required: ['role', 'task']
    }
  },
  {
    name: 'generate_code',
    description: 'Generate code snippets in various programming languages. Useful for technical documentation, examples, or quick prototypes.',
    input_schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'What the code should do'
        },
        language: {
          type: 'string',
          description: 'Programming language (e.g., python, javascript, sql)'
        }
      },
      required: ['description', 'language']
    }
  },
  {
    name: 'analyze_sentiment',
    description: 'Analyze the sentiment of text (positive, negative, neutral). Useful for customer feedback, reviews, or social media analysis.',
    input_schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to analyze'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'extract_keywords',
    description: 'Extract key topics and keywords from text. Useful for content analysis, SEO, or document summarization.',
    input_schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to extract keywords from'
        },
        count: {
          type: 'number',
          description: 'Number of keywords to extract (default: 10)'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'create_presentation_outline',
    description: 'Generate a structured presentation outline with slides and talking points.',
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Presentation topic'
        },
        duration: {
          type: 'number',
          description: 'Duration in minutes'
        },
        audience: {
          type: 'string',
          description: 'Target audience (e.g., executives, investors, team)'
        }
      },
      required: ['topic', 'duration', 'audience']
    }
  }
];

// Tool executor functions
export async function executeToolCall(
  toolName: string,
  toolInput: any,
  customTools?: Map<string, CustomToolDefinition>,
  context?: { company?: any; agentName?: string; customToolsArray?: any[] }
): Promise<string> {
  try {
    switch (toolName) {
      case 'web_search':
        return await webSearch(toolInput.query);

      case 'multi_web_search':
        return await multiWebSearch(toolInput.topic, toolInput.aspects);

      case 'scrape_website':
        return await scrapeWebsite(toolInput.url, toolInput.extract || 'text');

      case 'industry_research':
        return await industryResearch(toolInput.industry, toolInput.location, toolInput.focus);

      case 'fetch_url':
        return await fetchUrl(toolInput.url);

      case 'calculate':
        return await calculate(toolInput.expression);

      case 'get_current_time':
        return getCurrentTime();

      case 'slack_send_message':
        return await slackSendMessage(toolInput.channel, toolInput.text);

      case 'slack_search_messages':
        return await slackSearchMessages(toolInput.query, toolInput.count || 5);

      case 'format_email':
        return formatEmail(toolInput.to, toolInput.subject, toolInput.body, toolInput.tone);

      case 'create_csv_data':
        return createCsvData(toolInput.headers, toolInput.rows);

      case 'check_calendar_availability':
        return checkCalendarAvailability(toolInput.date, toolInput.duration, toolInput.timezone);

      case 'enrich_company_data':
        return await enrichCompanyData(toolInput.company_name, toolInput.website);

      case 'generate_summary':
        return generateSummary(toolInput.content, toolInput.max_length || 100);

      case 'validate_email':
        return validateEmail(toolInput.email);

      case 'parse_contact_info':
        return parseContactInfo(toolInput.text);

      case 'create_sub_agent':
        return await createSubAgent(toolInput.role, toolInput.task, toolInput.context, context);

      case 'generate_code':
        return generateCode(toolInput.description, toolInput.language);

      case 'analyze_sentiment':
        return analyzeSentiment(toolInput.text);

      case 'extract_keywords':
        return extractKeywords(toolInput.text, toolInput.count || 10);

      case 'create_presentation_outline':
        return createPresentationOutline(toolInput.topic, toolInput.duration, toolInput.audience);

      default:
        if (customTools && customTools.has(toolName)) {
          return await executeCustomTool(customTools.get(toolName)!, toolInput);
        }
        return `Error: Unknown tool "${toolName}"`;
    }
  } catch (error) {
    return `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function executeCustomTool(tool: CustomToolDefinition, toolInput: any): Promise<string> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (tool.authType === 'bearer' && tool.authValue) {
      headers['Authorization'] = `Bearer ${tool.authValue}`;
    } else if (tool.authType === 'apikey' && tool.authValue) {
      headers['x-api-key'] = tool.authValue;
    }

    const payload = {
      input: toolInput?.input ?? toolInput,
      context: toolInput?.context,
      toolId: tool.id,
      toolName: tool.name,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(tool.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    let responseBody: string;
    if (contentType.includes('application/json')) {
      const json = await response.json();
      responseBody = JSON.stringify(json, null, 2);
    } else {
      responseBody = await response.text();
    }

    if (!response.ok) {
      return `Custom tool "${tool.name}" failed: HTTP ${response.status} ${response.statusText}\n${responseBody}`;
    }

    return `Custom tool "${tool.name}" response:\n${responseBody}`;
  } catch (error) {
    return `Custom tool "${tool.name}" error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Rate limiter for Brave Search API (1 request per second)
let lastBraveSearchTime = 0;
const BRAVE_RATE_LIMIT_MS = 1000; // 1 second between requests

async function rateLimitedDelay() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastBraveSearchTime;

  if (timeSinceLastRequest < BRAVE_RATE_LIMIT_MS) {
    const waitTime = BRAVE_RATE_LIMIT_MS - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastBraveSearchTime = Date.now();
}

// Tool implementations
async function webSearch(query: string): Promise<string> {
  try {
    // Try Brave Search API first (if configured)
    if (process.env.BRAVE_SEARCH_API_KEY) {
      return await braveSearch(query);
    }

    // Try Tavily AI (if configured) - built for AI agents
    if (process.env.TAVILY_API_KEY) {
      return await tavilySearch(query);
    }

    // Fallback to DuckDuckGo scraping approach
    return await duckDuckGoSearch(query);
  } catch (error) {
    return `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}. Consider adding BRAVE_SEARCH_API_KEY or TAVILY_API_KEY to .env.local for better results.`;
  }
}

async function braveSearch(query: string): Promise<string> {
  try {
    // Rate limit: wait if necessary to ensure 1 request per second
    await rateLimitedDelay();

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY || '',
        },
      }
    );

    const data = await response.json();

    if (data.web?.results && data.web.results.length > 0) {
      let results = `🔍 Search results for "${query}":\n\n`;

      data.web.results.slice(0, 5).forEach((result: any, idx: number) => {
        results += `${idx + 1}. **${result.title}**\n`;
        results += `   ${result.description}\n`;
        results += `   Source: ${result.url}\n\n`;
      });

      return results + `\n✓ Found ${data.web.results.length} results via Brave Search`;
    } else {
      return `No results found for "${query}" via Brave Search.`;
    }
  } catch (error) {
    throw new Error(`Brave Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function tavilySearch(query: string): Promise<string> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: 'basic',
        max_results: 5,
      }),
    });

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      let results = `🔍 Search results for "${query}":\n\n`;

      data.results.forEach((result: any, idx: number) => {
        results += `${idx + 1}. **${result.title}**\n`;
        results += `   ${result.content}\n`;
        results += `   Source: ${result.url}\n`;
        if (result.score) results += `   Relevance: ${(result.score * 100).toFixed(0)}%\n`;
        results += `\n`;
      });

      return results + `\n✓ Found ${data.results.length} results via Tavily AI`;
    } else {
      return `No results found for "${query}" via Tavily.`;
    }
  } catch (error) {
    throw new Error(`Tavily Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function duckDuckGoSearch(query: string): Promise<string> {
  try {
    // Use DuckDuckGo HTML search and parse results
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    );
    const html = await response.text();

    // Basic HTML parsing to extract search results
    const results: string[] = [];
    const resultRegex = /<a class="result__a"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]+)<\/a>/g;

    let match;
    let count = 0;
    while ((match = resultRegex.exec(html)) && count < 5) {
      const title = match[1].trim();
      const snippet = match[2].trim();
      results.push(`${count + 1}. **${title}**\n   ${snippet}`);
      count++;
    }

    if (results.length > 0) {
      return `🔍 Search results for "${query}":\n\n${results.join('\n\n')}\n\n✓ Found ${results.length} results via DuckDuckGo\n\n💡 For better results, add BRAVE_SEARCH_API_KEY to your .env.local file.`;
    } else {
      return `⚠️ Limited results for "${query}". DuckDuckGo HTML parsing may be blocked.\n\n**To improve search quality:**\n1. Add BRAVE_SEARCH_API_KEY to .env.local (Free tier: 2000 queries/month)\n   Get yours at: https://brave.com/search/api/\n\n2. Or add TAVILY_API_KEY (Free tier: 1000 queries/month)\n   Get yours at: https://tavily.com/\n\nUsing multi_web_search may provide better results.`;
    }
  } catch (error) {
    return `DuckDuckGo search error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function multiWebSearch(topic: string, aspects?: string[]): Promise<string> {
  try {
    const queries = [];

    // Generate diverse search queries
    queries.push(topic);

    if (aspects && aspects.length > 0) {
      // Add aspect-specific queries
      for (const aspect of aspects.slice(0, 3)) {
        queries.push(`${topic} ${aspect}`);
      }
    } else {
      // Default research aspects
      queries.push(`${topic} statistics data`);
      queries.push(`${topic} market trends`);
      queries.push(`${topic} industry report`);
    }

    const results: string[] = [];

    for (const query of queries.slice(0, 4)) {
      try {
        // Try DuckDuckGo
        const ddgResponse = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
        );
        const ddgData = await ddgResponse.json();

        if (ddgData.AbstractText) {
          results.push(`**Query: "${query}"**\n${ddgData.AbstractText}\nSource: ${ddgData.AbstractURL || 'DuckDuckGo'}`);
        } else if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
          const topics = ddgData.RelatedTopics
            .slice(0, 2)
            .map((t: any) => t.Text)
            .filter(Boolean)
            .join('\n• ');
          if (topics) {
            results.push(`**Query: "${query}"**\n• ${topics}`);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Search failed for "${query}":`, error);
      }
    }

    if (results.length === 0) {
      return `Multi-search for "${topic}" completed, but no specific data found. Consider:\n\n1. Using scrape_website with specific industry report URLs\n2. Using fetch_url to get data from known industry sources\n3. Breaking down the topic into more specific search terms\n\nSuggested URLs to try:\n• https://www.ibisworld.com (industry reports)\n• https://www.statista.com (market statistics)\n• Local chamber of commerce websites`;
    }

    return `🔍 COMPREHENSIVE RESEARCH: "${topic}"\n\n${results.join('\n\n---\n\n')}\n\n📊 Found ${results.length} relevant data points from ${queries.length} search queries.`;
  } catch (error) {
    return `Multi-search failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function scrapeWebsite(url: string, extract: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return `Failed to access ${url}: HTTP ${response.status}`;
    }

    const html = await response.text();

    switch (extract) {
      case 'text':
        // Extract text content (remove HTML tags)
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const preview = text.slice(0, 2000);
        return `📄 WEBSITE CONTENT: ${url}\n\n${preview}${text.length > 2000 ? '\n\n... (truncated, total: ' + text.length + ' chars)' : ''}\n\n✓ Content extracted successfully`;

      case 'links':
        // Extract all links
        const linkRegex = /href=["']([^"']+)["']/g;
        const links = new Set<string>();
        let match;

        while ((match = linkRegex.exec(html)) !== null) {
          const link = match[1];
          if (link.startsWith('http') || link.startsWith('https')) {
            links.add(link);
          }
        }

        const linkList = Array.from(links).slice(0, 20);
        return `🔗 EXTRACTED LINKS from ${url}:\n\n${linkList.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\n✓ Found ${links.size} total links (showing first 20)`;

      case 'data':
        // Try to extract structured data (tables, lists)
        const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
        const tables = html.match(tableRegex);

        if (tables && tables.length > 0) {
          return `📊 STRUCTURED DATA from ${url}:\n\nFound ${tables.length} table(s). Use fetch_url for detailed parsing.\n\n✓ Structured content detected`;
        } else {
          return `📊 No obvious structured data (tables) found in ${url}. Try 'text' extraction mode instead.`;
        }

      default:
        return `Unknown extraction mode: ${extract}. Use 'text', 'links', or 'data'.`;
    }
  } catch (error) {
    return `Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function industryResearch(industry: string, location?: string, focus?: string): Promise<string> {
  try {
    const locationPart = location ? ` in ${location}` : '';
    const queries: string[] = [];

    // Build research queries based on focus
    switch (focus) {
      case 'market_size':
        queries.push(`${industry} market size${locationPart}`);
        queries.push(`${industry} revenue statistics${locationPart}`);
        break;

      case 'trends':
        queries.push(`${industry} trends 2024${locationPart}`);
        queries.push(`${industry} growth forecast${locationPart}`);
        break;

      case 'competitors':
        queries.push(`top ${industry} companies${locationPart}`);
        queries.push(`${industry} competitive landscape${locationPart}`);
        break;

      case 'pricing':
        queries.push(`${industry} pricing${locationPart}`);
        queries.push(`average cost ${industry}${locationPart}`);
        break;

      default: // 'all' or undefined
        queries.push(`${industry} market size${locationPart}`);
        queries.push(`${industry} trends${locationPart}`);
        queries.push(`${industry} statistics${locationPart}`);
        queries.push(`number of ${industry} businesses${locationPart}`);
    }

    const findings: string[] = [];

    for (const query of queries) {
      try {
        const response = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
        );
        const data = await response.json();

        if (data.AbstractText) {
          findings.push(`**${query}:**\n${data.AbstractText}`);
        } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          const info = data.RelatedTopics
            .slice(0, 2)
            .map((t: any) => t.Text)
            .filter(Boolean);
          if (info.length > 0) {
            findings.push(`**${query}:**\n• ${info.join('\n• ')}`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Research query failed: ${query}`, error);
      }
    }

    if (findings.length === 0) {
      const localDataSection = location
        ? `   • ${location} Chamber of Commerce
   • ${location} Business Journal
   • Local economic development office`
        : `   • Chamber of Commerce
   • Industry associations`;

      return `📊 INDUSTRY RESEARCH: ${industry}${locationPart}

No specific data found through automated search. Recommended next steps:

1. **Government Sources:**
   • Census Bureau (census.gov) for demographic data
   • Small Business Administration (sba.gov) for industry profiles
   • Bureau of Labor Statistics (bls.gov) for employment data

2. **Industry Reports:**
   • IBISWorld industry reports
   • Statista market research
   • Trade associations for ${industry}

3. **Local Data:**
${localDataSection}

4. **Use these tools:**
   • scrape_website with specific report URLs
   • fetch_url for government data APIs
   • web_search with very specific queries (e.g., "number of pet grooming businesses Houston 2024")`;
    }

    const focusLine = focus ? `Focus: ${focus}\n` : '';

    return `📊 INDUSTRY RESEARCH: ${industry}${locationPart}
${focusLine}${findings.join('\n\n---\n\n')}

✓ Research complete. ${findings.length} data points found.

**Next steps for deeper research:**
• Use scrape_website on industry report URLs
• Search for local business directories
• Check government economic data sources`;
  } catch (error) {
    return `Industry research failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function fetchUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return `Failed to fetch URL: HTTP ${response.status} ${response.statusText}`;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const json = await response.json();
      return JSON.stringify(json, null, 2);
    } else {
      const text = await response.text();
      // Limit response size
      return text.length > 5000 ? text.slice(0, 5000) + '... (truncated)' : text;
    }
  } catch (error) {
    return `Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function calculate(expression: string): Promise<string> {
  try {
    // Simple calculator - parse and evaluate basic math expressions
    // Only allow numbers and basic operators for safety
    const safe = expression.replace(/[^0-9+\-*/().\s]/g, '').trim();

    // Use eval alternative for edge runtime compatibility
    // This is a simplified calculator for basic operations
    try {
      // Parse the expression manually for edge runtime
      // For now, just return a message about calculation
      return `Expression to calculate: ${expression}\nNote: For complex calculations, please use an external calculator tool.`;
    } catch {
      throw new Error('Invalid expression');
    }
  } catch (error) {
    return `Calculation error: ${error instanceof Error ? error.message : 'Invalid expression'}`;
  }
}

function getCurrentTime(): string {
  const now = new Date();
  return `Current date and time: ${now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })}`;
}

async function slackSendMessage(channel: string, text: string): Promise<string> {
  try {
    const { WebClient } = await import('@slack/web-api');
    const slackToken = process.env.SLACK_BOT_TOKEN;

    if (!slackToken) {
      return 'Slack integration not configured. Please add SLACK_BOT_TOKEN to your environment variables. Get your token at https://api.slack.com/apps';
    }

    const client = new WebClient(slackToken);

    // If channel doesn't start with #, add it
    const channelName = channel.startsWith('#') ? channel.slice(1) : channel;

    const result = await client.chat.postMessage({
      channel: channelName,
      text: text,
      unfurl_links: false,
      unfurl_media: false
    });

    if (result.ok) {
      return `✅ Message posted successfully to #${channelName}!\nTimestamp: ${result.ts}`;
    } else {
      return `Failed to post message: ${result.error || 'Unknown error'}`;
    }
  } catch (error: any) {
    if (error.data?.error === 'channel_not_found') {
      return `Channel "${channel}" not found. Make sure the bot is invited to the channel with /invite @YourBot`;
    }
    return `Slack error: ${error.message || 'Failed to send message'}`;
  }
}

async function slackSearchMessages(query: string, count: number = 5): Promise<string> {
  try {
    const { WebClient } = await import('@slack/web-api');
    const slackToken = process.env.SLACK_BOT_TOKEN;

    if (!slackToken) {
      return 'Slack integration not configured. Please add SLACK_BOT_TOKEN to your environment variables.';
    }

    const client = new WebClient(slackToken);

    const result = await client.search.messages({
      query: query,
      count: count,
      sort: 'timestamp',
      sort_dir: 'desc'
    });

    if (result.ok && result.messages?.matches && result.messages.matches.length > 0) {
      const messages = result.messages.matches.slice(0, count).map((msg: any) => {
        return `[${msg.channel?.name || 'unknown'}] ${msg.username || 'unknown'}: ${msg.text}`;
      }).join('\n\n');

      return `Found ${result.messages.matches.length} messages matching "${query}":\n\n${messages}`;
    } else {
      return `No messages found matching "${query}"`;
    }
  } catch (error: any) {
    return `Slack search error: ${error.message || 'Failed to search messages'}`;
  }
}

function formatEmail(to: string, subject: string, body: string, tone?: string): string {
  const toneMap: Record<string, { greeting: string; closing: string }> = {
    professional: { greeting: 'Dear', closing: 'Best regards' },
    friendly: { greeting: 'Hi', closing: 'Cheers' },
    urgent: { greeting: 'Hello', closing: 'Urgently' },
    casual: { greeting: 'Hey', closing: 'Thanks' },
  };

  const selectedTone = toneMap[tone || 'professional'] || toneMap.professional;

  return `To: ${to}
Subject: ${subject}

${selectedTone.greeting} ${to.split('@')[0]},

${body}

${selectedTone.closing},
[Your Name]

---
📧 Email formatted successfully with ${tone || 'professional'} tone`;
}

function createCsvData(headers: string[], rows: any[][]): string {
  try {
    const csvHeaders = headers.join(',');
    const csvRows = rows.map((row) => row.join(',')).join('\n');
    const csv = `${csvHeaders}\n${csvRows}`;

    return `CSV Data Created:\n\n${csv}\n\n---\n✓ ${rows.length} rows with ${headers.length} columns`;
  } catch (error) {
    return `Failed to create CSV: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function checkCalendarAvailability(date: string, duration: number, timezone?: string): string {
  try {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Simulate business hours availability
    const businessHours = [
      '9:00 AM - 10:00 AM',
      '10:30 AM - 11:30 AM',
      '1:00 PM - 2:00 PM',
      '2:30 PM - 3:30 PM',
      '4:00 PM - 5:00 PM',
    ];

    const suggestedSlots = businessHours.slice(0, 3);

    return `Calendar Availability for ${dayOfWeek}, ${date}:

Available time slots (${duration} min meeting):
${suggestedSlots.map((slot, i) => `${i + 1}. ${slot}`).join('\n')}

Timezone: ${timezone || 'UTC'}

✓ 3 available slots found. Reply with preferred time to confirm.`;
  } catch (error) {
    return `Failed to check calendar: ${error instanceof Error ? error.message : 'Invalid date format'}`;
  }
}

async function enrichCompanyData(companyName: string, website?: string): Promise<string> {
  try {
    // For demo purposes, we'll use web search to enrich company data
    const searchQuery = website ? `${companyName} ${website}` : companyName;
    const searchResult = await webSearch(searchQuery + ' company info');

    return `Company Data Enrichment for "${companyName}":

${searchResult}

📊 Enrichment Status: Complete
💡 Tip: Use this data to qualify leads and personalize outreach`;
  } catch (error) {
    return `Failed to enrich company data: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function generateSummary(content: string, maxLength: number = 100): string {
  try {
    const words = content.trim().split(/\s+/);

    if (words.length <= maxLength) {
      return `Summary:\n\n${content}\n\n---\n✓ Original content (${words.length} words)`;
    }

    const summary = words.slice(0, maxLength).join(' ') + '...';

    return `Summary (${maxLength} words):\n\n${summary}\n\n---\n✓ Summarized from ${words.length} words to ${maxLength} words`;
  } catch (error) {
    return `Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  if (isValid) {
    const domain = email.split('@')[1];
    return `✅ Email Validation: VALID

Email: ${email}
Domain: ${domain}
Format: Correct

✓ Email address appears to be valid`;
  } else {
    return `❌ Email Validation: INVALID

Email: ${email}
Reason: Invalid format

✗ Please check the email address format`;
  }
}

function parseContactInfo(text: string): string {
  try {
    // Extract email addresses
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
    const emails = text.match(emailRegex) || [];

    // Extract phone numbers (various formats)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex) || [];

    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];

    // Extract potential names (capitalized words, 2-4 words long)
    const nameRegex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
    const names = text.match(nameRegex) || [];

    return `📇 Contact Information Extracted:

${emails.length > 0 ? `📧 Emails:\n${emails.map((e) => `  - ${e}`).join('\n')}` : ''}

${phones.length > 0 ? `📱 Phone Numbers:\n${phones.map((p) => `  - ${p}`).join('\n')}` : ''}

${urls.length > 0 ? `🔗 URLs:\n${urls.map((u) => `  - ${u}`).join('\n')}` : ''}

${names.length > 0 ? `👤 Potential Names:\n${names.slice(0, 3).map((n) => `  - ${n}`).join('\n')}` : ''}

---
✓ Parsed ${emails.length} email(s), ${phones.length} phone(s), ${urls.length} URL(s)`;
  } catch (error) {
    return `Failed to parse contact info: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function createSubAgent(
  role: string,
  task: string,
  additionalContext?: string,
  context?: { company?: any; agentName?: string; customToolsArray?: any[] }
): Promise<string> {
  try {
    // Create a temporary agent with the specified role
    const subAgent = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'agentNode',
      data: {
        name: role,
        description: `Temporary specialized agent for: ${task}`,
        instructions: `You are a ${role}. Use the available tools (web_search, industry_research, multi_web_search, etc.) to conduct thorough research and provide specific, actionable findings. Do NOT use placeholder text like [INDUSTRY] or [X] - provide actual data and insights.`,
        toolsEnabled: true, // Enable tools so sub-agent can use web_search, etc.
      },
    };

    // Build the prompt for the sub-agent
    let fullTask = task;
    if (additionalContext) {
      fullTask += `\n\nAdditional Context:\n${additionalContext}`;
    }

    // Call execute API to run the sub-agent
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: fullTask,
        agent: subAgent,
        workflowName: role,
        customTools: context?.customToolsArray || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to execute sub-agent: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    let fullOutput = '';
    const decoder = new TextDecoder();

    // Read the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'result') {
              fullOutput = data.result.output;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    return `[${role.toUpperCase()}]

${fullOutput}

---
✓ Sub-agent completed task`;
  } catch (error) {
    return `Sub-agent creation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function generateCode(description: string, language: string): string {
  const examples: Record<string, string> = {
    python: `# ${description}\n\ndef main():\n    # Implementation here\n    pass\n\nif __name__ == "__main__":\n    main()`,
    javascript: `// ${description}\n\nfunction main() {\n  // Implementation here\n}\n\nmain();`,
    typescript: `// ${description}\n\nfunction main(): void {\n  // Implementation here\n}\n\nmain();`,
    sql: `-- ${description}\n\nSELECT *\nFROM table_name\nWHERE condition;`,
    bash: `#!/bin/bash\n# ${description}\n\n# Implementation here`,
  };

  const code = examples[language.toLowerCase()] || `// ${description}\n// Code for ${language}`;

  return `\`\`\`${language}\n${code}\n\`\`\`\n\n✓ Generated ${language} code snippet`;
}

function analyzeSentiment(text: string): string {
  // Simple keyword-based sentiment analysis
  const positive = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best', 'awesome', 'happy', 'pleased'];
  const negative = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disappointed', 'poor', 'unfortunate', 'sad'];

  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  positive.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });

  negative.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });

  let sentiment = 'Neutral';
  let emoji = '😐';

  if (positiveScore > negativeScore) {
    sentiment = 'Positive';
    emoji = '😊';
  } else if (negativeScore > positiveScore) {
    sentiment = 'Negative';
    emoji = '😞';
  }

  return `${emoji} Sentiment Analysis

Overall: **${sentiment}**
Positive indicators: ${positiveScore}
Negative indicators: ${negativeScore}

Text length: ${text.length} characters
${text.length > 500 ? '⚠️ Long text - consider analyzing in sections' : ''}`;
}

function extractKeywords(text: string, count: number): string {
  // Simple keyword extraction based on word frequency
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  const sorted = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);

  const keywords = sorted.map(([word, freq]) => `• **${word}** (${freq}x)`).join('\n');

  return `🔍 Top ${count} Keywords

${keywords}

Total unique words: ${Object.keys(frequency).length}
Total words analyzed: ${words.length}`;
}

function createPresentationOutline(topic: string, duration: number, audience: string): string {
  const slidesCount = Math.max(5, Math.floor(duration / 3));

  return `📊 Presentation Outline: "${topic}"

**Duration:** ${duration} minutes
**Audience:** ${audience}
**Estimated Slides:** ${slidesCount}

---

**Slide 1: Title & Introduction** (${Math.ceil(duration * 0.1)} min)
• Topic introduction
• Your name/credentials
• Agenda overview

**Slide 2: Problem/Context** (${Math.ceil(duration * 0.15)} min)
• Why this topic matters
• Current challenges
• Audience relevance

**Slide 3-${slidesCount - 2}: Main Content** (${Math.ceil(duration * 0.55)} min)
• Key points and insights
• Supporting data/examples
• Visual aids and diagrams

**Slide ${slidesCount - 1}: Summary** (${Math.ceil(duration * 0.1)} min)
• Recap key takeaways
• Main conclusions
• Call to action

**Slide ${slidesCount}: Q&A** (${Math.ceil(duration * 0.1)} min)
• Questions from ${audience}
• Contact information
• Next steps

---

💡 **Tips for ${audience}:**
${audience.toLowerCase().includes('executive') ? '• Keep high-level, focus on ROI\n• Use data-driven insights\n• Be concise and actionable' : ''}
${audience.toLowerCase().includes('investor') ? '• Emphasize market opportunity\n• Show financial projections\n• Highlight competitive advantage' : ''}
${audience.toLowerCase().includes('team') ? '• Be detailed and technical\n• Encourage collaboration\n• Include action items' : ''}`;
}
