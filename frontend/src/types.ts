export interface LayerConfig {
  id: string;
  type: 'dense' | 'dropout';
  units?: number;
  activation?: 'relu' | 'sigmoid' | 'softmax' | 'tanh';
  rate?: number; // for dropout
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: 'adam' | 'sgd' | 'rmsprop' | 'adamw';
  loss: 'meanSquaredError' | 'categoricalCrossentropy' | 'binaryCrossentropy';
  earlyStopping: boolean;
  patience: number;
  checkpointInterval: number;
  saveBestOnly: boolean;
  validationSplit: number;
  modelType?: string; // e.g. 'xgboost', 'mlp', 'lstm', 'transformer'
  plotColor?: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  sensitivity: number;
}

export interface XAIResult {
  featureImportance: FeatureImportance[];
  sensitivityData: {
    feature: string;
    points: { x: number; y: number }[];
  }[];
  correlationMatrix: {
    x: string;
    y: string;
    value: number;
  }[];
  residuals: {
    actual: number;
    predicted: number;
    residual: number;
  }[];
  comparison?: ComparisonMetric[];
  run_id?: string;
}

export interface ComparisonMetric {
  model: string;
  r2: number;
  mae: number;
  mse: number;
}

export interface DataColumn {
  name: string;
  type: 'numeric' | 'categorical';
  role: 'feature' | 'target' | 'ignore';
}

export interface TrainingHistory {
  epoch: number;
  loss: number;
  accuracy?: number;
}
