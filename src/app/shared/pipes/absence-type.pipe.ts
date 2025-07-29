import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'absenceType',
  standalone: true
})
export class AbsenceTypePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
