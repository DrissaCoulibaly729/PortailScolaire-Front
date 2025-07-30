// src/app/core/constants/api-endpoints.ts
export const API_ENDPOINTS = {
  // ========================================
  // AUTHENTIFICATION
  // ========================================
  AUTH: {
    LOGIN: '/auth/connexion',
    LOGOUT: '/auth/deconnexion',
    PROFILE: '/auth/profil',
    CHANGE_PASSWORD: '/auth/changer-mot-de-passe',
    VERIFY_TOKEN: '/auth/verifier-token'
  },
  
  // ========================================
  // ADMINISTRATION
  // ========================================
  ADMIN: {
    // Dashboard
    DASHBOARD: '/admin/dashboard',
    STATS_AVANCEES: '/admin/dashboard/statistiques-avancees',
    
    // Utilisateurs
    USERS: '/admin/utilisateurs',
    USER_BY_ID: (id: number) => `/admin/utilisateurs/${id}`,
    CREATE_ENSEIGNANT: '/admin/utilisateurs/enseignants',
    CREATE_ELEVE: '/admin/utilisateurs/eleves',
    UPDATE_USER: (id: number) => `/admin/utilisateurs/${id}`,
    TOGGLE_USER_STATUS: (id: number) => `/admin/utilisateurs/${id}/toggle-statut`,
    RESET_PASSWORD: (id: number) => `/admin/utilisateurs/${id}/reinitialiser-mot-de-passe`,
    DELETE_USER: (id: number) => `/admin/utilisateurs/${id}`,

    // ✅ NOUVEAUX - Bulletins Admin
    BULLETINS: {
      LIST: '/admin/bulletins',
      ELEVE: (eleveId: number) => `/admin/bulletins/eleve/${eleveId}`,
      CLASSE: (classeId: number) => `/admin/bulletins/classe/${classeId}`,
      GENERER_PERIODE: '/admin/bulletins/generer-periode',
      TELECHARGER: (id: number) => `/admin/bulletins/${id}/telecharger`,
      TELECHARGER_GROUPE: '/admin/bulletins/telecharger-groupe',
      RECALCULER: (id: number) => `/admin/bulletins/${id}/recalculer`,
      STATISTIQUES_PERIODE: '/admin/bulletins/statistiques-periode'
    },

    // ✅ NOUVEAUX - Documents Admin
    DOCUMENTS: {
      LIST: '/admin/documents',
      EN_ATTENTE: '/admin/documents/en-attente',
      STATISTIQUES_ELEVES: '/admin/documents/statistiques-eleves',
      VALIDER: (id: number) => `/admin/documents/${id}/valider`,
      REFUSER: (id: number) => `/admin/documents/${id}/refuser`,
      TELECHARGER: (id: number) => `/admin/documents/${id}/telecharger`,
      DELETE: (id: number) => `/admin/documents/${id}`
    }
  },
  
  // ========================================
  // CLASSES
  // ========================================
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
  
  // ========================================
  // MATIÈRES
  // ========================================
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

  // ========================================
  // ✅ NOUVEAUX - ENSEIGNANT
  // ========================================
  ENSEIGNANT: {
    // Dashboard
    DASHBOARD: '/enseignant/dashboard',
    DASHBOARD_RESUME: '/enseignant/dashboard/resume-rapide',
    
    // Gestion des notes
    NOTES: {
      LIST: '/enseignant/notes',
      MES_CLASSES_MATIERES: '/enseignant/notes/mes-classes-matieres',
      NOTES_CLASSE_MATIERE: (classeId: number, matiereId: number) => 
        `/enseignant/notes/classe/${classeId}/matiere/${matiereId}`,
      SAISIR: '/enseignant/notes',
      SAISIE_RAPIDE: '/enseignant/notes/saisie-rapide',
      MODIFIER: (id: number) => `/enseignant/notes/${id}`,
      SUPPRIMER: (id: number) => `/enseignant/notes/${id}`
    }
  },

  // ========================================
  // ✅ NOUVEAUX - ÉLÈVE
  // ========================================
  ELEVE: {
    // Dashboard
    DASHBOARD: '/eleve/dashboard',
    DASHBOARD_RESUME: '/eleve/dashboard/resume-rapide',
    
    // Bulletins
    BULLETINS: {
      LIST: '/eleve/bulletins',
      BY_ID: (id: number) => `/eleve/bulletins/${id}`,
      TELECHARGER: (id: number) => `/eleve/bulletins/${id}/telecharger`,
      HISTORIQUE: (annee?: number) => annee ? `/eleve/bulletins/historique/${annee}` : '/eleve/bulletins/historique',
      COMPARAISON_CLASSE: (id: number) => `/eleve/bulletins/${id}/comparaison-classe`
    },
    
    // Notes
    NOTES: {
      LIST: '/eleve/notes',
      MATIERE: (matiereId: number) => `/eleve/notes/matiere/${matiereId}`,
      PERIODE: (periode: string) => `/eleve/notes/periode/${periode}`,
      EVOLUTION: '/eleve/notes/evolution'
    },
    
    // Profil
    PROFIL: {
      GET: '/eleve/profil',
      UPDATE: '/eleve/profil',
      MA_CLASSE: '/eleve/profil/ma-classe',
      MON_PARCOURS: '/eleve/profil/mon-parcours',
      PREFERENCES_NOTIFICATIONS: '/eleve/profil/preferences-notification',
      UPDATE_PREFERENCES: '/eleve/profil/preferences-notification'
    },
    
    // Documents
    DOCUMENTS: {
      LIST: '/eleve/documents',
      STATUT_VALIDATION: '/eleve/documents/statut-validation',
      HISTORIQUE: '/eleve/documents/historique',
      UPLOAD: '/eleve/documents/upload',
      DELETE: (id: number) => `/eleve/documents/${id}`
    }
  },
  
  // ========================================
  // SYSTÈME
  // ========================================
  HEALTH: '/health'
} as const;

// ========================================
// TYPES UTILITAIRES
// ========================================

// Type pour extraire tous les endpoints
type EndpointValues<T> = T extends string 
  ? T 
  : T extends (...args: any[]) => string 
    ? ReturnType<T>
    : T extends Record<string, any>
      ? EndpointValues<T[keyof T]>
      : never;

export type ApiEndpoint = EndpointValues<typeof API_ENDPOINTS>;

// Helper pour les endpoints avec paramètres
export const buildEndpoint = {
  // Utilisateurs
  userById: (id: number) => API_ENDPOINTS.ADMIN.USER_BY_ID(id),
  updateUser: (id: number) => API_ENDPOINTS.ADMIN.UPDATE_USER(id),
  toggleUserStatus: (id: number) => API_ENDPOINTS.ADMIN.TOGGLE_USER_STATUS(id),
  resetPassword: (id: number) => API_ENDPOINTS.ADMIN.RESET_PASSWORD(id),
  deleteUser: (id: number) => API_ENDPOINTS.ADMIN.DELETE_USER(id),
  
  // Classes
  classeById: (id: number) => API_ENDPOINTS.CLASSES.BY_ID(id),
  updateClasse: (id: number) => API_ENDPOINTS.CLASSES.UPDATE(id),
  toggleClasseStatus: (id: number) => API_ENDPOINTS.CLASSES.TOGGLE_STATUS(id),
  deleteClasse: (id: number) => API_ENDPOINTS.CLASSES.DELETE(id),
  affecterEnseignantClasse: (id: number) => API_ENDPOINTS.CLASSES.AFFECTER_ENSEIGNANT(id),
  retirerEnseignantClasse: (classeId: number, enseignantId: number) => 
    API_ENDPOINTS.CLASSES.RETIRER_ENSEIGNANT(classeId, enseignantId),
  
  // Matières
  matiereById: (id: number) => API_ENDPOINTS.MATIERES.BY_ID(id),
  updateMatiere: (id: number) => API_ENDPOINTS.MATIERES.UPDATE(id),
  toggleMatiereStatus: (id: number) => API_ENDPOINTS.MATIERES.TOGGLE_STATUS(id),
  deleteMatiere: (id: number) => API_ENDPOINTS.MATIERES.DELETE(id),
  enseignantsDisponibles: (id: number) => API_ENDPOINTS.MATIERES.ENSEIGNANTS_DISPONIBLES(id),
  affecterEnseignantMatiere: (id: number) => API_ENDPOINTS.MATIERES.AFFECTER_ENSEIGNANT(id),
  retirerEnseignantMatiere: (matiereId: number, enseignantId: number) => 
    API_ENDPOINTS.MATIERES.RETIRER_ENSEIGNANT(matiereId, enseignantId),
    
  // Bulletins Admin
  bulletinEleve: (eleveId: number) => API_ENDPOINTS.ADMIN.BULLETINS.ELEVE(eleveId),
  bulletinClasse: (classeId: number) => API_ENDPOINTS.ADMIN.BULLETINS.CLASSE(classeId),
  telechargerBulletin: (id: number) => API_ENDPOINTS.ADMIN.BULLETINS.TELECHARGER(id),
  recalculerBulletin: (id: number) => API_ENDPOINTS.ADMIN.BULLETINS.RECALCULER(id),
  
  // Documents Admin
  validerDocument: (id: number) => API_ENDPOINTS.ADMIN.DOCUMENTS.VALIDER(id),
  refuserDocument: (id: number) => API_ENDPOINTS.ADMIN.DOCUMENTS.REFUSER(id),
  telechargerDocument: (id: number) => API_ENDPOINTS.ADMIN.DOCUMENTS.TELECHARGER(id),
  deleteDocument: (id: number) => API_ENDPOINTS.ADMIN.DOCUMENTS.DELETE(id),
  
  // Notes Enseignant
  notesClasseMatiere: (classeId: number, matiereId: number) => 
    API_ENDPOINTS.ENSEIGNANT.NOTES.NOTES_CLASSE_MATIERE(classeId, matiereId),
  modifierNote: (id: number) => API_ENDPOINTS.ENSEIGNANT.NOTES.MODIFIER(id),
  supprimerNote: (id: number) => API_ENDPOINTS.ENSEIGNANT.NOTES.SUPPRIMER(id),
  
  // Bulletins Élève
  bulletinEleveById: (id: number) => API_ENDPOINTS.ELEVE.BULLETINS.BY_ID(id),
  telechargerBulletinEleve: (id: number) => API_ENDPOINTS.ELEVE.BULLETINS.TELECHARGER(id),
  bulletinHistorique: (annee?: number) => API_ENDPOINTS.ELEVE.BULLETINS.HISTORIQUE(annee),
  comparaisonClasse: (id: number) => API_ENDPOINTS.ELEVE.BULLETINS.COMPARAISON_CLASSE(id),
  
  // Notes Élève
  notesMatiere: (matiereId: number) => API_ENDPOINTS.ELEVE.NOTES.MATIERE(matiereId),
  notesPeriode: (periode: string) => API_ENDPOINTS.ELEVE.NOTES.PERIODE(periode),
  
  // Documents Élève
  deleteDocumentEleve: (id: number) => API_ENDPOINTS.ELEVE.DOCUMENTS.DELETE(id)
} as const;