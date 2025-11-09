// Company state management using localStorage

export interface Company {
  name: string;
  industry?: string;
  departments: Department[];
}

export interface Department {
  id: string;
  name: string;
  description: string;
  parentId?: string;
}

const COMPANY_KEY = 'agentflow_company';

export function getCurrentCompany(): Company | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(COMPANY_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading company from localStorage:', error);
    return null;
  }
}

export function saveCompany(company: Company): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
  } catch (error) {
    console.error('Error saving company to localStorage:', error);
  }
}

export function getDepartment(departmentId: string): Department | null {
  const company = getCurrentCompany();
  if (!company) return null;

  return company.departments.find(dept => dept.id === departmentId) || null;
}

export function clearCompany(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(COMPANY_KEY);
  } catch (error) {
    console.error('Error clearing company from localStorage:', error);
  }
}
