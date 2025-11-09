import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { resetVectorStore } from '@/lib/vectorStore';

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

      case 'add_learning':
        content = addLearningToDepartment(content, departmentName, data);
        break;

      case 'update_current_work':
        content = updateCurrentWork(content, departmentName, data);
        break;

      case 'add_note':
        content = addNote(content, data);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid update type' },
          { status: 400 }
        );
    }

    // Write updated content
    writeFileSync(filePath, content, 'utf-8');

    // Reset vector store so it rebuilds with new content
    resetVectorStore();
    console.log('Vector store reset after knowledge base update');

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

  // Find Company Overview section (now an H1)
  const overviewStart = lines.findIndex(line => line.trim() === '# Company Overview');
  if (overviewStart === -1) return content;

  // Find next ## section (first department)
  let overviewEnd = lines.length;
  for (let i = overviewStart + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('##') && !lines[i].trim().startsWith('###')) {
      overviewEnd = i;
      break;
    }
  }

  // Build new overview section (simpler format)
  const newOverview = [
    '# Company Overview',
    `**Industry:** ${data.industry || 'Not yet defined'}`,
    `**Mission:** ${data.mission || 'Not yet defined'}`,
    ''
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

### Past work
- No work completed yet

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

  // Build new department section with new structure
  const newSection = [
    `## ${departmentName}`,
    '',
    '### Past work',
    ...(data.pastWork || ['- No work completed yet']).map((w: string) => typeof w === 'string' && w.startsWith('-') ? w : `- ${w}`),
    ''
  ];

  // Replace department section
  lines.splice(deptStart, deptEnd - deptStart, ...newSection);

  return lines.join('\n');
}

function addLearningToDepartment(content: string, departmentName: string, learning: string): string {
  // Learning is now added to "Past work" instead
  return addToPastWork(content, departmentName, learning);
}

function addToPastWork(content: string, departmentName: string, work: string): string {
  const lines = content.split('\n');

  // Find department section
  const deptStart = lines.findIndex(line =>
    line.trim().startsWith('##') && line.includes(departmentName)
  );

  if (deptStart === -1) {
    // Department doesn't exist, create it first
    content = addDepartmentSection(content, departmentName);
    // Re-parse lines after adding department
    return addToPastWork(content, departmentName, work);
  }

  // Find "### Past work" section
  let pastWorkIndex = -1;
  for (let i = deptStart; i < lines.length; i++) {
    if (lines[i].trim() === '### Past work') {
      pastWorkIndex = i;
      break;
    }
    // Stop if we hit next department
    if (i > deptStart && lines[i].trim().startsWith('##') && !lines[i].trim().startsWith('###')) {
      break;
    }
  }

  if (pastWorkIndex === -1) {
    // Past work section doesn't exist in this department
    return content;
  }

  // Remove "No work completed yet" if it exists
  if (lines[pastWorkIndex + 1]?.includes('No work completed yet')) {
    lines.splice(pastWorkIndex + 1, 1);
  }

  // Find insertion point (after last work item in this section)
  let insertIndex = pastWorkIndex + 1;
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

  // Insert new work item (keep only most recent 10)
  lines.splice(insertIndex, 0, `- ${work}`);

  // Count work items and limit to 10
  let workItemCount = 0;
  for (let i = pastWorkIndex + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('###') || lines[i].trim().startsWith('##')) {
      break;
    }
    if (lines[i].trim().startsWith('-')) {
      workItemCount++;
      if (workItemCount > 10) {
        lines.splice(i, 1);
        i--;
      }
    }
  }

  return lines.join('\n');
}

function updateCurrentWork(content: string, departmentName: string, work: string): string {
  // Current Work now maps to "Past work" in the new structure
  return addToPastWork(content, departmentName, work);
}

function addNote(content: string, noteText: string): string {
  const lines = content.split('\n');

  // Find the Company Overview section
  const overviewStart = lines.findIndex(line => line.trim() === '# Company Overview');
  if (overviewStart === -1) return content;

  // Find where Notes section should be (after overview, before first department)
  let notesIndex = -1;
  let insertAfterIndex = overviewStart;

  // Look for existing Notes section or first department
  for (let i = overviewStart + 1; i < lines.length; i++) {
    if (lines[i].trim() === '## Notes') {
      notesIndex = i;
      break;
    }
    if (lines[i].trim().startsWith('## ') && !lines[i].trim().startsWith('###')) {
      // Found first department, insert Notes before it
      insertAfterIndex = i - 1;
      break;
    }
    // Track end of overview section
    if (lines[i].trim() !== '' && !lines[i].trim().startsWith('**')) {
      insertAfterIndex = i - 1;
    } else if (lines[i].trim().startsWith('**')) {
      insertAfterIndex = i;
    }
  }

  if (notesIndex === -1) {
    // Notes section doesn't exist, create it
    const notesSection = [
      '',
      '## Notes',
      '',
      `- ${noteText}`,
      ''
    ];
    lines.splice(insertAfterIndex + 1, 0, ...notesSection);
  } else {
    // Notes section exists, add note to it
    // Find insertion point after last note
    let insertIndex = notesIndex + 1;

    // Skip empty lines after "## Notes"
    while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
      insertIndex++;
    }

    // Find end of notes section
    while (insertIndex < lines.length &&
           !lines[insertIndex].trim().startsWith('##')) {
      if (lines[insertIndex].trim().startsWith('-')) {
        insertIndex++;
      } else if (lines[insertIndex].trim() === '') {
        break;
      } else {
        break;
      }
    }

    // Insert new note
    lines.splice(insertIndex, 0, `- ${noteText}`);

    // Limit to 20 most recent notes
    let noteCount = 0;
    for (let i = notesIndex + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith('##')) break;
      if (lines[i].trim().startsWith('-')) {
        noteCount++;
        if (noteCount > 20) {
          lines.splice(i, 1);
          i--;
        }
      }
    }
  }

  return lines.join('\n');
}
