import io

import numpy as np
import pandas as pd
from scipy import stats

class DataManager:
    """Manages file I/O, EDA, and preprocessing/cleaning logic."""

    @staticmethod
    async def load_file(file_obj, filename: str) -> pd.DataFrame:
        """Loads a CSV or Excel file into a DataFrame."""
        contents = await file_obj.read()

        if filename.endswith(".csv"):
            return pd.read_csv(io.BytesIO(contents))
        return pd.read_excel(io.BytesIO(contents))

    @staticmethod
    def fuzzy_match_columns(df: pd.DataFrame, requested: list) -> list:
        """Fuzzily matches requested column names with the actual columns in the dataframe."""
        actual_cols = df.columns.tolist()
        matched = []

        for req in requested:
            found = False
            for real in actual_cols:
                if real.strip() == req.strip():
                    matched.append(real)
                    found = True
                    break
            if not found:
                matched.append(req)

        return matched

    @staticmethod
    def clean_data(df: pd.DataFrame, config: dict) -> pd.DataFrame:
        """Standard cleaning logic: imputation and optional outlier removal."""
        strategy = config.get("strategy", "drop")

        if strategy == "mean":
            df = df.fillna(df.mean(numeric_only=True))
        elif strategy == "median":
            df = df.fillna(df.median(numeric_only=True))
        elif strategy == "zero":
            df = df.fillna(0)
        else:
            df = df.dropna()

        if config.get("drop_outliers", False):
            num_cols = df.select_dtypes(include=[np.number]).columns
            if len(num_cols) > 0:
                temp_df = df[num_cols].fillna(df[num_cols].median())
                z_scores = np.abs(stats.zscore(temp_df))
                mask = (z_scores < config.get("z_threshold", 3.0)).all(axis=1)
                df = df[mask]

        # Optional UI-level normalization; training pipeline still applies feature scaling.
        if config.get("standardize_numeric", False):
            num_cols = df.select_dtypes(include=[np.number]).columns
            if len(num_cols) > 0:
                means = df[num_cols].mean()
                stds = df[num_cols].std().replace(0, 1)
                df[num_cols] = (df[num_cols] - means) / stds

        return df

    @staticmethod
    def get_eda_stats(df: pd.DataFrame) -> dict:
        """Extracts standard stats/missing info for EDA JSON responses."""
        df_desc = df.describe().replace({np.nan: None})
        return {
            "columns": df.columns.tolist(),
            "stats": df_desc.to_dict(),
            "missing": df.isnull().sum().to_dict(),
            "rows": len(df),
        }
