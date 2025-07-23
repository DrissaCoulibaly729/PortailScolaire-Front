
export const environment = {
  production: false,
  // ⚠️ IMPORTANT : Remplacez par l'URL de votre API Laravel
  // Exemples d'URLs possibles :
  // - Si votre API Laravel est sur localhost:8000 : 'http://localhost:8000/api'
  // - Si votre API Laravel est sur un autre port : 'http://localhost:8080/api'
  // - Si votre API est sur un serveur distant : 'https://votre-serveur.com/api'
  apiUrl: 'http://localhost:8000/api', // 🔧 MODIFIEZ CETTE URL
  
  appName: 'Portail Administratif Scolaire',
  version: '1.0.0',
  
  // Configuration JWT
  jwt: {
    tokenKey: 'portail_scolaire_token',
    refreshTokenKey: 'portail_scolaire_refresh_token',
    expirationTime: 3600000, // 1 heure en millisecondes
  },
  
  // Configuration des timeouts
  timeouts: {
    default: 30000, // 30 secondes
    upload: 120000, // 2 minutes pour les uploads
  },
  
  // Configuration de pagination
  pagination: {
    defaultPageSize: 15,
    maxPageSize: 100,
  },
  
  // URLs externes
  externalUrls: {
    documentation: 'https://docs.portail-scolaire.com',
    support: 'mailto:support@portail-scolaire.com',
  },
  
  // Features flags
  features: {
    notifications: true,
    darkMode: true,
    exportPdf: true,
    bulkOperations: true,
  }
};

// ===== src/environments/environment.prod.ts (PRODUCTION) =====
export const environment_prod = {
  production: true,
  // 🔧 URL de production de votre API
  apiUrl: 'https://api.portail-scolaire.com/api',
  
  appName: 'Portail Administratif Scolaire',
  version: '1.0.0',
  
  // Configuration JWT
  jwt: {
    tokenKey: 'portail_scolaire_token',
    refreshTokenKey: 'portail_scolaire_refresh_token',
    expirationTime: 3600000,
  },
  
  // Configuration des timeouts (plus longs en production)
  timeouts: {
    default: 45000,
    upload: 180000,
  },
  
  // Configuration de pagination
  pagination: {
    defaultPageSize: 15,
    maxPageSize: 100,
  },
  
  // URLs externes
  externalUrls: {
    documentation: 'https://docs.portail-scolaire.com',
    support: 'mailto:support@portail-scolaire.com',
  },
  
  // Features flags
  features: {
    notifications: true,
    darkMode: true,
    exportPdf: true,
    bulkOperations: true,
  }
};
