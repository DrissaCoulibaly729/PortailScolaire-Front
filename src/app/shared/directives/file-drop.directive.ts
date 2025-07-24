import { Directive, EventEmitter, HostListener, Output, Input } from '@angular/core';

@Directive({
  selector: '[appFileDrop]',
  standalone: true
})
export class FileDropDirective {
  @Output() filesDropped = new EventEmitter<FileList>();
  @Output() filesHovered = new EventEmitter<boolean>();
  @Input() allowedTypes: string[] = [];
  @Input() maxFileSize: number = 5 * 1024 * 1024; // 5MB

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.filesHovered.emit(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.filesHovered.emit(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.filesHovered.emit(false);

    const files = event.dataTransfer?.files;
    if (files && this.validateFiles(files)) {
      this.filesDropped.emit(files);
    }
  }

  private validateFiles(files: FileList): boolean {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Vérifier la taille
      if (file.size > this.maxFileSize) {
        alert(`Le fichier ${file.name} dépasse la taille maximale autorisée.`);
        return false;
      }
      
      // Vérifier le type
      if (this.allowedTypes.length > 0 && !this.allowedTypes.includes(file.type)) {
        alert(`Le type de fichier ${file.type} n'est pas autorisé.`);
        return false;
      }
    }
    
    return true;
  }
}