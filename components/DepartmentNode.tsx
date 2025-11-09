import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { DepartmentNodeData } from '@/types/company';
import { useFlowStore } from '@/store/useFlowStore';

type DepartmentNodeProps = NodeProps & {
  data: DepartmentNodeData;
};

const DepartmentNode = ({ data }: DepartmentNodeProps) => {
  const { openDepartmentDetail, closeDepartmentDetail, departmentDetailId } = useFlowStore();

  const isDetailOpen = departmentDetailId === data.departmentId;

  const handleCloseDetail = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the detail when clicking close
    closeDepartmentDetail();
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
    <div
      className={`relative px-5 py-4 rounded-xl border-2 shadow-xl min-w-[260px] bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-400 text-indigo-900 cursor-pointer hover:shadow-2xl transition-all ${
        data.status === 'active' ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
      }`}
      onClick={() => openDepartmentDetail(data.departmentId)}
    >
      {getStatusIndicator()}

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base">{data.name}</h3>
          <div className="flex items-center gap-2">
            {isDetailOpen && (
              <button
                onClick={handleCloseDetail}
                className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition font-semibold"
                title="Close detail view"
              >
                ✕ Close
              </button>
            )}
            <div className="text-xs px-2 py-1 rounded-full bg-indigo-200 text-indigo-800 font-semibold">
              Employee
            </div>
          </div>
        </div>

        <div className="text-xs text-indigo-600 font-medium mt-1 hover:text-indigo-800">
          Click to view employees →
        </div>
      </div>
    </div>
  );
};

export default memo(DepartmentNode);
