export interface ApiResponse<T = any> {
  message: string;
  statut: 'succes' | 'erreur';
  data?: T;
  erreurs?: Record<string, string[]>;
}
