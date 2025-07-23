import { CanActivateFn } from '@angular/router';

export const enseignantGuard: CanActivateFn = (route, state) => {
  return true;
};
