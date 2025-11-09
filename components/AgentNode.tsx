import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { AgentData } from '@/types';
import { useFlowStore } from '@/store/useFlowStore';

type AgentNodeProps = NodeProps & {
  data: AgentData;
};

const AgentNode = ({ data }: AgentNodeProps) => {
  const { openModal, deleteAgent } = useFlowStore();

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
    <div className={`relative px-4 py-3 rounded-xl border-2 shadow-lg min-w-[220px] bg-[#E8D7C3] border-[#A67C52] text-[#5C4A3A] ${
      data.status === 'active' ? 'ring-2 ring-amber-500 ring-offset-2' : ''
    }`}>
      {getStatusIndicator()}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">{data.name}</h3>
          <div className="flex gap-1">
            <button
              onClick={() => openModal(data)}
              className="text-xs px-2 py-1 rounded bg-white/40 hover:bg-white/60 transition font-medium"
              title="Edit"
            >
              Edit
            </button>
            <button
              onClick={() => deleteAgent(data.id)}
              className="text-xs px-2 py-1 rounded bg-white/40 hover:bg-white/60 transition font-medium"
              title="Delete"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(AgentNode);
