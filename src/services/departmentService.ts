import { isDemoMode } from '../utils/demoMode';

export interface DepartmentItem {
  id: string;
  name: string;
  wing: string;
  head: string;
  headDoctorId?: string;
  headAvatar?: string;
  totalBeds: number;
  occupiedBeds: number;
  extension: string;
  status: 'Operational' | 'High Occupancy' | 'Maintenance' | 'Emergency Priority';
}

export const STORAGE_DEPARTMENTS_KEY = 'prms_hospital_departments_v4';

export const initialDepartments: DepartmentItem[] = [
  {
    id: 'dept-1',
    name: 'Cardiology',
    wing: 'North Tower - Floor 3',
    head: 'Dr. Liam Reynolds',
    totalBeds: 40,
    occupiedBeds: 34,
    extension: 'Ext. 3401',
    status: 'High Occupancy',
  },
  {
    id: 'dept-2',
    name: 'Pediatrics',
    wing: 'East Wing - Floor 2',
    head: 'Dr. Naomi Chen',
    totalBeds: 30,
    occupiedBeds: 18,
    extension: 'Ext. 2205',
    status: 'Operational',
  },
  {
    id: 'dept-3',
    name: 'Emergency & Trauma',
    wing: 'Ground Level - Block A',
    head: 'Dr. Marcus Reynolds',
    totalBeds: 50,
    occupiedBeds: 46,
    extension: 'Ext. 1000',
    status: 'Emergency Priority',
  },
  {
    id: 'dept-4',
    name: 'Surgical Suite',
    wing: 'Operating Block B',
    head: 'Dr. David Okonkwo',
    totalBeds: 25,
    occupiedBeds: 20,
    extension: 'Ext. 4500',
    status: 'Operational',
  },
  {
    id: 'dept-5',
    name: 'Neurology',
    wing: 'South Tower - Floor 4',
    head: 'Dr. Ahmed Al-Rashid',
    totalBeds: 35,
    occupiedBeds: 22,
    extension: 'Ext. 4012',
    status: 'Operational',
  },
  {
    id: 'dept-6',
    name: 'Psychiatry & Behavioral Health',
    wing: 'West Annex - Level 1',
    head: 'Dr. Sarah Chen',
    totalBeds: 20,
    occupiedBeds: 14,
    extension: 'Ext. 5100',
    status: 'Operational',
  },
  {
    id: 'dept-7',
    name: 'Orthopedics',
    wing: 'North Tower - Floor 2',
    head: 'Dr. Kenji Tanaka',
    totalBeds: 28,
    occupiedBeds: 19,
    extension: 'Ext. 2304',
    status: 'Operational',
  },
  {
    id: 'dept-8',
    name: 'ICU & Intensive Care Unit',
    wing: 'Critical Care Block - Floor 1',
    head: 'Dr. Elena Rostova',
    totalBeds: 20,
    occupiedBeds: 18,
    extension: 'Ext. 9110',
    status: 'High Occupancy',
  },
  {
    id: 'dept-9',
    name: 'Dermatology',
    wing: 'Pavilion Wing - Floor 1',
    head: 'Dr. Aisha Patel',
    totalBeds: 15,
    occupiedBeds: 8,
    extension: 'Ext. 1080',
    status: 'Operational',
  },
  {
    id: 'dept-10',
    name: 'General Medicine',
    wing: 'Main Building - Floor 1',
    head: 'Dr. Alex Morgan',
    totalBeds: 45,
    occupiedBeds: 30,
    extension: 'Ext. 1010',
    status: 'Operational',
  },
];

/**
 * Retrieve saved departments from localStorage or initial defaults
 */
export function getStoredDepartments(): DepartmentItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_DEPARTMENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load departments from storage', e);
  }
  return isDemoMode() ? initialDepartments : [];
}

/**
 * Save departments to localStorage and broadcast event across components
 */
export function saveStoredDepartments(departments: DepartmentItem[]): void {
  try {
    localStorage.setItem(STORAGE_DEPARTMENTS_KEY, JSON.stringify(departments));
    window.dispatchEvent(new CustomEvent('prms_departments_updated', { detail: departments }));
  } catch (e) {
    console.warn('Failed to save departments to storage', e);
  }
}

/**
 * Retrieve unique list of department names for selection dropdowns
 */
export function getDepartmentNames(extraDepartments?: (DepartmentItem | string)[]): string[] {
  const stored = getStoredDepartments();
  const names = new Set<string>();

  stored.forEach((d) => {
    if (d.name && d.name.trim()) names.add(d.name.trim());
  });

  if (extraDepartments && Array.isArray(extraDepartments)) {
    extraDepartments.forEach((item) => {
      if (typeof item === 'string' && item.trim()) {
        names.add(item.trim());
      } else if (item && typeof item === 'object' && 'name' in item && item.name) {
        names.add(item.name.trim());
      }
    });
  }

  return Array.from(names);
}
