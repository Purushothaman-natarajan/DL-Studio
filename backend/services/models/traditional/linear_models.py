"""
Linear Models: LinearRegression, Ridge, Lasso, ElasticNet
Suited for: simple/interpretable regression on structured/tabular data.
"""
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet

MODEL_FAMILY = "Linear"

class LinearRegressionModel:
    MODEL_ID = "linear_regression"
    DISPLAY_NAME = "Linear Regression"
    DESCRIPTION = "Baseline model. Fits a straight line (hyperplane) minimizing MSE. Best for linearly separable data."
    SUPPORTS_MULTI_OUTPUT = True

    @staticmethod
    def get_model(**kwargs):
        return LinearRegression(**kwargs)


class RidgeModel:
    MODEL_ID = "ridge"
    DISPLAY_NAME = "Ridge Regression (L2)"
    DESCRIPTION = "Linear regression with L2 regularization. Penalizes large coefficients to reduce overfitting. Use when features are correlated."
    SUPPORTS_MULTI_OUTPUT = True

    @staticmethod
    def get_model(alpha=1.0, **kwargs):
        return Ridge(alpha=alpha, **kwargs)


class LassoModel:
    MODEL_ID = "lasso"
    DISPLAY_NAME = "Lasso Regression (L1)"
    DESCRIPTION = "Linear regression with L1 regularization. Can shrink some coefficients to zero, performing automatic feature selection."
    SUPPORTS_MULTI_OUTPUT = False  # Needs MultiOutputRegressor for multi-target

    @staticmethod
    def get_model(alpha=0.1, **kwargs):
        return Lasso(alpha=alpha, **kwargs)


class ElasticNetModel:
    MODEL_ID = "elastic_net"
    DISPLAY_NAME = "ElasticNet (L1+L2)"
    DESCRIPTION = "Combines L1 and L2 regularization. Balances feature selection (Lasso) and coefficient stability (Ridge)."
    SUPPORTS_MULTI_OUTPUT = False  # Needs MultiOutputRegressor for multi-target

    @staticmethod
    def get_model(alpha=0.1, l1_ratio=0.5, **kwargs):
        return ElasticNet(alpha=alpha, l1_ratio=l1_ratio, **kwargs)
