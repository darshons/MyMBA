import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { departmentId } = body;

    // Read company.md
    const filePath = join(process.cwd(), 'public', 'company.md');
    const content = readFileSync(filePath, 'utf-8');

    if (!departmentId) {
      // Return full knowledge base
      return NextResponse.json({
        content,
        lastUpdated: new Date().toISOString()
      });
    }

    // Extract department-specific section
    const departmentSection = extractDepartmentSection(content, departmentId);

    return NextResponse.json({
      departmentId,
      content: departmentSection,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to read knowledge base' },
      { status: 500 }
    );
  }
}

function extractDepartmentSection(content: string, departmentName: string): string {
  const lines = content.split('\n');
  const sectionStart = lines.findIndex(line =>
    line.trim().startsWith('##') && line.includes(departmentName)
  );

  if (sectionStart === -1) {
    return ''; // Department section not found
  }

  // Find next ## heading or end of file
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('##') && !lines[i].trim().startsWith('###')) {
      sectionEnd = i;
      break;
    }
  }

  return lines.slice(sectionStart, sectionEnd).join('\n');
}
