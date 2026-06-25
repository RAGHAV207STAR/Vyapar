/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'user' | 'manager' | 'staff';

export type Permission =
  | 'view_admin_panel'
  | 'send_test_notifications'
  | 'view_system_diagnostics'
  | 'view_error_logs'
  | 'view_user_statistics'
  | 'manage_feature_flags'
  | 'manage_maintenance_mode'
  | 'run_analytics_testing'
  | 'use_debug_tools'
  | 'view_security_monitoring'
  | 'access_future_admin_features';

// Central Registry mapping user roles to their permitted capabilities
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'view_admin_panel',
    'send_test_notifications',
    'view_system_diagnostics',
    'view_error_logs',
    'view_user_statistics',
    'manage_feature_flags',
    'manage_maintenance_mode',
    'run_analytics_testing',
    'use_debug_tools',
    'view_security_monitoring',
    'access_future_admin_features'
  ],
  manager: [
    'view_user_statistics',
    'view_system_diagnostics'
  ],
  staff: [
    // Future expansion options can be listed here
  ],
  user: [
    // Standard retail user accounts have no admin privileges
  ]
};

/**
 * Validates whether a given role holds the requested permission.
 * Centralizing this logic ensures security and predictability as new capabilities are introduced.
 */
export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Checks if the user is authorized to view any administrative features.
 */
export function canAccessAdminPanel(role: Role | undefined): boolean {
  return hasPermission(role, 'view_admin_panel');
}
