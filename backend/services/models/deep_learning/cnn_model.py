"""
1-D Convolutional Neural Network for tabular regression.
Suited for: datasets where features have local correlations (e.g., sensor arrays,
spectral data, adjacent time steps treated as a 1-D signal).
"""
import tensorflow as tf

MODEL_FAMILY = "DeepLearning"


class CNNModel:
    MODEL_ID = "cnn"
    DISPLAY_NAME = "CNN (1-D Convolutional)"
    DESCRIPTION = (
        "1-D convolutional network that treats feature vectors as a 1-D signal. "
        "Learns local feature interactions via sliding filters. "
        "Useful for spectral, sensor, or ordered tabular data."
    )
    FRAMEWORK = "tensorflow"

    @staticmethod
    def build(
        input_dim: int,
        output_dim: int,
        filters: int = 64,
        kernel_size: int = 3,
        num_conv_layers: int = 2,
        dense_units: int = 64,
        dropout: float = 0.2,
        optimizer: str = "adam",
        loss: str = "mse",
    ) -> tf.keras.Model:
        """
        Build a 1-D CNN regressor.

        The feature vector is reshaped to (input_dim, 1) to apply Conv1D.
        Followed by Global Average Pooling and a Dense regression head.
        """
        inputs = tf.keras.Input(shape=(input_dim,), name="feature_input")
        x = tf.keras.layers.Reshape((input_dim, 1))(inputs)  # (batch, features, 1)

        for i in range(num_conv_layers):
            x = tf.keras.layers.Conv1D(
                filters=filters * (i + 1),
                kernel_size=min(kernel_size, input_dim),
                activation="relu",
                padding="same",
                name=f"conv1d_{i+1}"
            )(x)
            x = tf.keras.layers.BatchNormalization()(x)

        x = tf.keras.layers.GlobalAveragePooling1D(name="gap")(x)
        x = tf.keras.layers.Dense(dense_units, activation="relu")(x)
        if dropout > 0:
            x = tf.keras.layers.Dropout(dropout)(x)

        outputs = tf.keras.layers.Dense(output_dim, activation="linear", name="regression_output")(x)

        model = tf.keras.Model(inputs=inputs, outputs=outputs, name="CNN_Regressor")
        model.compile(optimizer=optimizer, loss=loss, metrics=["mae", "mse"])
        return model
