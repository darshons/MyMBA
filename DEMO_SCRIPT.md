# MyMBA - Hackathon Demo Script
## Technical Overview, Impact, and Next Steps (~1 minute)

---

## Technical Overview (35-40 seconds)

**[Start with confidence, clear technical details]**

> "From a technical standpoint, MyMBA is built on a sophisticated multi-agent architecture. The frontend uses React Flow for the visual canvas and Next.js 16 with TypeScript for the full-stack application."

> "On the backend, we're leveraging two Claude models strategically: Claude Haiku powers the department agents for fast, cost-effective task execution, while Claude Sonnet 4.5 runs the CEO assistant for more complex reasoning and tool orchestration."

> "The knowledge management system uses a custom RAG implementation with TF-IDF vector embeddings. When agents complete work, results automatically update the company.md knowledge base, which gets chunked, vectorized, and made searchable. The CEO assistant queries this using semantic search to answer questions about company progress."

> "We implemented a full tool calling loop that supports both built-in tools - like web search and industry research - and custom user-defined tools via a flexible API integration system. Execution streams in real-time using Server-Sent Events, giving immediate visual feedback on the canvas."

> "Everything persists to local storage, and the entire knowledge base is version-controlled and deployable, which we've hosted on Vercel."

---

## Impact (15-20 seconds)

**[Shift to business value, speak with conviction]**

> "The impact here is significant. Small businesses and solopreneurs spend countless hours on repetitive work - customer service, data analysis, report generation. MyMBA lets them build AI teams visually, without code, in minutes."

> "Instead of hiring multiple people or juggling ten different tools, they get a unified AI workforce that remembers context, learns from past work, and scales on demand. That's a genuine productivity multiplier for businesses that can't afford large teams."

---

## Next Steps (5-10 seconds)

**[Quick, concrete, actionable]**

> "Next steps: we want to add workflow templates for common business scenarios, implement agent-to-agent communication for complex multi-step tasks, and build a marketplace where users can share and sell their custom tools and workflows."

> "The foundation is solid - now we scale it."

---

## Alternative Version (More Technical Emphasis)

If you want to go even more technical, here's a variant with deeper technical details:

---

## Technical Overview - Deep Dive (40-45 seconds)

> "Architecturally, MyMBA is a real-time, multi-agent orchestration platform built on Next.js 16 with the App Router, React Flow for the node-based canvas, and Zustand for state management."

> "We use a dual-model strategy: Claude Haiku agents execute tasks with sub-second response times and low token costs, while the Claude Sonnet 4.5 CEO assistant handles complex queries with a 10-turn tool calling loop and access to the full company knowledge graph."

> "The RAG system is custom-built using TF-IDF vectorization. Documents are chunked by semantic boundaries - H1, H2, H3 headers - with metadata tagging for department and work type. Vector similarity search uses cosine distance with dynamic thresholds based on query type."

> "Tool integration follows the Model Context Protocol pattern. Custom tools are defined with JSON schemas, stored client-side, and executed server-side with proper sandboxing. The tool execution pipeline handles retries, error propagation, and result streaming."

> "Real-time updates use SSE with a ReadableStream encoder. The execution panel subscribes to events, updates node status atomically, and triggers knowledge base mutations that invalidate the vector cache for immediate search availability."

> "Everything's type-safe with TypeScript, deployed edge-first on Vercel, and the knowledge base resets per session while maintaining conversation history for context-aware responses."

---

## Impact (10-15 seconds)

> "This solves the 'AI integration paralysis' problem. Businesses want AI but don't know where to start. MyMBA gives them a visual, no-code way to build AI workflows that actually persist knowledge and improve over time."

> "It's democratizing business automation - you don't need a team of ML engineers anymore."

---

## Next Steps (5 seconds)

> "Next: workflow templates, inter-agent communication, and a tool marketplace. We're turning this into a platform."

---

## Delivery Tips for Demo Video

### Pacing:
- **Technical section**: Speak at ~150 words per minute (normal conversational pace)
- **Impact section**: Slow down slightly for emphasis on key benefits
- **Next steps**: Speed up slightly to convey energy and momentum

### Tone:
- **Technical**: Confident, knowledgeable, matter-of-fact
- **Impact**: Passionate, conviction-driven
- **Next steps**: Energized, forward-looking

### Body Language (if on camera):
- Use hand gestures to emphasize architecture points
- Point to screen when mentioning specific technical components
- Lean forward slightly during impact section (shows enthusiasm)

### Screen Timing:
- Show architecture diagram or code during technical section
- Show demo in action during impact section
- Show roadmap slide or future mockups during next steps

---

## One-Sentence Tagline

If you need a punchy opening or closing line:

> **"MyMBA turns Claude into your entire business operations team - no code required."**

---

## Technical Terms to Pronounce Clearly

- **RAG** - spell it out: "R-A-G" or say "retrieval augmented generation"
- **TF-IDF** - "T-F-I-D-F" or "term frequency inverse document frequency"
- **SSE** - "S-S-E" or "server-sent events"
- **Zustand** - "ZOO-shtand" (German pronunciation)
- **Anthropic** - "an-THROP-ic" (emphasis on THROP)

---

## Word Count Check

**Version 1** (Balanced):
- Technical Overview: ~160 words (35-40 sec)
- Impact: ~60 words (15-20 sec)
- Next Steps: ~35 words (5-10 sec)
- **Total: ~255 words = 60 seconds**

**Version 2** (More Technical):
- Technical Overview: ~180 words (40-45 sec)
- Impact: ~45 words (10-15 sec)
- Next Steps: ~20 words (5 sec)
- **Total: ~245 words = 60 seconds**

---

## Practice Run Checklist

Before recording:
- [ ] Read through 3 times for flow
- [ ] Time yourself - should hit 55-65 seconds
- [ ] Mark words where you'll pause for emphasis
- [ ] Ensure screen recordings sync with your narration
- [ ] Have water nearby (technical jargon can dry your mouth)
- [ ] Test audio levels - technical terms need clarity

---

## Common Demo Pitfalls to Avoid

❌ **Don't**: Rush through technical terms
✅ **Do**: Enunciate clearly, especially acronyms

❌ **Don't**: Apologize for limitations ("It's not perfect but...")
✅ **Do**: Frame current state as "foundation" for future

❌ **Don't**: Use filler words ("um", "like", "you know")
✅ **Do**: Pause briefly between sections instead

❌ **Don't**: Read monotonously from a script
✅ **Do**: Sound like you're explaining to a friend who's technical

---

Good luck with your demo! 🚀
