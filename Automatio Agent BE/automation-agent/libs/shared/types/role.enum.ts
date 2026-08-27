/**
 * System roles (TDD Mục 5.1 — Identity Module: "phân quyền theo Role
 * Admin, Agent, Viewer"). Kept in shared/ because many modules'
 * Guards/Decorators (@Roles) reference this without depending on the
 * Identity module's internals.
 */
export enum Role {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  VIEWER = 'VIEWER',
}
