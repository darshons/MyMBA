# AgentFlow - Visual AI Workflow Builder

![AgentFlow](https://img.shields.io/badge/Built%20with-Claude%20AI-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

**AgentFlow** is a visual platform that makes multi-agent AI orchestration accessible to everyone. Design agent workflows using an intuitive org-chart interface—no coding required.

## 🎯 Problem Statement

Companies struggle to coordinate multiple AI agents for complex workflows. Traditional solutions require:
- Complex code and technical expertise
- Manual orchestration between agents
- Difficult-to-visualize agent hierarchies
- Time-consuming setup and iteration

## 💡 Our Solution

AgentFlow provides a visual, drag-and-drop interface where users can:
- **Create agents** with custom instructions (like employees in an org chart)
- **Define hierarchies** by drawing arrows between agents
- **Execute workflows** by passing data through the visual pipeline
- **See results in real-time** with visual feedback

## ✨ Features

### Core Functionality
- 🎨 **Visual Canvas** - Drag-and-drop agent creation and positioning
- 🔗 **Connection System** - Draw arrows to define agent hierarchy
- 🤖 **Claude Integration** - Each agent powered by Claude 3.5 Sonnet
- ⚡ **Real-time Execution** - Watch your workflow execute step-by-step
- 📊 **Visual Feedback** - Active agent highlighting and status indicators

### Agent Types
- **Intake Agents** - Receive and categorize initial requests
- **Processing Agents** - Perform main tasks and transformations
- **Response Agents** - Format and deliver final outputs

### Pre-built Templates
- 📋 **Customer Support Workflow** - Automated ticket triage and resolution
- *More templates coming soon*

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- An Anthropic API key ([get one here](https://console.anthropic.com/settings/keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/agentflow.git
   cd agentflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Quick Start
1. **Load a Template** - Click "📋 Load Template" to see an example workflow
2. **Add Input** - Enter a test query in the Execution Panel
3. **Run Workflow** - Click "▶️ Run Workflow" to see it in action

### Creating Your Own Workflow
1. **Create Agents**
   - Click "+ Create Agent"
   - Give it a name (e.g., "Email Classifier")
   - Choose agent type (Intake, Processing, or Response)
   - Write instructions for what the agent should do

2. **Connect Agents**
   - Drag from the right handle of one agent to the left handle of another
   - This defines the flow direction

3. **Test Your Workflow**
   - Enter a test input in the Execution Panel
   - Click "Run Workflow"
   - Watch as each agent processes the data in sequence

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: Next.js 16 + React + TypeScript
- **UI Components**: React Flow (visual canvas), Tailwind CSS
- **State Management**: Zustand
- **AI Integration**: Anthropic Claude 3.5 Sonnet API
- **Deployment**: Vercel

### Key Components

```
app/
├── api/execute/          # API endpoint for workflow execution
├── layout.tsx            # Root layout with metadata
└── page.tsx              # Main application page

components/
├── FlowCanvas.tsx        # React Flow canvas container
├── AgentNode.tsx         # Custom node component for agents
├── AgentModal.tsx        # Agent creation/editing modal
└── ExecutionPanel.tsx    # Workflow execution interface

store/
└── useFlowStore.ts       # Zustand state management

types/
└── index.ts              # TypeScript type definitions
```

### Workflow Execution Flow

1. **User Input** → Enters query in Execution Panel
2. **Topological Sort** → Determines agent execution order based on connections
3. **Sequential Processing** → Each agent:
   - Receives context from previous agent (or initial input)
   - Calls Claude API with its specific instructions
   - Returns output to next agent
4. **Real-time Updates** → UI shows active agent and results as they come in
5. **Final Output** → Last agent's response shown to user

## 🎨 Use Cases

### Customer Support
- **Intake Agent**: Categorizes tickets (billing, technical, general)
- **Processing Agent**: Provides solutions or escalation recommendations
- **Response Agent**: Formats empathetic customer-facing response

### HR Onboarding
- **Intake Agent**: Analyzes new hire information
- **Processing Agent**: Generates onboarding checklist
- **Response Agent**: Creates welcome email

### Sales Lead Qualification
- **Intake Agent**: Extracts lead information
- **Processing Agent**: Scores and qualifies lead
- **Response Agent**: Generates personalized outreach

## 🌟 Why AgentFlow Wins

### Impact & Relevance
- ✅ Reduces agent setup time from hours to minutes
- ✅ Makes AI workflows accessible to non-technical teams
- ✅ Solves real coordination challenges companies face

### Creativity
- ✅ First visual org-chart interface for AI agents
- ✅ Intuitive business metaphor (employees → agents)
- ✅ Makes complex AI orchestration simple

### Best Use of Claude
- ✅ Multi-agent architecture powered by Claude 3.5 Sonnet
- ✅ Each agent maintains context through conversation
- ✅ Demonstrates Claude's versatility across different roles

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variable: `ANTHROPIC_API_KEY`
   - Click "Deploy"

3. **Done!** Your app is now live

## 🤝 Contributing

We welcome contributions! Here's how:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is built for the Claude Builder Club x ACT Rice Hackathon (Nov 8-9, 2025).

## 🙏 Acknowledgments

- **Anthropic** - For Claude AI and the hackathon opportunity
- **React Flow** - For the excellent flowchart library
- **Vercel** - For seamless deployment

## 📧 Contact

Built with ❤️ for the Claude Builder Club Hackathon

---

**Made with Claude AI** 🤖
