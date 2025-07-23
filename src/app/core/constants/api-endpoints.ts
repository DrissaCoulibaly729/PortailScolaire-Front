export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: '/auth/connexion',
    LOGOUT: '/auth/deconnexion',
    PROFILE: '/auth/profil',
    CHANGE_PASSWORD: '/auth/changer-mot-de-passe',
    VERIFY_TOKEN: '/auth/verifier-token'
  },
  
  // Administration
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    STATS_AVANCEES: '/admin/dashboard/statistiques-avancees',
    USERS: '/admin/utilisateurs',
    USER_BY_ID: (id: number) => `/admin/utilisateurs/${id}`,
    CREATE_ENSEIGNANT: '/admin/utilisateurs/enseignants',
    CREATE_ELEVE: '/admin/utilisateurs/eleves',
    UPDATE_USER: (id: number) => `/admin/utilisateurs/${id}`,
    TOGGLE_USER_STATUS: (id: number) => `/admin/utilisateurs/${id}/toggle-statut`,
    RESET_PASSWORD: (id: number) => `/admin/utilisateurs/${id}/reinitialiser-mot-de-passe`,
    DELETE_USER: (id: number) => `/admin/utilisateurs/${id}`
  },
  
  // Classes
  CLASSES: {
    LIST: '/admin/classes',
    BY_ID: (id: number) => `/admin/classes/${id}`,
    CREATE: '/admin/classes',
    UPDATE: (id: number) => `/admin/classes/${id}`,
    TOGGLE_STATUS: (id: number) => `/admin/classes/${id}/toggle-statut`,
    DELETE: (id: number) => `/admin/classes/${id}`,
    AFFECTER_ENSEIGNANT: (id: number) => `/admin/classes/${id}/affecter-enseignant`,
    RETIRER_ENSEIGNANT: (classeId: number, enseignantId: number) => 
      `/admin/classes/${classeId}/enseignants/${enseignantId}`,
    STATS: '/admin/classes/statistiques'
  },
  
  // Matières
  MATIERES: {
    LIST: '/admin/matieres',
    BY_ID: (id: number) => `/admin/matieres/${id}`,
    CREATE: '/admin/matieres',
    UPDATE: (id: number) => `/admin/matieres/${id}`,
    TOGGLE_STATUS: (id: number) => `/admin/matieres/${id}/toggle-statut`,
    DELETE: (id: number) => `/admin/matieres/${id}`,
    ENSEIGNANTS_DISPONIBLES: (id: number) => `/admin/matieres/${id}/enseignants-disponibles`,
    AFFECTER_ENSEIGNANT: (id: number) => `/admin/matieres/${id}/affecter-enseignant`,
    RETIRER_ENSEIGNANT: (matiereId: number, enseignantId: number) => 
      `/admin/matieres/${matiereId}/enseignants/${enseignantId}`
  },
  
  // Système
  HEALTH: '/health'
} as const;