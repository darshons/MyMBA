'use client';

import { useState } from 'react';
import { updateExecutionFeedback, SavedExecution } from '@/lib/storage';

interface FeedbackModalProps {
  execution: SavedExecution | null;
  onClose: () => void;
}

export default function FeedbackModal({ execution, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!execution) return null;

  const handleSubmit = () => {
    updateExecutionFeedback(execution.id, { rating, comment });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full m-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Review Work</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Department</p>
            <p className="text-sm text-gray-900">{execution.workflowName}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Task Assigned</p>
            <p className="text-sm text-gray-600">{execution.input}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition ${
                    star <= rating ? 'text-yellow-500' : 'text-gray-300'
                  } hover:text-yellow-400`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 1 && 'Poor - Needs major improvement'}
              {rating === 2 && 'Fair - Below expectations'}
              {rating === 3 && 'Good - Meets expectations'}
              {rating === 4 && 'Very Good - Exceeds expectations'}
              {rating === 5 && 'Excellent - Outstanding work'}
            </p>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Feedback for Your Team
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 min-h-[100px]"
              placeholder="e.g., Great analysis, but please include sources next time..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Your feedback will help the team improve future work
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              Submit Review
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
