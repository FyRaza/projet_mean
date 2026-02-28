import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    size: number;
}

export interface MultipleUploadResponse {
    images: UploadResponse[];
}

export type ImageType = 'product' | 'logo' | 'banner';

@Injectable({ providedIn: 'root' })
export class UploadService {
    private http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/upload`;

    /**
     * Upload une seule image
     */
    uploadImage(file: File, type: ImageType = 'product'): Observable<UploadResponse> {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type);
        return this.http.post<UploadResponse>(this.API_URL, formData);
    }

    /**
     * Upload plusieurs images
     */
    uploadMultipleImages(files: File[], type: ImageType = 'product'): Observable<MultipleUploadResponse> {
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));
        formData.append('type', type);
        return this.http.post<MultipleUploadResponse>(`${this.API_URL}/multiple`, formData);
    }

    /**
     * Supprimer une image par son publicId
     */
    deleteImage(publicId: string): Observable<{ message: string; result: string }> {
        return this.http.delete<{ message: string; result: string }>(this.API_URL, {
            body: { publicId }
        });
    }
}

