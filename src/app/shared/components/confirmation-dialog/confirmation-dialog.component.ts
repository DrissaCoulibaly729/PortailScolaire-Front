import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ConfirmationData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  icon?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
           (click)="onCancel()"></div>
      
      <!-- Dialog -->
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          <!-- Header -->
          <div class="p-6 pb-4">
            <div class="flex items-center">
              <!-- Icon -->
              <div [class]="iconContainerClass">
                <svg class="w-6 h-6" [class]="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path *ngIf="data.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  <path *ngIf="data.type === 'danger'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  <path *ngIf="data.type === 'info'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  <path *ngIf="data.type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  <path *ngIf="!data.type" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              
              <!-- Title and Message -->
              <div class="ml-4 flex-1">
                <h3 class="text-lg font-medium text-gray-900">{{ data.title }}</h3>
                <p class="mt-2 text-sm text-gray-600">{{ data.message }}</p>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            <button type="button" 
                    (click)="onCancel()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {{ data.cancelText || 'Annuler' }}
            </button>
            <button type="button" 
                    (click)="onConfirm()"
                    [class]="confirmButtonClass">
              {{ data.confirmText || 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() data: ConfirmationData = {
    title: 'Confirmation',
    message: 'Êtes-vous sûr ?'
  };
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get iconContainerClass(): string {
    const typeClasses = {
      warning: 'bg-yellow-100',
      danger: 'bg-red-100',
      info: 'bg-blue-100',
      success: 'bg-green-100'
    };
    
    const baseClass = 'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full';
    const typeClass = typeClasses[this.data.type || 'info'];
    
    return `${baseClass} ${typeClass}`;
  }

  get iconColorClass(): string {
    const typeClasses = {
      warning: 'text-yellow-600',
      danger: 'text-red-600',
      info: 'text-blue-600',
      success: 'text-green-600'
    };
    
    return typeClasses[this.data.type || 'info'];
  }

  get confirmButtonClass(): string {
    const typeClasses = {
      warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    };
    
    const baseClass = 'px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
    const typeClass = typeClasses[this.data.type || 'info'];
    
    return `${baseClass} ${typeClass}`;
  }

  onConfirm(): void {
    this.confirm.emit();
    this.isOpen = false;
  }

  onCancel(): void {
    this.cancel.emit();
    this.isOpen = false;
  }
}