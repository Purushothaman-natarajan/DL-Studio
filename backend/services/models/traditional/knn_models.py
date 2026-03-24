"""
K-Nearest Neighbors Regression
Suited for: low-dimensional data where locality matters; effective baseline for non-parametric regression.
"""
from sklearn.neighbors import KNeighborsRegressor as _KNNRegressor

MODEL_FAMILY = "Neighbors"


class KNNModel:
    MODEL_ID = "knn"
    DISPLAY_NAME = "K-Nearest Neighbors (KNN)"
    DESCRIPTION = (
        "Predicts by averaging the K closest training samples in feature space. "
        "Simple and effective for local patterns. Slow on large datasets; scale features before use."
    )
    SUPPORTS_MULTI_OUTPUT = True

    @staticmethod
    def get_model(n_neighbors=5, weights='uniform', algorithm='auto', n_jobs=-1, **kwargs):
        return _KNNRegressor(
            n_neighbors=n_neighbors, weights=weights,
            algorithm=algorithm, n_jobs=n_jobs, **kwargs
        )
