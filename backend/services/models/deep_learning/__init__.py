"""deep_learning/__init__.py — exports all DL model classes"""
from .mlp_model import MLPModel
from .cnn_model import CNNModel
from .rnn_models import LSTMModel, GRUModel
from .transformer_model import TransformerModel

DEEP_LEARNING_MODELS = [MLPModel, CNNModel, LSTMModel, GRUModel, TransformerModel]
