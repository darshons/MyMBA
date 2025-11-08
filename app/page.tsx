import FlowCanvas from '@/components/FlowCanvas';
import ExecutionPanel from '@/components/ExecutionPanel';

export default function Home() {
  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 h-full">
        <FlowCanvas />
      </div>
      <ExecutionPanel />
    </div>
  );
}
