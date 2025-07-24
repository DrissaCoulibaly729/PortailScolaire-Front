export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
  active?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="flex" aria-label="Breadcrumb">
      <ol class="flex items-center space-x-2">
        <!-- Home -->
        <li>
          <div>
            <a [routerLink]="homeUrl" class="text-gray-400 hover:text-gray-500">
              <svg class="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
              </svg>
              <span class="sr-only">Accueil</span>
            </a>
          </div>
        </li>
        
        <!-- Breadcrumb Items -->
        <li *ngFor="let item of items; let last = last">
          <div class="flex items-center">
            <!-- Separator -->
            <svg class="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
            </svg>
            
            <!-- Item -->
            <div class="ml-2">
              <a *ngIf="item.url && !last; else textItem"
                 [routerLink]="item.url"
                 class="text-sm font-medium text-gray-500 hover:text-gray-700">
                <span class="flex items-center">
                  <svg *ngIf="item.icon" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.icon"></path>
                  </svg>
                  {{ item.label }}
                </span>
              </a>
              
              <ng-template #textItem>
                <span class="text-sm font-medium" 
                      [class.text-gray-900]="last"
                      [class.text-gray-500]="!last">
                  <span class="flex items-center">
                    <svg *ngIf="item.icon" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.icon"></path>
                    </svg>
                    {{ item.label }}
                  </span>
                </span>
              </ng-template>
            </div>
          </div>
        </li>
      </ol>
    </nav>
  `
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() homeUrl: string = '/';
}

// ===== Toast Notification Component =====
export interface ToastData {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" 
         [class]="toastClass"
         class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto overflow-hidden">
      <div class="p-4">
        <div class="flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <svg class="h-6 w-6" [class]="iconColorClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path *ngIf="data.type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              <path *ngIf="data.type === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              <path *ngIf="data.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
              <path *ngIf="data.type === 'info'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          
          <!-- Content -->
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">{{ data.title }}</p>
            <p *ngIf="data.message" class="mt-1 text-sm text-gray-500">{{ data.message }}</p>
          </div>
          
          <!-- Close Button -->
          <div *ngIf="data.dismissible !== false" class="ml-4 flex-shrink-0 flex">
            <button (click)="dismiss()" 
                    class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <span class="sr-only">Fermer</span>
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div *ngIf="showProgress" class="h-1 bg-gray-200">
        <div [class]="progressBarClass" 
             [style.width.%]="progress"
             class="h-full transition-all duration-100"></div>
      </div>
    </div>
  `
})
export class ToastComponent {
  @Input() data: ToastData = {
    type: 'info',
    title: 'Notification'
  };
  
  @Output() dismissed = new EventEmitter<void>();

  isVisible = true;
  showProgress = false;
  progress = 100;
  private timer?: any;
  private progressTimer?: any;

  ngOnInit(): void {
    if (this.data.duration && this.data.duration > 0) {
      this.showProgress = true;
      this.startProgressTimer();
      this.startDismissTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  get toastClass(): string {
    const borderClasses = {
      success: 'border-l-4 border-green-400',
      error: 'border-l-4 border-red-400',
      warning: 'border-l-4 border-yellow-400',
      info: 'border-l-4 border-blue-400'
    };

    return borderClasses[this.data.type];
  }

  get iconColorClass(): string {
    const colorClasses = {
      success: 'text-green-400',
      error: 'text-red-400',
      warning: 'text-yellow-400',
      info: 'text-blue-400'
    };

    return colorClasses[this.data.type];
  }

  get progressBarClass(): string {
    const bgClasses = {
      success: 'bg-green-400',
      error: 'bg-red-400',
      warning: 'bg-yellow-400',
      info: 'bg-blue-400'
    };

    return bgClasses[this.data.type];
  }

  private startDismissTimer(): void {
    this.timer = setTimeout(() => {
      this.dismiss();
    }, this.data.duration);
  }

  private startProgressTimer(): void {
    const interval = (this.data.duration || 5000) / 100;
    this.progressTimer = setInterval(() => {
      this.progress -= 1;
      if (this.progress <= 0) {
        this.clearTimers();
      }
    }, interval);
  }

  private clearTimers(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = undefined;
    }
  }

  dismiss(): void {
    this.clearTimers();
    this.isVisible = false;
    this.dismissed.emit();
  }
}

// ===== Export all components =====
export const SHARED_COMPONENTS = [
  LoadingSpinnerComponent,
  ConfirmationDialogComponent,
  BreadcrumbComponent,
  ToastComponent
] as const;