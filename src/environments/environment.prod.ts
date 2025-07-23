export const environment = {
  production: true,
  apiUrl: 'https://api.portail-scolaire.com/api', // URL de production
  appName: 'Portail Administratif Scolaire',
  version: '1.0.0',
  
  // Configuration JWT
  jwt: {
    tokenKey: 'portail_scolaire_token',
    refreshTokenKey: 'portail_scolaire_refresh_token',
    expirationTime: 3600000, // 1 heure
  },
  
  // Configuration des timeouts
  timeouts: {
    default: 30000,
    upload: 120000,
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
