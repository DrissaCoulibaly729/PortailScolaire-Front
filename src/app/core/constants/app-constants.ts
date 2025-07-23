export const APP_CONSTANTS = {
  APP_NAME: 'Portail Administratif Scolaire',
  VERSION: '1.0.0',
  
  // Rôles
  ROLES: {
    ADMIN: 'administrateur',
    ENSEIGNANT: 'enseignant',
    ELEVE: 'eleve'
  } as const,
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 15,
    PAGE_SIZE_OPTIONS: [10, 15, 25, 50]
  },
  
  // Notes
  NOTES: {
    MIN_VALUE: 0,
    MAX_VALUE: 20,
    TYPES: ['devoir', 'controle', 'examen'] as const,
    PERIODES: ['trimestre1', 'trimestre2', 'trimestre3'] as const
  },
  
  // Mentions
  MENTIONS: {
    EXCELLENT: { min: 16, label: 'Excellent', color: 'text-green-600' },
    TRES_BIEN: { min: 14, label: 'Très Bien', color: 'text-blue-600' },
    BIEN: { min: 12, label: 'Bien', color: 'text-yellow-600' },
    ASSEZ_BIEN: { min: 10, label: 'Assez Bien', color: 'text-orange-600' },
    PASSABLE: { min: 8, label: 'Passable', color: 'text-red-400' },
    INSUFFISANT: { min: 0, label: 'Insuffisant', color: 'text-red-600' }
  },
  
  // Niveaux scolaires
  NIVEAUX: [
    '6ème', '5ème', '4ème', '3ème', 
    '2nde', '1ère', 'Terminale'
  ] as const,
  
  // Sections
  SECTIONS: ['A', 'B', 'C', 'D', 'E'] as const,
  
  // Formats de date
  DATE_FORMATS: {
    DISPLAY: 'dd/MM/yyyy',
    API: 'yyyy-MM-dd',
    DATETIME: 'dd/MM/yyyy HH:mm'
  },
  
  // Messages
  MESSAGES: {
    SUCCESS: {
      LOGIN: 'Connexion réussie',
      LOGOUT: 'Déconnexion réussie',
      SAVE: 'Enregistrement réussi',
      DELETE: 'Suppression réussie',
      UPDATE: 'Modification réussie'
    },
    ERROR: {
      GENERIC: 'Une erreur est survenue',
      NETWORK: 'Erreur de connexion',
      UNAUTHORIZED: 'Accès non autorisé',
      FORBIDDEN: 'Accès refusé'
    }
  },

  // Configuration JWT
  JWT: {
    TOKEN_KEY: 'portail_scolaire_token',
    REFRESH_TOKEN_KEY: 'portail_scolaire_refresh_token',
    EXPIRATION_TIME: 3600000 // 1 heure en millisecondes
  },

  // API Configuration
  API: {
    TIMEOUT: 30000, // 30 secondes
    RETRY_ATTEMPTS: 3,
    BASE_URL: 'http://localhost:8000/api' // À modifier selon votre config
  }
} as const;