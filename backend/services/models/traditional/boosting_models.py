"""
Gradient Boosting Models: XGBoost, LightGBM, CatBoost, GradientBoosting (sklearn)
These are the current state-of-the-art for structured/tabular regression data.
"""
import logging

from sklearn.ensemble import GradientBoostingRegressor

logger = logging.getLogger(__name__)

MODEL_FAMILY = "Boosting"


class GradientBoostingModel:
    MODEL_ID = "gradient_boosting"
    DISPLAY_NAME = "Gradient Boosting (sklearn)"
    DESCRIPTION = "Sequential tree boosting. Each tree corrects the residual errors of the previous ensemble. Strong baseline for tabular data."
    SUPPORTS_MULTI_OUTPUT = False  # Use MultiOutputRegressor wrapper for multi-target regression

    @staticmethod
    def get_model(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42, **kwargs):
        return GradientBoostingRegressor(
            n_estimators=n_estimators, learning_rate=learning_rate,
            max_depth=max_depth, random_state=random_state, **kwargs
        )


class XGBoostModel:
    MODEL_ID = "xgboost"
    DISPLAY_NAME = "XGBoost"
    DESCRIPTION = "Extreme Gradient Boosting. Highly optimized, regularized GBDT with parallel tree construction. Industry standard for tabular tasks."
    SUPPORTS_MULTI_OUTPUT = True  # XGBoost natively supports multi-output

    @staticmethod
    def get_model(n_estimators=100, learning_rate=0.1, max_depth=6, random_state=42, **kwargs):
        try:
            import xgboost as xgb
            return xgb.XGBRegressor(
                n_estimators=n_estimators, learning_rate=learning_rate,
                max_depth=max_depth, random_state=random_state,
                objective='reg:squarederror', tree_method='hist', **kwargs
            )
        except ImportError:
            logger.warning("XGBoost not installed. Falling back to GradientBoosting.")
            return GradientBoostingRegressor(n_estimators=n_estimators, random_state=random_state)


class LightGBMModel:
    MODEL_ID = "lightgbm"
    DISPLAY_NAME = "LightGBM"
    DESCRIPTION = "Light Gradient Boosting Machine. Faster than XGBoost using leaf-wise tree growth. Excellent for large datasets."
    SUPPORTS_MULTI_OUTPUT = False  # Use MultiOutputRegressor wrapper for multi-target regression

    @staticmethod
    def get_model(n_estimators=100, learning_rate=0.1, num_leaves=31, random_state=42, **kwargs):
        try:
            import lightgbm as lgb
            return lgb.LGBMRegressor(
                n_estimators=n_estimators, learning_rate=learning_rate,
                num_leaves=num_leaves, random_state=random_state,
                verbosity=-1, **kwargs
            )
        except ImportError:
            logger.warning("LightGBM not installed. Falling back to XGBoostModel.")
            return XGBoostModel.get_model(n_estimators=n_estimators, random_state=random_state)


class CatBoostModel:
    MODEL_ID = "catboost"
    DISPLAY_NAME = "CatBoost"
    DESCRIPTION = "Gradient boosting with native categorical feature handling. Requires minimal preprocessing and reduces overfitting via ordered boosting."
    SUPPORTS_MULTI_OUTPUT = False  # Use MultiOutputRegressor wrapper for multi-target regression

    @staticmethod
    def get_model(iterations=100, learning_rate=0.1, depth=6, random_state=42, **kwargs):
        try:
            from catboost import CatBoostRegressor
            return CatBoostRegressor(
                iterations=iterations, learning_rate=learning_rate,
                depth=depth, random_seed=random_state, 
                verbose=0, **kwargs
            )
        except ImportError:
            logger.warning("CatBoost not installed. Falling back to LightGBM.")
            return LightGBMModel.get_model(n_estimators=iterations, random_state=random_state)
