# DL-Studio Model Registry
# Each model family is defined in its own module.
# All models expose a `get_model()` factory function and a `MODEL_ID` constant.

from .traditional.linear_models import LinearRegressionModel, RidgeModel, LassoModel, ElasticNetModel
from .traditional.tree_models import DecisionTreeModel, RandomForestModel, AdaBoostModel
from .traditional.boosting_models import XGBoostModel, LightGBMModel, CatBoostModel, GradientBoostingModel
from .traditional.svm_models import SVRModel
from .traditional.knn_models import KNNModel
from .deep_learning.mlp_model import MLPModel
from .deep_learning.cnn_model import CNNModel
from .deep_learning.rnn_models import LSTMModel, GRUModel
from .deep_learning.transformer_model import TransformerModel

__all__ = [
    # Traditional
    "LinearRegressionModel", "RidgeModel", "LassoModel", "ElasticNetModel",
    "DecisionTreeModel", "RandomForestModel", "AdaBoostModel",
    "XGBoostModel", "LightGBMModel", "CatBoostModel", "GradientBoostingModel",
    "SVRModel", "KNNModel",
    # Deep Learning
    "MLPModel", "CNNModel", "LSTMModel", "GRUModel", "TransformerModel"
]
