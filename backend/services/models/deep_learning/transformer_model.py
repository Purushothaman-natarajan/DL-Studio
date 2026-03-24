"""
Transformer with regression head for tabular / sequential regression.
Suited for: complex, high-dimensional data where global feature interactions
matter (not just local). Uses multi-head self-attention.

Architecture:
  Input features → Embedding (feature tokenization) → N × TransformerBlock
  → Global Average Pooling → Dense regression head
"""
import tensorflow as tf

MODEL_FAMILY = "DeepLearning"


class TransformerBlock(tf.keras.layers.Layer):
    """Single Transformer encoder block: Multi-Head Attention + FFN + LayerNorm."""

    def __init__(self, embed_dim: int, num_heads: int, ff_dim: int, dropout: float = 0.1, **kwargs):
        super().__init__(**kwargs)
        self.att = tf.keras.layers.MultiHeadAttention(num_heads=num_heads, key_dim=embed_dim // num_heads)
        self.ffn = tf.keras.Sequential([
            tf.keras.layers.Dense(ff_dim, activation="relu"),
            tf.keras.layers.Dense(embed_dim),
        ])
        self.norm1 = tf.keras.layers.LayerNormalization(epsilon=1e-6)
        self.norm2 = tf.keras.layers.LayerNormalization(epsilon=1e-6)
        self.drop1 = tf.keras.layers.Dropout(dropout)
        self.drop2 = tf.keras.layers.Dropout(dropout)

    def call(self, inputs, training=False):
        attn_out = self.att(inputs, inputs, training=training)
        attn_out = self.drop1(attn_out, training=training)
        out1 = self.norm1(inputs + attn_out)
        ffn_out = self.ffn(out1)
        ffn_out = self.drop2(ffn_out, training=training)
        return self.norm2(out1 + ffn_out)


class TransformerModel:
    MODEL_ID = "transformer"
    DISPLAY_NAME = "Transformer (Regression Head)"
    DESCRIPTION = (
        "Each feature is treated as a 'token'. Multi-head self-attention learns global "
        "pairwise feature interactions. State-of-the-art for complex tabular/sequential regression."
    )
    FRAMEWORK = "tensorflow"

    @staticmethod
    def build(
        input_dim: int,
        output_dim: int,
        embed_dim: int = 32,
        num_heads: int = 4,
        ff_dim: int = 64,
        num_transformer_blocks: int = 2,
        mlp_units: list = None,
        dropout: float = 0.1,
        optimizer: str = "adam",
        loss: str = "mse",
    ) -> tf.keras.Model:
        """
        Build a Transformer regressor.

        Each scalar feature is projected to `embed_dim` dimensions (feature tokenization),
        creating a sequence of length `input_dim` with embedding dimension `embed_dim`.
        """
        if mlp_units is None:
            mlp_units = [64, 32]

        inputs = tf.keras.Input(shape=(input_dim,), name="feature_input")

        # Feature Tokenization: project each feature to embed_dim
        # Reshape: (batch, input_dim) → (batch, input_dim, 1) → linear projection
        x = tf.keras.layers.Reshape((input_dim, 1))(inputs)
        x = tf.keras.layers.Dense(embed_dim, name="feature_embedding")(x)
        # x shape: (batch, input_dim, embed_dim)

        for i in range(num_transformer_blocks):
            x = TransformerBlock(
                embed_dim=embed_dim,
                num_heads=num_heads,
                ff_dim=ff_dim,
                dropout=dropout,
                name=f"transformer_block_{i+1}"
            )(x)

        x = tf.keras.layers.GlobalAveragePooling1D(name="gap")(x)

        for units in mlp_units:
            x = tf.keras.layers.Dense(units, activation="relu")(x)
            x = tf.keras.layers.Dropout(dropout)(x)

        outputs = tf.keras.layers.Dense(output_dim, activation="linear", name="regression_output")(x)

        model = tf.keras.Model(inputs=inputs, outputs=outputs, name="Transformer_Regressor")
        model.compile(optimizer=optimizer, loss=loss, metrics=["mae", "mse"])
        return model
