export interface PaginationResult<T> {
  /** Les éléments de la page actuelle */
  data: T[];

  /** Numéro de la page actuelle */
  page: number;

  /** Nombre d’éléments par page */
  limit: number;

  /** Nombre total d’éléments correspondant au filtre */
  total: number;

  /** Nombre total de pages */
  totalPages: number;

  /** Indique s’il y a une page suivante */
  hasNext: boolean;

  /** Indique s’il y a une page précédente */
  hasPrev?: boolean;
}
