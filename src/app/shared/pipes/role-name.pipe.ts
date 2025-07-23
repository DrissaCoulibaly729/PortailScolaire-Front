import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleName',
  standalone: true
})
export class RoleNamePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
