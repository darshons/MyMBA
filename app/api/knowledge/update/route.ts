import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data, departmentName } = body;

    const filePath = join(process.cwd(), 'public', 'company.md');
    let content = readFileSync(filePath, 'utf-8');

    switch (type) {
      case 'company_overview':
        content = updateCompanyOverview(content, data);
        break;

      case 'add_department':
        content = addDepartmentSection(content, departmentName);
        break;

      case 'update_department':
        content = updateDepartmentSection(content, departmentName, data);
        break;

      case 'add_goal':
        content = addGoalToOverview(content, data);
        break;

      case 'add_learning':
        content = addLearningToDepartment(content, departmentName, data);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid update type' },
          { status: 400 }
        );
    }

    // Write updated content
    writeFileSync(filePath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge base' },
      { status: 500 }
    );
  }
}

function updateCompanyOverview(content: string, data: any): string {
  const lines = content.split('\n');

  // Find Company Overview section
  const overviewStart = lines.findIndex(line => line.trim() === '## Company Overview');
  if (overviewStart === -1) return content;

  // Find next ## section
  let overviewEnd = lines.length;
  for (let i = overviewStart + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('##') && !lines[i].trim().startsWith('###')) {
      overviewEnd = i;
      break;
    }
  }

  // Build new overview section
  const newOverview = [
    '## Company Overview',
    '',
    `**Industry:** ${data.industry || 'Not yet defined'}`,
    `**Mission:** ${data.mission || 'Not yet defined'}`,
    `**Current Goals:**`,
    ...(data.goals || ['- None set yet']).map((g: string) => typeof g === 'string' && g.startsWith('-') ? g : `- ${g}`),
    '',
    `**Current Problems:**`,
    ...(data.problems || ['- None identified yet']).map((p: string) => typeof p === 'string' && p.startsWith('-') ? p : `- ${p}`),
    '',
    `**Last Updated:** ${new Date().toISOString().split('T')[0]}`,
    '',
    '---'
  ];

  // Replace overview section
  lines.splice(overviewStart, overviewEnd - overviewStart, ...newOverview);

  return lines.join('\n');
}

function addDepartmentSection(content: string, departmentName: string): string {
  // Check if department section already exists
  if (content.includes(`## ${departmentName}`)) {
    return content;
  }

  const newSection = `

## ${departmentName}

### Goals
- None set yet

### Current Work
- No active tasks

### Learnings & Insights
- Just created

`;

  return content + newSection;
}

function updateDepartmentSection(content: string, departmentName: string, data: any): string {
  const lines = content.split('\n');

  // Find department section
  const deptStart = lines.findIndex(line =>
    line.trim().startsWith('##') && line.includes(departmentName)
  );

  if (deptStart === -1) {
    // Department doesn't exist, add it
    return addDepartmentSection(content, departmentName);
  }

  // Find next ## section or end of file
  let deptEnd = lines.length;
  for (let i = deptStart + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('##') && !lines[i].trim().startsWith('###')) {
      deptEnd = i;
      break;
    }
  }

  // Build new department section
  const newSection = [
    `## ${departmentName}`,
    '',
    '### Goals',
    ...(data.goals || ['- None set yet']).map((g: string) => typeof g === 'string' && g.startsWith('-') ? g : `- ${g}`),
    '',
    '### Current Work',
    ...(data.currentWork || ['- No active tasks']).map((w: string) => typeof w === 'string' && w.startsWith('-') ? w : `- ${w}`),
    '',
    '### Learnings & Insights',
    ...(data.learnings || []).map((l: string) => typeof l === 'string' && l.startsWith('-') ? l : `- ${l}`),
    ''
  ];

  // Replace department section
  lines.splice(deptStart, deptEnd - deptStart, ...newSection);

  return lines.join('\n');
}

function addGoalToOverview(content: string, goal: string): string {
  const lines = content.split('\n');

  // Find "**Current Goals:**" line
  const goalsIndex = lines.findIndex(line => line.includes('**Current Goals:**'));

  if (goalsIndex === -1) return content;

  // Find the next empty line or section after goals
  let insertIndex = goalsIndex + 1;
  while (insertIndex < lines.length && lines[insertIndex].trim().startsWith('-')) {
    insertIndex++;
  }

  // Remove "None set yet" if it exists
  if (lines[goalsIndex + 1]?.includes('None set yet')) {
    lines.splice(goalsIndex + 1, 1);
    insertIndex = goalsIndex + 1;
  }

  // Insert new goal
  lines.splice(insertIndex, 0, `- ${goal}`);

  return lines.join('\n');
}

function addLearningToDepartment(content: string, departmentName: string, learning: string): string {
  const lines = content.split('\n');

  // Find department section
  const deptStart = lines.findIndex(line =>
    line.trim().startsWith('##') && line.includes(departmentName)
  );

  if (deptStart === -1) {
    // Department doesn't exist, can't add learning
    return content;
  }

  // Find "### Learnings & Insights" section
  let learningsIndex = -1;
  for (let i = deptStart; i < lines.length; i++) {
    if (lines[i].trim() === '### Learnings & Insights') {
      learningsIndex = i;
      break;
    }
    // Stop if we hit next department
    if (i > deptStart && lines[i].trim().startsWith('##') && !lines[i].trim().startsWith('###')) {
      break;
    }
  }

  if (learningsIndex === -1) {
    // Learnings section doesn't exist in this department
    return content;
  }

  // Find next subsection or department
  let insertIndex = learningsIndex + 1;
  while (insertIndex < lines.length &&
         !lines[insertIndex].trim().startsWith('###') &&
         !lines[insertIndex].trim().startsWith('##')) {
    if (lines[insertIndex].trim().startsWith('-')) {
      insertIndex++;
    } else if (lines[insertIndex].trim() === '') {
      break;
    } else {
      break;
    }
  }

  // Remove "Just created" if it exists
  if (lines[learningsIndex + 1]?.includes('Just created')) {
    lines.splice(learningsIndex + 1, 1);
    insertIndex = learningsIndex + 1;
  }

  // Insert new learning
  lines.splice(insertIndex, 0, `- ${learning}`);

  return lines.join('\n');
}
