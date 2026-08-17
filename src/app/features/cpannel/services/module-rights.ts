import type { AdminPermission, PannelModule } from '../../../core/supabase/database.types';

export type ModuleRight = 'view' | 'edit' | 'publish';

export interface RightsContext {
  readonly isActive: boolean;
  readonly isSuperAdmin: boolean;
  readonly permissions: readonly AdminPermission[];
}

/**
 * Décide si un administrateur possède un droit donné sur un module.
 *
 * Isolé en fonction pure pour être testable sans base de données ni session :
 * c'est la règle la plus sensible du cpannel côté interface, elle mérite des
 * tests directs.
 *
 * Doit rester le miroir exact de `has_module_right()` en base. En cas de
 * divergence, c'est la base qui fait autorité — cette fonction ne sert qu'à
 * éviter d'afficher des actions vouées à être refusées.
 */
export function hasModuleRight(
  context: RightsContext,
  module: PannelModule,
  right: ModuleRight,
): boolean {
  // Un compte désactivé n'a plus aucun droit, quel que soit son rôle.
  if (!context.isActive) return false;

  if (context.isSuperAdmin) return true;

  const permission = context.permissions.find((entry) => entry.module === module);
  if (!permission) return false;

  switch (right) {
    case 'view':
      return permission.can_view;
    case 'edit':
      return permission.can_edit;
    case 'publish':
      return permission.can_publish;
  }
}
