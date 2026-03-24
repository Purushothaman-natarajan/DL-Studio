"""
Tree-Based Models: DecisionTree, RandomForest, AdaBoost
Suited for: non-linear relationships in structured data.
"""
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, AdaBoostRegressor

MODEL_FAMILY = "Tree"


class DecisionTreeModel:
    MODEL_ID = "decision_tree"
    DISPLAY_NAME = "Decision Tree"
    DESCRIPTION = "Recursively splits data on feature thresholds. Highly interpretable but prone to overfitting. Use max_depth to constrain."
    SUPPORTS_MULTI_OUTPUT = True

    @staticmethod
    def get_model(max_depth=None, random_state=42, **kwargs):
        return DecisionTreeRegressor(max_depth=max_depth, random_state=random_state, **kwargs)


class RandomForestModel:
    MODEL_ID = "random_forest"
    DISPLAY_NAME = "Random Forest"
    DESCRIPTION = "Ensemble of decision trees trained on random subsets of data/features. Robust to noise, excellent out-of-the-box performance."
    SUPPORTS_MULTI_OUTPUT = True

    @staticmethod
    def get_model(n_estimators=100, max_depth=None, random_state=42, n_jobs=-1, **kwargs):
        return RandomForestRegressor(
            n_estimators=n_estimators, max_depth=max_depth, 
            random_state=random_state, n_jobs=n_jobs, **kwargs
        )


class AdaBoostModel:
    MODEL_ID = "adaboost"
    DISPLAY_NAME = "AdaBoost"
    DESCRIPTION = "Sequential ensemble that trains weak learners focusing on previous errors. Effective on medium-sized datasets."
    SUPPORTS_MULTI_OUTPUT = False  # Needs MultiOutputRegressor for multi-target

    @staticmethod
    def get_model(n_estimators=50, learning_rate=1.0, random_state=42, **kwargs):
        return AdaBoostRegressor(
            n_estimators=n_estimators, learning_rate=learning_rate,
            random_state=random_state, **kwargs
        )
