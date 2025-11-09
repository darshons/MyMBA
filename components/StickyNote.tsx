import { memo, useState, useRef, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { useFlowStore } from '@/store/useFlowStore';

interface StickyNoteData {
  id: string;
  text: string;
  color: string;
}

type StickyNoteProps = NodeProps & {
  data: StickyNoteData;
};

const StickyNote = ({ data }: StickyNoteProps) => {
  const { updateStickyNote, deleteStickyNote } = useFlowStore();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    updateStickyNote(data.id, { text });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow Shift+Enter for new lines
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setText(data.text);
      setIsEditing(false);
    }
  };

  // Auto-resize textarea as user types
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content
      textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;

      // Calculate width based on content
      const lines = text.split('\n');
      const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);

      // Estimate width (roughly 8px per character, min 200px, max 500px)
      const estimatedWidth = Math.min(Math.max(200, longestLine * 8 + 40), 500);

      // Update parent div width
      const parent = textarea.parentElement;
      if (parent) {
        parent.style.width = `${estimatedWidth}px`;
      }
    }
  };

  // Auto-resize when entering edit mode or text changes
  useEffect(() => {
    if (isEditing) {
      autoResize();
    }
  }, [isEditing, text]);

  return (
    <div
      className="relative rounded-lg shadow-lg min-w-[200px] min-h-[120px] p-4"
      style={{ backgroundColor: data.color }}
    >
      {/* Delete button */}
      <button
        onClick={() => deleteStickyNote(data.id)}
        className="absolute -top-2 -right-2 w-4 h-4 bg-red-400/70 hover:bg-red-500 hover:scale-150 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all duration-200 z-10"
        title="Delete Note"
      >
        ×
      </button>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autoResize();
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-800 placeholder-gray-500 overflow-hidden"
          placeholder="Type your note..."
          autoFocus
          style={{ minHeight: '80px' }}
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="cursor-text text-sm text-gray-800 whitespace-pre-wrap min-h-[80px]"
        >
          {text || 'Click to edit...'}
        </div>
      )}

      {/* Sticky note fold effect */}
      <div
        className="absolute bottom-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-b-[20px] opacity-20"
        style={{ borderBottomColor: data.color, filter: 'brightness(0.7)' }}
      />
    </div>
  );
};

export default memo(StickyNote);
