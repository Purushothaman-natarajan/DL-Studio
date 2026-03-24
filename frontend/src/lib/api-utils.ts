import { LayerConfig, TrainingConfig } from '../types';

export const API_URL = 'http://localhost:8000';

export async function uploadEda(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/eda`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) throw new Error('EDA upload failed');
  return await response.json();
}

export async function cleanData(file: File | Blob, config: any) {
  const formData = new FormData();
  const filename = 'name' in file ? file.name : 'dataset.csv';
  formData.append('file', file, filename);
  formData.append('config', JSON.stringify(config));

  const response = await fetch(`${API_URL}/clean`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Data cleaning failed');
  return await response.json();
}

export async function trainModelBackend(
  file: File | Blob,
  features: string[],
  targets: string[],
  layers: LayerConfig[],
  trainingConfig: TrainingConfig
) {
  const formData = new FormData();
  
  // Safely extract the original filename so the backend parses Excel/CSV correctly
  const filename = 'name' in file ? file.name : 'dataset.csv';
  formData.append('file', file, filename);
  formData.append('config', JSON.stringify({
    features,
    targets,
    layers,
    trainingConfig
  }));

  const response = await fetch(`${API_URL}/train`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Training failed: ${text}`);
  }
  
  return await response.json();
}
