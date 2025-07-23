import { CanActivateFn } from '@angular/router';

export const eleveGuard: CanActivateFn = (route, state) => {
  return true;
};
