import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AgentData } from '@/types';
import { useFlowStore } from '@/store/useFlowStore';

type AgentNodeProps = NodeProps & {
  data: AgentData;
};

const AgentNode = ({ data }: AgentNodeProps) => {
  const { openModal, deleteAgent } = useFlowStore();

  const getAgentColor = () => {
    switch (data.type) {
      case 'intake':
        return 'bg-blue-100 border-blue-400 text-blue-900';
      case 'processing':
        return 'bg-purple-100 border-purple-400 text-purple-900';
      case 'response':
        return 'bg-green-100 border-green-400 text-green-900';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-900';
    }
  };

  const getStatusIndicator = () => {
    if (data.status === 'active') {
      return (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse border-2 border-white" />
      );
    }
    if (data.status === 'completed') {
      return (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      );
    }
    return null;
  };

  return (
    <div className={`relative px-4 py-3 rounded-lg border-2 shadow-md min-w-[200px] ${getAgentColor()} ${
      data.status === 'active' ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-gray-600" />

      {getStatusIndicator()}

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">{data.name}</h3>
          <div className="flex gap-1">
            <button
              onClick={() => openModal(data)}
              className="text-xs px-2 py-1 rounded hover:bg-white/50 transition"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => deleteAgent(data.id)}
              className="text-xs px-2 py-1 rounded hover:bg-white/50 transition"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
        <div className="text-xs opacity-75 capitalize">
          {data.type} Agent
        </div>
        <div className="text-xs mt-1 line-clamp-2 opacity-60">
          {data.instructions}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-gray-600" />
    </div>
  );
};

export default memo(AgentNode);
