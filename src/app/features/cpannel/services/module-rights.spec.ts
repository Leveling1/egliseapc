import { describe, expect, it } from 'vitest';

import { hasModuleRight, type RightsContext } from './module-rights';
import type { AdminPermission } from '../../../core/supabase/database.types';

function permission(overrides: Partial<AdminPermission>): AdminPermission {
  return {
    id: 'p1',
    admin_user_id: 'a1',
    module: 'articles',
    can_view: false,
    can_edit: false,
    can_publish: false,
    ...overrides,
  };
}

const base: RightsContext = { isActive: true, isSuperAdmin: false, permissions: [] };

describe('hasModuleRight', () => {
  it('refuse tout à un administrateur désactivé, même super-administrateur', () => {
    const context: RightsContext = { ...base, isActive: false, isSuperAdmin: true };

    expect(hasModuleRight(context, 'articles', 'view')).toBe(false);
    expect(hasModuleRight(context, 'users', 'edit')).toBe(false);
  });

  it('accorde tout à un super-administrateur actif', () => {
    const context: RightsContext = { ...base, isSuperAdmin: true };

    expect(hasModuleRight(context, 'articles', 'publish')).toBe(true);
    expect(hasModuleRight(context, 'users', 'edit')).toBe(true);
  });

  it('refuse un module sur lequel aucune permission n\'est enregistrée', () => {
    const context: RightsContext = {
      ...base,
      permissions: [permission({ module: 'articles', can_view: true })],
    };

    expect(hasModuleRight(context, 'rda', 'view')).toBe(false);
  });

  it('distingue modifier de publier', () => {
    const context: RightsContext = {
      ...base,
      permissions: [
        permission({ module: 'articles', can_view: true, can_edit: true, can_publish: false }),
      ],
    };

    expect(hasModuleRight(context, 'articles', 'edit')).toBe(true);
    expect(hasModuleRight(context, 'articles', 'publish')).toBe(false);
  });

  it('n\'accorde pas les droits d\'un module à un autre', () => {
    const context: RightsContext = {
      ...base,
      permissions: [
        permission({ module: 'articles', can_view: true, can_edit: true, can_publish: true }),
        permission({ id: 'p2', module: 'users', can_view: false }),
      ],
    };

    expect(hasModuleRight(context, 'users', 'view')).toBe(false);
    expect(hasModuleRight(context, 'users', 'edit')).toBe(false);
  });
});
