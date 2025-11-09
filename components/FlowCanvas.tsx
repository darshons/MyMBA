'use client';

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '@/store/useFlowStore';
import AgentNode from './AgentNode';
import DepartmentNode from './DepartmentNode';
import AgentModal from './AgentModal';
import DepartmentDetailModal from './DepartmentDetailModal';
import { getCurrentCompany } from '@/lib/companyStorage';

const nodeTypes = {
  agentNode: AgentNode,
  departmentNode: DepartmentNode,
};

export default function FlowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    openModal,
    loadTemplate,
    loadDepartmentNodes,
  } = useFlowStore();

  // Load department nodes when component mounts if company exists
  useEffect(() => {
    const company = getCurrentCompany();
    if (company && company.departments.length > 0) {
      console.log('Loading department nodes, found', company.departments.length, 'departments');
      loadDepartmentNodes();
    } else {
      console.log('No company or departments found');
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <>
      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          nodesConnectable={false}
          connectOnClick={false}
          fitView
          className="bg-[#F0EFEA]"
        >
          <Background color="#828179" gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.data.type) {
                case 'intake':
                  return '#CC785C';
                case 'processing':
                  return '#828179';
                case 'response':
                  return '#CC785C';
                default:
                  return '#828179';
              }
            }}
          />
        </ReactFlow>
      </div>

      <AgentModal />
      <DepartmentDetailModal />
    </>
  );
}
