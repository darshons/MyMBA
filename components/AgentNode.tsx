import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { AgentData } from '@/types';
import { useFlowStore } from '@/store/useFlowStore';
import { getAgentColor } from '@/lib/colors';

type AgentNodeProps = NodeProps & {
  data: AgentData;
};

const AgentNode = ({ data }: AgentNodeProps) => {
  const { openModal, deleteAgent } = useFlowStore();
  const colors = getAgentColor(data.colorIndex || 0);

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
    <div
      className={`relative px-4 py-3 rounded-xl border-2 shadow-lg min-w-[220px] ${
        data.status === 'active' ? 'ring-2 ring-amber-500 ring-offset-2' : ''
      }`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      {getStatusIndicator()}

      {/* Delete button in top right */}
      <button
        onClick={() => deleteAgent(data.id)}
        className="absolute -top-2 -right-2 w-4 h-4 bg-red-400/70 hover:bg-red-500 hover:scale-150 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all duration-200 z-10"
        title="Delete Agent"
      >
        ×
      </button>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">{data.name}</h3>
          <button
            onClick={() => openModal(data)}
            className="text-xs px-2 py-1 rounded bg-white/40 hover:bg-white/60 transition font-medium"
            title="Edit"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(AgentNode);
