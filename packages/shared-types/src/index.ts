export type SecurityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export type EntityType = 'company' | 'subsidiary' | 'department' | 'employee';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  permissions: string[];
  primaryEntityId: string;
  primaryEntityType: EntityType;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  securityLevel: SecurityLevel;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
}

export interface Subsidiary {
  id: string;
  companyId: string;
  name: string;
  description: string;
  securityLevel: SecurityLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  subsidiaryId: string;
  companyId: string;
  name: string;
  description: string;
  headId?: string;
  securityLevel: SecurityLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  departmentId: string;
  subsidiaryId: string;
  companyId: string;
  name: string;
  email: string;
  title: string;
  department: string;
  avatarUrl?: string;
  securityLevel: SecurityLevel;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPayload {
  uid: string;
  email: string;
  role: string;
  permissions: string[];
  primaryEntityId: string;
  primaryEntityType: EntityType;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
