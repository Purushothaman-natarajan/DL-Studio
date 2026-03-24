import pandas as pd
import numpy as np

class DatasetAnalyzer:
    """Service to provide detailed insights and previews for uploaded datasets."""
    
    @staticmethod
    def get_detailed_insights(df: pd.DataFrame) -> dict:
        """Analyzes the DataFrame and returns a dictionary of insights."""
        
        # 1. Basic Shape
        rows, cols = df.shape
        
        # 2. Memory Usage
        memory_usage_bytes = df.memory_usage(deep=True).sum()
        memory_usage_mb = round(memory_usage_bytes / (1024 * 1024), 2)
        
        # 3. Column Insights
        column_insights = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            nunique = df[col].nunique()
            null_count = int(df[col].isnull().sum())
            
            insight = {
                "name": col,
                "type": dtype,
                "unique": nunique,
                "nulls": null_count
            }
            
            # Numeric stats if applicable
            if np.issubdtype(df[col].dtype, np.number):
                insight["min"] = float(df[col].min())
                insight["max"] = float(df[col].max())
                insight["mean"] = float(df[col].mean())
            
            column_insights.append(insight)
            
        # 4. Data Preview (First 10 rows)
        preview_data = df.head(10).replace({np.nan: None}).to_dict(orient="records")
        
        return {
            "shape": {"rows": rows, "cols": cols},
            "memory": f"{memory_usage_mb} MB",
            "column_count": cols,
            "row_count": rows,
            "columns": column_insights,
            "preview": preview_data
        }
