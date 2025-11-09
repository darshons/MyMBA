import { Company, Department } from '@/types/company';

const COMPANY_STORAGE_KEY = 'agentflow_company';

// Get current company
export function getCurrentCompany(): Company | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(COMPANY_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse company from storage:', error);
    return null;
  }
}

// Save company
export function saveCompany(company: Company): void {
  if (typeof window === 'undefined') return;

  company.lastModified = Date.now();
  localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(company));
}

// Create new company
export function createCompany(name: string, industry: string, description?: string): Company {
  const company: Company = {
    id: `company-${Date.now()}`,
    name,
    industry,
    description,
    departments: [],
    createdAt: Date.now(),
    lastModified: Date.now(),
  };

  saveCompany(company);
  return company;
}

// Add department to company
export function addDepartment(department: Omit<Department, 'id' | 'createdAt'>): Department {
  const company = getCurrentCompany();
  if (!company) throw new Error('No company found');

  const newDepartment: Department = {
    ...department,
    id: `dept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };

  company.departments.push(newDepartment);
  saveCompany(company);

  return newDepartment;
}

// Update department
export function updateDepartment(departmentId: string, updates: Partial<Department>): void {
  const company = getCurrentCompany();
  if (!company) throw new Error('No company found');

  const deptIndex = company.departments.findIndex(d => d.id === departmentId);
  if (deptIndex === -1) throw new Error('Department not found');

  company.departments[deptIndex] = {
    ...company.departments[deptIndex],
    ...updates,
  };

  saveCompany(company);
}

// Remove department
export function removeDepartment(departmentId: string): void {
  const company = getCurrentCompany();
  if (!company) throw new Error('No company found');

  // Remove the department and any subdepartments
  const toRemove = new Set([departmentId]);
  let changed = true;

  while (changed) {
    changed = false;
    company.departments.forEach(dept => {
      if (dept.parentId && toRemove.has(dept.parentId) && !toRemove.has(dept.id)) {
        toRemove.add(dept.id);
        changed = true;
      }
    });
  }

  company.departments = company.departments.filter(d => !toRemove.has(d.id));
  saveCompany(company);
}

// Get department by ID
export function getDepartment(departmentId: string): Department | null {
  const company = getCurrentCompany();
  if (!company) return null;

  return company.departments.find(d => d.id === departmentId) || null;
}

// Get subdepartments of a department
export function getSubdepartments(parentId: string): Department[] {
  const company = getCurrentCompany();
  if (!company) return [];

  return company.departments.filter(d => d.parentId === parentId);
}

// Get root departments (no parent)
export function getRootDepartments(): Department[] {
  const company = getCurrentCompany();
  if (!company) return [];

  return company.departments.filter(d => !d.parentId);
}

// Clear company (for starting fresh)
export function clearCompany(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COMPANY_STORAGE_KEY);
}
