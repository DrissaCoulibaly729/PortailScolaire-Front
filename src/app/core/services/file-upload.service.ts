
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiService } from './api.service';

export interface FileUploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  file: File;
  url?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  
  // Taille maximale des fichiers (5MB)
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  
  // Types de fichiers acceptés
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];

  constructor(private apiService: ApiService) {}

  /**
   * Uploader un fichier avec progression
   */
  uploadFile(file: File, endpoint: string, additionalData?: any): Observable<FileUploadProgress> {
    return new Observable(observer => {
      // Validation du fichier
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        observer.error(new Error(validation.error));
        return;
      }

      // Créer FormData
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key]);
        });
      }

      // Créer XMLHttpRequest pour suivre la progression
      const xhr = new XMLHttpRequest();
      
      // Gérer la progression
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          observer.next({
            progress,
            status: 'uploading',
            file
          });
        }
      };

      // Gérer la réussite
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            observer.next({
              progress: 100,
              status: 'completed',
              file,
              url: response.data?.url || response.url
            });
            observer.complete();
          } catch (error) {
            observer.error(new Error('Réponse invalide du serveur'));
          }
        } else {
          observer.error(new Error(`Erreur HTTP: ${xhr.status}`));
        }
      };

      // Gérer les erreurs
      xhr.onerror = () => {
        observer.next({
          progress: 0,
          status: 'error',
          file,
          error: 'Erreur de connexion'
        });
        observer.error(new Error('Erreur de connexion'));
      };

      // Envoyer la requête
      xhr.open('POST', this.apiService.getFullUrl(endpoint));
      
      // Ajouter les headers d'authentification
      const token = localStorage.getItem('portail_scolaire_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);

      // Fonction de nettoyage
      return () => {
        xhr.abort();
      };
    });
  }

  /**
   * Uploader plusieurs fichiers
   */
  uploadMultipleFiles(files: File[], endpoint: string): Observable<FileUploadProgress[]> {
    return new Observable(observer => {
      const results: FileUploadProgress[] = [];
      let completedCount = 0;

      files.forEach((file, index) => {
        this.uploadFile(file, endpoint).subscribe({
          next: (progress) => {
            results[index] = progress;
            observer.next([...results]);
          },
          complete: () => {
            completedCount++;
            if (completedCount === files.length) {
              observer.complete();
            }
          },
          error: (error) => {
            results[index] = {
              progress: 0,
              status: 'error',
              file,
              error: error.message
            };
            observer.next([...results]);
            
            completedCount++;
            if (completedCount === files.length) {
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Valider un fichier
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Vérifier la taille
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Le fichier est trop volumineux. Taille maximale: ${this.formatFileSize(this.MAX_FILE_SIZE)}`
      };
    }

    // Vérifier le type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Type de fichier non autorisé. Formats acceptés: JPG, PNG, PDF'
      };
    }

    return { isValid: true };
  }

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtenir l'icône selon le type de fichier
   */
  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type === 'application/pdf') {
      return '📄';
    } else {
      return '📎';
    }
  }

  /**
   * Créer une URL de prévisualisation pour les images
   */
  createPreviewUrl(file: File): string | null {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  }

  /**
   * Supprimer une URL de prévisualisation
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Supprimer un fichier uploadé
   */
  deleteFile(fileUrl: string): Observable<any> {
    return this.apiService.delete(`/files/delete`, { params: { url: fileUrl } });
  }

  /**
   * Télécharger un fichier
   */
  downloadFile(fileUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Vérifier si un type de fichier est une image
   */
  isImage(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  /**
   * Vérifier si un type de fichier est un PDF
   */
  isPdf(fileType: string): boolean {
    return fileType === 'application/pdf';
  }

  /**
   * Compresser une image avant upload (pour les gros fichiers)
   */
  compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!this.isImage(file.type)) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Dessiner l'image redimensionnée
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir en blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Erreur lors de la compression'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = URL.createObjectURL(file);
    });
  }
}