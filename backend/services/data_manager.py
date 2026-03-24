import pandas as pd
import numpy as np
import io
import datetime
import os
from scipy import stats
from core.config import RAW_DIR, CLEANED_DIR
from core.logger import logger

class DataManager:
    """Manages file I/O, EDA, and preprocessing/cleaning logic."""
    
    @staticmethod
    async def load_file(file_obj, filename: str) -> pd.DataFrame:
        """Loads a CSV or Excel file into a DataFrame."""
        contents = await file_obj.read()
        
        # Save raw backup first
        raw_path = RAW_DIR / f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
        with open(raw_path, "wb") as f:
            f.write(contents)
        
        # Load from buffer
        if filename.endswith('.csv'):
            return pd.read_csv(io.BytesIO(contents))
        else:
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
                matched.append(req)  # Keep requested if not found
                
        return matched

    @staticmethod
    def clean_data(df: pd.DataFrame, config: dict) -> pd.DataFrame:
        """Standard cleaning logic: imputation and outliers."""
        strategy = config.get('strategy', 'drop')
        
        # 1. Imputation
        if strategy == 'mean':
            df = df.fillna(df.mean(numeric_only=True))
        elif strategy == 'median':
            df = df.fillna(df.median(numeric_only=True))
        elif strategy == 'zero':
            df = df.fillna(0)
        else:
            df = df.dropna()
            
        # 2. Outliers
        if config.get('drop_outliers', False):
            num_cols = df.select_dtypes(include=[np.number]).columns
            if len(num_cols) > 0:
                # Need to handle NaNs before zscore
                temp_df = df[num_cols].fillna(df[num_cols].median())
                z_scores = np.abs(stats.zscore(temp_df))
                # Only drop if ANY num column is an outlier
                mask = (z_scores < config.get('z_threshold', 3.0)).all(axis=1)
                df = df[mask]
        
        return df

    @staticmethod
    def save_cleaned(df: pd.DataFrame, original_filename: str) -> str:
        """Saves a cleaned DataFrame to the cleaned subfolder."""
        run_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        save_name = f"cleaned_{run_id}_{original_filename}"
        save_path = CLEANED_DIR / save_name
        
        if original_filename.endswith('.csv'):
            df.to_csv(save_path, index=False)
        else:
            df.to_excel(save_path, index=False)
            
        return save_name

    @staticmethod
    def get_eda_stats(df: pd.DataFrame) -> dict:
        """Extracts standard stats/missing info for EDA JSON responses."""
        df_desc = df.describe().replace({np.nan: None})
        return {
            "columns": df.columns.tolist(),
            "stats": df_desc.to_dict(),
            "missing": df.isnull().sum().to_dict(),
            "rows": len(df)
        }
