import { Role } from '../../../generated/prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
}
