import * as tf from '@tensorflow/tfjs';
import { LayerConfig, TrainingConfig, XAIResult } from '../types';

export async function trainModel(
  data: any[],
  features: string[],
  targets: string[],
  layers: LayerConfig[],
  config: TrainingConfig,
  onEpochEnd: (epoch: number, logs: any) => void
) {
  // 1. Prepare Data
  const featureData = data.map(row => features.map(f => parseFloat(row[f]) || 0));
  const targetData = data.map(row => targets.map(t => parseFloat(row[t]) || 0));

  const xs = tf.tensor2d(featureData);
  const ys = tf.tensor2d(targetData);

  // 2. Build Model
  const model = tf.sequential();
  
  layers.forEach((layer, idx) => {
    if (idx === 0) {
      model.add(tf.layers.dense({
        units: layer.units || 32,
        activation: layer.activation,
        inputShape: [features.length]
      }));
    } else {
      model.add(tf.layers.dense({
        units: layer.units || 32,
        activation: layer.activation
      }));
    }
  });

  // Final output layer
  model.add(tf.layers.dense({
    units: targets.length,
    activation: targets.length > 1 ? 'softmax' : 'linear'
  }));

  // 3. Compile
  const optimizerMap = {
    adam: tf.train.adam(config.learningRate),
    sgd: tf.train.sgd(config.learningRate),
    rmsprop: tf.train.rmsprop(config.learningRate)
  };

  model.compile({
    optimizer: optimizerMap[config.optimizer],
    loss: config.loss,
    metrics: ['accuracy']
  });

  // 4. Callbacks
  const callbacks: tf.CustomCallbackArgs[] = [{
    onEpochEnd: (epoch, logs) => {
      onEpochEnd(epoch, logs);
    }
  }];

  if (config.earlyStopping) {
    callbacks.push(tf.callbacks.earlyStopping({
      monitor: 'loss',
      patience: config.patience,
      verbose: 1
    }));
  }

  // 5. Train
  await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    callbacks: callbacks as any
  });

  return model;
}

export async function calculateXAI(
  model: tf.LayersModel,
  data: any[],
  features: string[],
  targets: string[]
): Promise<XAIResult> {
  const featureImportance: XAIResult['featureImportance'] = [];
  const sensitivityData: XAIResult['sensitivityData'] = [];
  const correlationMatrix: XAIResult['correlationMatrix'] = [];
  const residuals: XAIResult['residuals'] = [];

  // 1. Sensitivity Analysis
  const baseInput = data.slice(0, 10).map(row => features.map(f => parseFloat(row[f]) || 0));
  const baseTensor = tf.tensor2d(baseInput);
  const basePrediction = model.predict(baseTensor) as tf.Tensor;
  const baseMean = basePrediction.mean().dataSync()[0];

  for (let i = 0; i < features.length; i++) {
    const featureName = features[i];
    
    // Importance
    const perturbedInput = baseInput.map(row => {
      const newRow = [...row];
      newRow[i] *= 1.1;
      return newRow;
    });
    
    const perturbedTensor = tf.tensor2d(perturbedInput);
    const perturbedPrediction = model.predict(perturbedTensor) as tf.Tensor;
    const perturbedMean = perturbedPrediction.mean().dataSync()[0];
    const importance = Math.abs(perturbedMean - baseMean);
    
    // Sensitivity Curve
    const values = data.map(row => parseFloat(row[featureName]) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / 20;
    
    const points: { x: number; y: number }[] = [];
    const sweepInput = [...baseInput[0]];
    
    for (let v = min; v <= max; v += step) {
      sweepInput[i] = v;
      const sweepTensor = tf.tensor2d([sweepInput]);
      const sweepPred = model.predict(sweepTensor) as tf.Tensor;
      points.push({ x: v, y: sweepPred.dataSync()[0] });
      sweepTensor.dispose();
      sweepPred.dispose();
    }

    featureImportance.push({
      feature: featureName,
      importance: importance,
      sensitivity: importance / (max - min || 1)
    });

    sensitivityData.push({
      feature: featureName,
      points
    });

    perturbedTensor.dispose();
    perturbedPrediction.dispose();
  }

  // 2. Correlation Matrix
  for (let i = 0; i < features.length; i++) {
    for (let j = 0; j < features.length; j++) {
      const f1 = features[i];
      const f2 = features[j];
      const v1 = data.map(row => parseFloat(row[f1]) || 0);
      const v2 = data.map(row => parseFloat(row[f2]) || 0);
      
      const mean1 = v1.reduce((a, b) => a + b, 0) / v1.length;
      const mean2 = v2.reduce((a, b) => a + b, 0) / v2.length;
      
      const num = v1.reduce((acc, val, idx) => acc + (val - mean1) * (v2[idx] - mean2), 0);
      const den = Math.sqrt(
        v1.reduce((acc, val) => acc + Math.pow(val - mean1, 2), 0) *
        v2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0)
      );
      
      correlationMatrix.push({
        x: f1,
        y: f2,
        value: den === 0 ? 0 : num / den
      });
    }
  }

  // 3. Residuals
  const testData = data.slice(0, 50);
  const testFeatures = testData.map(row => features.map(f => parseFloat(row[f]) || 0));
  const testTargets = testData.map(row => targets.map(t => parseFloat(row[t]) || 0));
  
  const testXs = tf.tensor2d(testFeatures);
  const testPreds = model.predict(testXs) as tf.Tensor;
  const predData = testPreds.dataSync();
  
  for (let i = 0; i < testData.length; i++) {
    const actual = testTargets[i][0];
    const predicted = predData[i];
    residuals.push({
      actual,
      predicted,
      residual: actual - predicted
    });
  }

  baseTensor.dispose();
  basePrediction.dispose();
  testXs.dispose();
  testPreds.dispose();

  const maxImp = Math.max(...featureImportance.map(f => f.importance));
  featureImportance.forEach(f => f.importance = (f.importance / (maxImp || 1)) * 100);

  return {
    featureImportance: featureImportance.sort((a, b) => b.importance - a.importance),
    sensitivityData,
    correlationMatrix,
    residuals
  };
}
