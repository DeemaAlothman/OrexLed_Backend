import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given roles. Requires JwtAuthGuard to have run first. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
