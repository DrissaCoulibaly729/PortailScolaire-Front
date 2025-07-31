
export const environment = {
  production: false,

  //apiUrl: 'https://portailscolaire.gestion-stock-boutique.com/api', // 🔧 MODIFIEZ CETTE URL
  apiUrl: 'http://localhost:8000/api', // URL de développement
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
