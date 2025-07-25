export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
}

export interface ApiResponse<T> {
  message: string;
  statut: 'succes' | 'erreur';
  data: T;
  erreurs?: { [key: string]: string[] };
}