"""
Multi-Layer Perceptron (MLP) — standard feed-forward neural network.
Suited for: large, complex tabular datasets where features have non-linear interactions.
"""
import tensorflow as tf

MODEL_FAMILY = "DeepLearning"


class MLPModel:
    MODEL_ID = "ann"
    DISPLAY_NAME = "ANN (Multi-Layer Perceptron)"
    DESCRIPTION = (
        "Standard feed-forward neural network. Input → Dense hidden layers (ReLU/Tanh) → Linear output. "
        "Universal approximator for any continuous function given enough depth and width."
    )
    FRAMEWORK = "tensorflow"

    @staticmethod
    def build(
        input_dim: int,
        output_dim: int,
        layer_configs: list,
        optimizer: str = "adam",
        loss: str = "mse",
    ) -> tf.keras.Model:
        """
        Build a configurable MLP.

        Args:
            input_dim: Number of input features.
            output_dim: Number of regression targets.
            layer_configs: list of dicts with 'units', 'activation', and optional 'dropout'.
            optimizer: Keras optimizer name.
            loss: Loss function name.
        """
        model = tf.keras.Sequential(name="MLP_Regressor")
        for i, layer in enumerate(layer_configs):
            kwargs = dict(units=layer["units"], activation=layer.get("activation", "relu"))
            if i == 0:
                kwargs["input_shape"] = (input_dim,)
            model.add(tf.keras.layers.Dense(**kwargs))
            if layer.get("dropout", 0) > 0:
                model.add(tf.keras.layers.Dropout(rate=layer["dropout"]))

        model.add(tf.keras.layers.Dense(output_dim, activation="linear", name="regression_output"))
        model.compile(optimizer=optimizer, loss=loss, metrics=["mae", "mse"])
        return model
