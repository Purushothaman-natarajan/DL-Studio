export interface LayerConfig {
  id: string;
  type: 'dense' | 'dropout';
  units?: number;
  activation?: 'relu' | 'sigmoid' | 'softmax' | 'tanh';
  rate?: number; // for dropout
}

export interface ModelHyperparams {
  [modelId: string]: {
    [paramId: string]: number | string;
  };
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
  modelType?: string; // e.g. 'xgboost', 'ann', 'lstm', 'transformer'
  plotColor?: string;
  customParams?: ModelHyperparams;
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
  valLoss?: number;
  trainLoss?: number;
  accuracy?: number;
  valAccuracy?: number;
  mae?: number;
  valMae?: number;
  r2?: number;
  valR2?: number;
}
