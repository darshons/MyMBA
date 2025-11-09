# AI Workflow Patterns Guide

## 1. Prompt Chaining
**When to use:** Tasks that can be easily decomposed into fixed subtasks. Trade latency for higher accuracy.

**Implementation:** Sequential execution where each step's output becomes the next step's input.

**Examples:**
- Generating Marketing copy, then translating it into a different language.
- Writing an outline of a document, checking that the outline meets certain criteria, then writing the document based on the outline.

---

## 2. Router Prompt
**When to use:** Complex tasks with distinct categories that need different handling.

**Implementation:** Classify the user input, follow different workflow steps based on classification.

**Examples:**
- Directing different types of customer service queries (general questions, refund requests, technical support) into different downstream processes, prompts, and tools.
- Routing easy/common questions to smaller models like Claude 3.5 Haiku and hard/unusual questions to more capable models like Claude Sonnet 4 to optimize cost and speed.

---

## 3. Panel of Judges
**When to use:** Quality control, compliance checking, or multi-criteria evaluation needed.

**Implementation:** One model generates inputs, and each item has to go through a filter of N other "judge" LLM prompts to enforce certain rules.

**Examples:**
- Content moderation with multiple safety checks
- Code review where multiple specialized agents check for different issues (security, performance, style)
- Legal document review with compliance, clarity, and accuracy judges

---

## 4. Delegation
**When to use:** When subtasks vary in complexity and you want to optimize cost/speed.

**Implementation:** A model like Sonnet can delegate a subtask to a fast model like Haiku to save tokens and accomplish the task much faster than Sonnet could on its own.

**Examples:**
- Complex analysis done by Sonnet, simple formatting by Haiku
- Research done by capable model, summarization by fast model
- Strategic planning by Sonnet, execution details by Haiku

---

## 5. Parallelization
**When to use:** Divided subtasks can be parallelized for speed, or multiple perspectives needed.

**Implementation:** Dispatch sub-agents in parallel to digest their input and return relevant data to the primary agent.

**Examples:**
- Guardrails where one model instance processes user queries while another screens them for inappropriate content
- Automating evals for evaluating LLM performance
- Multiple agents researching different aspects of a topic simultaneously
- Reviewing a piece of code for vulnerabilities with several different prompts

---

## 6. Debate
**When to use:** Complex decisions that benefit from multiple perspectives and critical analysis.

**Implementation:** Multiple agents with different personas engaging in synchronous discussion to reach a better decision.

**Examples:**
- Strategic business decisions with "optimist" and "pessimist" personas
- Product features debate between "user advocate" and "technical feasibility" personas
- Investment decisions with "bull" and "bear" perspectives

---

## 7. Specialization (Orchestrator-Workers)
**When to use:** Complex tasks where you can't predict subtasks needed, or when specialists excel at particular skills.

**Implementation:** A generalist orchestrator delegates tasks to specialist models that excel at particular skills.

**Examples:**
- Coding products that make complex changes to multiple files each time
- Search tasks that involve gathering and analyzing information from multiple sources
- Content creation with specialists for research, writing, editing, and SEO

---

## 8. Evaluator-Optimizer
**When to use:** When LLM responses can be demonstrably improved through feedback and iteration.

**Implementation:** Generate output, evaluate it, provide critiques, regenerate based on feedback. Iterate until quality threshold is met.

**Examples:**
- Literary translation where there are nuances that the translator LLM might not capture initially, but where an evaluator LLM can provide useful critiques
- Complex search tasks that require multiple rounds of searching and analysis to gather comprehensive information
- Creative writing with quality assessment and iterative refinement
