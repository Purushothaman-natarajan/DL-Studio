"""
Recurrent Models: LSTM and GRU for sequence / time-series regression.
Suited for: sequential data where past values influence the next prediction
(e.g., energy demand, stock prices, sensor streams).
"""
import tensorflow as tf

MODEL_FAMILY = "DeepLearning"


class LSTMModel:
    MODEL_ID = "lstm"
    DISPLAY_NAME = "LSTM (Long Short-Term Memory)"
    DESCRIPTION = (
        "Recurrent network with gated memory cells (input/forget/output gates). "
        "Retains long-range temporal dependencies. "
        "Best for time-series and sequential regression tasks."
    )
    FRAMEWORK = "tensorflow"

    @staticmethod
    def build(
        input_dim: int,
        output_dim: int,
        lstm_units: int = 64,
        num_layers: int = 2,
        dense_units: int = 32,
        dropout: float = 0.2,
        sequence_length: int = 1,
        optimizer: str = "adam",
        loss: str = "mse",
    ) -> tf.keras.Model:
        """
        Build an LSTM regressor.

        For standard tabular input (no explicit sequences), the feature vector is
        reshaped to (sequence_length=1, input_dim) so it can enter an LSTM layer.
        """
        inputs = tf.keras.Input(shape=(input_dim,), name="feature_input")
        # Reshape flat features into a trivial sequence for LSTM compatibility
        x = tf.keras.layers.Reshape((sequence_length, input_dim // sequence_length))(inputs)

        for i in range(num_layers):
            return_seq = (i < num_layers - 1)
            x = tf.keras.layers.LSTM(
                units=lstm_units,
                return_sequences=return_seq,
                dropout=dropout,
                name=f"lstm_{i+1}"
            )(x)

        x = tf.keras.layers.Dense(dense_units, activation="relu")(x)
        outputs = tf.keras.layers.Dense(output_dim, activation="linear", name="regression_output")(x)

        model = tf.keras.Model(inputs=inputs, outputs=outputs, name="LSTM_Regressor")
        model.compile(optimizer=optimizer, loss=loss, metrics=["mae", "mse"])
        return model


class GRUModel:
    MODEL_ID = "gru"
    DISPLAY_NAME = "GRU (Gated Recurrent Unit)"
    DESCRIPTION = (
        "A lighter, faster alternative to LSTM with only reset/update gates. "
        "Often matches LSTM accuracy with lower computational cost. "
        "Ideal for real-time sequential regression where speed matters."
    )
    FRAMEWORK = "tensorflow"

    @staticmethod
    def build(
        input_dim: int,
        output_dim: int,
        gru_units: int = 64,
        num_layers: int = 2,
        dense_units: int = 32,
        dropout: float = 0.2,
        sequence_length: int = 1,
        optimizer: str = "adam",
        loss: str = "mse",
    ) -> tf.keras.Model:
        inputs = tf.keras.Input(shape=(input_dim,), name="feature_input")
        x = tf.keras.layers.Reshape((sequence_length, input_dim // sequence_length))(inputs)

        for i in range(num_layers):
            return_seq = (i < num_layers - 1)
            x = tf.keras.layers.GRU(
                units=gru_units,
                return_sequences=return_seq,
                dropout=dropout,
                name=f"gru_{i+1}"
            )(x)

        x = tf.keras.layers.Dense(dense_units, activation="relu")(x)
        outputs = tf.keras.layers.Dense(output_dim, activation="linear", name="regression_output")(x)

        model = tf.keras.Model(inputs=inputs, outputs=outputs, name="GRU_Regressor")
        model.compile(optimizer=optimizer, loss=loss, metrics=["mae", "mse"])
        return model
