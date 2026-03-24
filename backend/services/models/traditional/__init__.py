"""traditional/__init__.py — exports all traditional ML model classes"""
from .linear_models import LinearRegressionModel, RidgeModel, LassoModel, ElasticNetModel
from .tree_models import DecisionTreeModel, RandomForestModel, AdaBoostModel
from .boosting_models import XGBoostModel, LightGBMModel, CatBoostModel, GradientBoostingModel
from .svm_models import SVRModel
from .knn_models import KNNModel

TRADITIONAL_MODELS = [
    LinearRegressionModel, RidgeModel, LassoModel, ElasticNetModel,
    DecisionTreeModel, RandomForestModel, AdaBoostModel,
    GradientBoostingModel, XGBoostModel, LightGBMModel, CatBoostModel,
    SVRModel, KNNModel,
]
