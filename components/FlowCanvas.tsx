'use client';

import { useCallback } from 'react';
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
import AgentModal from './AgentModal';

const nodeTypes = {
  agentNode: AgentNode,
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
          onConnect={onConnect}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.data.type) {
                case 'intake':
                  return '#93c5fd';
                case 'processing':
                  return '#d8b4fe';
                case 'response':
                  return '#86efac';
                default:
                  return '#e5e7eb';
              }
            }}
          />

          <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4 space-y-2">
            <h1 className="text-xl font-bold text-gray-900">AgentFlow</h1>
            <p className="text-sm text-gray-600">Visual AI Workflow Builder</p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => openModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium text-sm"
              >
                + Create Agent
              </button>

              <button
                onClick={() => loadTemplate('customer-support')}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition font-medium text-sm"
              >
                📋 Load Template
              </button>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Agent Types:</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></div>
                  <span className="text-gray-700">Intake</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-200 border border-purple-400 rounded"></div>
                  <span className="text-gray-700">Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
                  <span className="text-gray-700">Response</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <AgentModal />
    </>
  );
}
