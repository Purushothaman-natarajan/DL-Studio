"""
Support Vector Regression (SVR)
Suited for: small-to-medium datasets, high-dimensional spaces, non-linear regression with kernel tricks.
"""
from sklearn.svm import SVR as _SVR

MODEL_FAMILY = "SVM"


class SVRModel:
    MODEL_ID = "svr"
    DISPLAY_NAME = "Support Vector Regression (SVR)"
    DESCRIPTION = (
        "Finds a tube around the regression line within which errors are tolerated (epsilon-insensitive). "
        "Kernel tricks (RBF, poly) allow powerful non-linear fitting. Scale features before use."
    )
    SUPPORTS_MULTI_OUTPUT = False  # Needs MultiOutputRegressor wrapper for multi-target

    @staticmethod
    def get_model(kernel='rbf', C=1.0, epsilon=0.1, gamma='scale', **kwargs):
        return _SVR(kernel=kernel, C=C, epsilon=epsilon, gamma=gamma, **kwargs)
