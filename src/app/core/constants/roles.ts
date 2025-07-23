export enum UserRoles {
  ADMINISTRATEUR = 'administrateur',
  ENSEIGNANT = 'enseignant',
  ELEVE = 'eleve'
}

export const ROLE_PERMISSIONS = {
  [UserRoles.ADMINISTRATEUR]: [
    'dashboard.view',
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'classes.create',
    'classes.read',
    'classes.update',
    'classes.delete',
    'matieres.create',
    'matieres.read',
    'matieres.update',
    'matieres.delete',
    'notes.read',
    'bulletins.generate',
    'bulletins.download'
  ],
  [UserRoles.ENSEIGNANT]: [
    'dashboard.view',
    'notes.create',
    'notes.read',
    'notes.update',
    'students.read'
  ],
  [UserRoles.ELEVE]: [
    'dashboard.view',
    'bulletins.read',
    'bulletins.download',
    'notes.read'
  ]
} as const;

export const ROLE_LABELS = {
  [UserRoles.ADMINISTRATEUR]: 'Administrateur',
  [UserRoles.ENSEIGNANT]: 'Enseignant',
  [UserRoles.ELEVE]: 'Élève'
} as const;
