import { create } from 'zustand';
import { CustomToolDefinition } from '@/types/customTool';

const SAMPLE_TOOL: CustomToolDefinition = {
  id: 'sample-tool',
  name: 'Sample Echo Tool',
  description: 'Posts your input to /api/custom-tools/echo and returns a structured summary.',
  endpoint: '/api/custom-tools/echo',
  authType: 'none',
};

interface ToolState {
  tools: CustomToolDefinition[];
  isModalOpen: boolean;
  editingTool: CustomToolDefinition | null;

  addTool: (tool: Omit<CustomToolDefinition, 'id'>) => void;
  updateTool: (id: string, data: Partial<Omit<CustomToolDefinition, 'id'>>) => void;
  deleteTool: (id: string) => void;
  openModal: (tool?: CustomToolDefinition) => void;
  closeModal: () => void;
  loadTools: () => void;
}

export const useToolStore = create<ToolState>((set, get) => ({
  tools: [],
  isModalOpen: false,
  editingTool: null,

  addTool: (tool) => {
    const newTool: CustomToolDefinition = {
      ...tool,
      id: `tool-${Date.now()}`,
    };

    const updatedTools = [...get().tools, newTool];
    set({ tools: updatedTools });

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mcp-tools', JSON.stringify(updatedTools));
    }
  },

  updateTool: (id, data) => {
    const updatedTools = get().tools.map((tool) =>
      tool.id === id ? { ...tool, ...data } : tool
    );
    set({ tools: updatedTools });

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mcp-tools', JSON.stringify(updatedTools));
    }
  },

  deleteTool: (id) => {
    const updatedTools = get().tools.filter((tool) => tool.id !== id);
    set({ tools: updatedTools });

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mcp-tools', JSON.stringify(updatedTools));
    }
  },

  openModal: (tool) => {
    set({ isModalOpen: true, editingTool: tool || null });
  },

  closeModal: () => {
    set({ isModalOpen: false, editingTool: null });
  },

  loadTools: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mcp-tools');
      if (stored) {
        try {
          const tools = JSON.parse(stored);
          set({ tools });
          return;
        } catch (error) {
          console.error('Failed to load tools:', error);
        }
      }

      // Seed with sample tool when nothing is stored
      set({ tools: [SAMPLE_TOOL] });
      localStorage.setItem('mcp-tools', JSON.stringify([SAMPLE_TOOL]));
    }
  },
}));
