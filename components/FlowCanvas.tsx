'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '@/store/useFlowStore';
import AgentNode from './AgentNode';
import AgentModal from './AgentModal';
import StickyNote from './StickyNote';

const nodeTypes = {
  agentNode: AgentNode,
  stickyNote: StickyNote,
};

export default function FlowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useFlowStore();

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
          <MiniMap />
        </ReactFlow>
      </div>

      <AgentModal />
    </>
  );
}
