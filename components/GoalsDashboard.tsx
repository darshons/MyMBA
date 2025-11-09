'use client';

import { useState, useEffect } from 'react';
import { Goal } from '@/types/knowledge';
import { getGoals, createGoal, updateGoal } from '@/lib/knowledgeStorage';
import { getCurrentCompany } from '@/lib/companyStorage';

export default function GoalsDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);

  // New goal form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Goal['priority']>('medium');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const company = getCurrentCompany();

  const loadGoals = () => {
    setGoals(getGoals());
  };

  useEffect(() => {
    if (isOpen) {
      loadGoals();
    }
  }, [isOpen]);

  const handleCreateGoal = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const newGoal = createGoal(title, description, priority, selectedDepartments);

    // Also add to knowledge base
    await fetch('/api/knowledge/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'add_goal',
        data: `${title}: ${description}`,
      }),
    });

    setShowNewGoalForm(false);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setSelectedDepartments([]);
    loadGoals();
  };

  const handleToggleDepartment = (deptId: string) => {
    setSelectedDepartments(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const handleStatusChange = async (goalId: string, newStatus: Goal['status']) => {
    updateGoal(goalId, { status: newStatus });
    loadGoals();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-4 bg-[#8B7355] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#7a6449] transition font-semibold text-sm z-50 flex items-center gap-2"
      >
        🎯 Goals ({getGoals().filter(g => g.status === 'active' || g.status === 'in_progress').length})
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#8B7355] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">🎯 Company Goals</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewGoalForm(!showNewGoalForm)}
              className="bg-white text-[#8B7355] px-4 py-2 rounded-lg font-semibold hover:bg-[#F0EFEA] transition"
            >
              + New Goal
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-white text-[#8B7355] px-4 py-2 rounded-lg font-semibold hover:bg-[#F0EFEA] transition"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {showNewGoalForm && (
            <div className="border-2 border-[#8B7355] rounded-lg p-4 bg-[#F0EFEA]">
              <h3 className="font-bold text-lg mb-3">Create New Goal</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Goal Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Increase customer satisfaction"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg min-h-[80px]"
                    placeholder="Describe the goal and how to achieve it..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Goal['priority'])}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {company && company.departments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Assign to Departments</label>
                    <div className="space-y-2">
                      {company.departments.map((dept) => (
                        <label key={dept.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept.id)}
                            onChange={() => handleToggleDepartment(dept.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{dept.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCreateGoal}
                    className="flex-1 bg-[#8B7355] text-white px-4 py-2 rounded-lg hover:bg-[#7a6449] transition font-semibold"
                  >
                    Create Goal
                  </button>
                  <button
                    onClick={() => setShowNewGoalForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No goals set yet</p>
              <p className="text-sm">Create a goal to get your agents working autonomously!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`border-2 rounded-lg p-4 ${
                    goal.status === 'completed'
                      ? 'bg-green-50 border-green-300'
                      : goal.status === 'blocked'
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{goal.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        goal.priority === 'critical' ? 'bg-red-200 text-red-800' :
                        goal.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        goal.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {goal.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-500">
                      Created {new Date(goal.createdAt).toLocaleDateString()}
                      {goal.assignedDepartments.length > 0 && company && (
                        <span className="ml-3">
                          Assigned to: {goal.assignedDepartments.map(dId =>
                            company.departments.find(d => d.id === dId)?.name
                          ).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>

                    <select
                      value={goal.status}
                      onChange={(e) => handleStatusChange(goal.id, e.target.value as Goal['status'])}
                      className="px-3 py-1 border rounded text-sm font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
          <p className="text-sm text-gray-600">
            💡 Agents will automatically work towards these goals and propose actions for your approval
          </p>
        </div>
      </div>
    </div>
  );
}
