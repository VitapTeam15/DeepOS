"""
Deep OS — LSTM Next-Application Deep Learning Model
Provides an end-to-end, lightweight LSTM neural network for predicting the next application
based on sequential application switching history.

Architecture:
  Application Activity Sequence
          ↓
  Application Tokenization / Encoding (app2idx mapping with <PAD> and <UNK>)
          ↓
  Sequence Preparation (sliding window with padding)
          ↓
  Embedding Layer (dim=32, padding_idx=0)
          ↓
  LSTM Layer (hidden=64, num_layers=1, batch_first=True)
          ↓
  Dropout Layer (p=0.2)
          ↓
  Dense / Linear Layer (64 → vocab_size)
          ↓
  Softmax (Categorical probability distribution)
          ↓
  Next Application Prediction + Real Calibrated Confidence
"""

import os
import json
import logging
import random
from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Check torch availability
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    logger.warning("[ML_MODEL] PyTorch not detected. LSTM fallback mode will be active.")

import numpy as np


class AppLSTMModel:
    """Wrapper that holds the PyTorch nn.Module when torch is available."""
    pass


if HAS_TORCH:
    class PyTorchAppLSTM(nn.Module):
        def __init__(self, vocab_size: int, embedding_dim: int = 32, hidden_dim: int = 64, dropout: float = 0.2):
            super().__init__()
            self.vocab_size = vocab_size
            self.embedding_dim = embedding_dim
            self.hidden_dim = hidden_dim
            
            self.embedding = nn.Embedding(num_embeddings=vocab_size, embedding_dim=embedding_dim, padding_idx=0)
            self.lstm = nn.LSTM(input_size=embedding_dim, hidden_size=hidden_dim, num_layers=1, batch_first=True)
            self.dropout = nn.Dropout(p=dropout)
            self.fc = nn.Linear(hidden_dim, vocab_size)

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            # x shape: (batch_size, seq_len)
            embedded = self.embedding(x)  # (batch_size, seq_len, embedding_dim)
            lstm_out, _ = self.lstm(embedded)  # (batch_size, seq_len, hidden_dim)
            last_step = lstm_out[:, -1, :]  # (batch_size, hidden_dim)
            dropped = self.dropout(last_step)
            logits = self.fc(dropped)  # (batch_size, vocab_size)
            return logits


class LSTMModelManager:
    """
    Manages vocabulary, dataset creation, training, evaluation, persistence,
    and inference for the Deep OS LSTM Next-Application Model.
    """
    PAD_TOKEN = "<PAD>"
    UNK_TOKEN = "<UNK>"

    def __init__(self, model_dir: str = "data/models", seq_length: int = 3):
        self.model_dir = model_dir
        self.seq_length = seq_length
        self.embedding_dim = 32
        self.hidden_dim = 64
        self.dropout = 0.2
        
        self.model = None
        self.app2idx: Dict[str, int] = {}
        self.idx2app: Dict[int, str] = {}
        self.metadata: Dict[str, Any] = {
            "status": "UNTRAINED",
            "model_type": "LSTM",
            "architecture": "Embedding(32) -> LSTM(64) -> Dropout(0.2) -> Dense -> Softmax",
            "training_samples": 0,
            "validation_samples": 0,
            "vocab_size": 0,
            "classes": [],
            "last_trained": None,
            "validation_loss": None,
            "top1_accuracy": None,
            "top3_accuracy": None,
            "epochs_trained": 0,
            "version": "1.0.0"
        }
        
        # Load existing model if available on startup
        self.load()

    @property
    def is_trained(self) -> bool:
        return self.model is not None and self.metadata.get("status") == "TRAINED"

    def _build_vocab(self, app_list: List[str]):
        """Constructs bidirectional vocabulary mapping."""
        unique_apps = sorted(list(set(app_list)))
        self.app2idx = {self.PAD_TOKEN: 0, self.UNK_TOKEN: 1}
        for idx, app in enumerate(unique_apps, start=2):
            self.app2idx[app] = idx
        self.idx2app = {idx: app for app, idx in self.app2idx.items()}
        self.metadata["vocab_size"] = len(self.app2idx)
        self.metadata["classes"] = unique_apps

    def prepare_sequences(self, events: List[str]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Transforms chronological sequence of application names into sliding window pairs:
        [app_{t-k}, ..., app_{t-1}] -> app_t
        """
        if len(events) < 2:
            return np.array([]), np.array([])

        X, y = [], []
        for i in range(1, len(events)):
            target = events[i]
            window = events[max(0, i - self.seq_length):i]
            
            # Convert to token IDs
            tokenized_window = [self.app2idx.get(app, self.app2idx.get(self.UNK_TOKEN, 1)) for app in window]
            
            # Left-pad with 0 (<PAD>) if shorter than seq_length
            if len(tokenized_window) < self.seq_length:
                tokenized_window = [0] * (self.seq_length - len(tokenized_window)) + tokenized_window
            
            target_id = self.app2idx.get(target, self.app2idx.get(self.UNK_TOKEN, 1))
            X.append(tokenized_window)
            y.append(target_id)

        return np.array(X, dtype=np.int64), np.array(y, dtype=np.int64)

    def train(self, app_events: List[str], epochs: int = 25, lr: float = 0.005, batch_size: int = 16) -> Dict[str, Any]:
        """
        Trains the LSTM model with backpropagation using cross-entropy loss and Adam optimizer.
        Computes out-of-sample validation loss, Top-1 accuracy, and Top-3 accuracy.
        """
        if not HAS_TORCH:
            logger.error("[ML_MODEL] PyTorch not available for training.")
            self.metadata["status"] = "ERROR_NO_TORCH"
            return self.metadata

        if len(app_events) < 15:
            logger.warning(f"[ML_MODEL] Insufficient training data ({len(app_events)} events < 15 minimum).")
            self.metadata["status"] = "INSUFFICIENT_DATA"
            self.metadata["training_samples"] = len(app_events)
            return self.metadata

        logger.info(f"[ML_MODEL] Starting LSTM training on {len(app_events)} chronological events...")
        self._build_vocab(app_events)

        X, y = self.prepare_sequences(app_events)
        total_samples = len(X)
        if total_samples < 5:
            self.metadata["status"] = "INSUFFICIENT_DATA"
            return self.metadata

        # 80/20 chronological split for genuine temporal validation
        split_idx = max(1, int(total_samples * 0.8))
        X_train, y_train = X[:split_idx], y[:split_idx]
        X_val, y_val = X[split_idx:], y[split_idx:]

        if len(X_val) == 0:
            X_val, y_val = X_train, y_train  # Fallback to train set if sample is very small

        vocab_size = len(self.app2idx)
        model = PyTorchAppLSTM(
            vocab_size=vocab_size,
            embedding_dim=self.embedding_dim,
            hidden_dim=self.hidden_dim,
            dropout=self.dropout
        )

        criterion = nn.CrossEntropyLoss(ignore_index=0)
        optimizer = optim.Adam(model.parameters(), lr=lr)

        model.train()
        X_train_tensor = torch.tensor(X_train, dtype=torch.long)
        y_train_tensor = torch.tensor(y_train, dtype=torch.long)

        # Training loop
        num_batches = max(1, (len(X_train) + batch_size - 1) // batch_size)
        for epoch in range(epochs):
            permutation = torch.randperm(len(X_train))
            epoch_loss = 0.0
            
            for b in range(num_batches):
                indices = permutation[b * batch_size : (b + 1) * batch_size]
                batch_x, batch_y = X_train_tensor[indices], y_train_tensor[indices]

                optimizer.zero_grad()
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
                epoch_loss += loss.item()

        # Validation evaluation
        model.eval()
        with torch.no_grad():
            X_val_tensor = torch.tensor(X_val, dtype=torch.long)
            y_val_tensor = torch.tensor(y_val, dtype=torch.long)
            val_logits = model(X_val_tensor)
            val_loss = criterion(val_logits, y_val_tensor).item()

            # Top-1 Accuracy
            _, top1_preds = torch.max(val_logits, dim=1)
            top1_correct = (top1_preds == y_val_tensor).sum().item()
            top1_acc = round(top1_correct / len(y_val), 4)

            # Top-3 Accuracy
            top3_k = min(3, vocab_size)
            _, top3_preds = torch.topk(val_logits, k=top3_k, dim=1)
            top3_correct = sum(
                y_val_tensor[i].item() in top3_preds[i].tolist()
                for i in range(len(y_val))
            )
            top3_acc = round(top3_correct / len(y_val), 4)

        logger.info(
            f"[ML_MODEL] LSTM training complete: {epochs} epochs | "
            f"Train samples: {len(X_train)} | Val samples: {len(X_val)} | "
            f"Val Loss: {val_loss:.4f} | Top-1 Acc: {top1_acc * 100:.1f}% | Top-3 Acc: {top3_acc * 100:.1f}%"
        )

        self.model = model
        self.metadata = {
            "status": "TRAINED",
            "model_type": "LSTM",
            "architecture": f"Embedding({self.embedding_dim}) -> LSTM({self.hidden_dim}) -> Dropout({self.dropout}) -> Dense -> Softmax",
            "training_samples": len(X_train),
            "validation_samples": len(X_val),
            "vocab_size": vocab_size,
            "classes": [app for app in self.metadata["classes"]],
            "last_trained": datetime.now().isoformat(),
            "validation_loss": round(val_loss, 4),
            "top1_accuracy": top1_acc,
            "top3_accuracy": top3_acc,
            "epochs_trained": epochs,
            "version": "1.0.0"
        }

        # Persist model
        self.save()
        return self.metadata

    def predict(self, recent_apps: List[str], top_k: int = 3) -> Tuple[str, float, List[Dict[str, Any]], Dict[str, float]]:
        """
        Runs LSTM inference for the provided sequence of recent applications.
        Returns:
            (top_app, confidence, alternatives_list, full_distribution_dict)
        """
        if not self.is_trained or not HAS_TORCH:
            return "Unknown", 0.0, [], {}

        # Encode input sequence
        tokenized = [
            self.app2idx.get(app, self.app2idx.get(self.UNK_TOKEN, 1))
            for app in recent_apps[-self.seq_length:]
        ]
        if len(tokenized) < self.seq_length:
            tokenized = [0] * (self.seq_length - len(tokenized)) + tokenized

        self.model.eval()
        with torch.no_grad():
            inp = torch.tensor([tokenized], dtype=torch.long)
            logits = self.model(inp)[0]
            
            # Mask out special tokens <PAD> and <UNK> so they aren't recommended
            logits[0] = -1e9  # <PAD>
            logits[1] = -1e9  # <UNK>
            
            probabilities = torch.softmax(logits, dim=-1).cpu().numpy()

        # Build full distribution
        distribution = {}
        for idx, prob in enumerate(probabilities):
            if idx in (0, 1):
                continue
            app_name = self.idx2app.get(idx)
            if app_name:
                distribution[app_name] = float(prob)

        if not distribution:
            return "Unknown", 0.0, [], {}

        # Normalize across valid applications
        total_p = sum(distribution.values())
        if total_p > 0:
            distribution = {k: v / total_p for k, v in distribution.items()}

        sorted_apps = sorted(distribution.items(), key=lambda item: item[1], reverse=True)
        top_app, top_conf = sorted_apps[0]
        
        alternatives = [
            {"name": name, "confidence": round(prob, 4)}
            for name, prob in sorted_apps[1:top_k + 1]
        ]

        return top_app, round(top_conf, 4), alternatives, distribution

    def save(self, model_dir: Optional[str] = None):
        """Saves PyTorch weights and metadata to disk."""
        target_dir = model_dir or self.model_dir
        os.makedirs(target_dir, exist_ok=True)
        
        meta_path = os.path.join(target_dir, "model_metadata.json")
        weights_path = os.path.join(target_dir, "app_lstm.pt")
        vocab_path = os.path.join(target_dir, "vocab.json")

        save_dict = {
            "metadata": self.metadata,
            "seq_length": self.seq_length,
            "embedding_dim": self.embedding_dim,
            "hidden_dim": self.hidden_dim,
            "dropout": self.dropout
        }
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(save_dict, f, indent=2)

        with open(vocab_path, "w", encoding="utf-8") as f:
            json.dump({"app2idx": self.app2idx, "idx2app": {str(k): v for k, v in self.idx2app.items()}}, f, indent=2)

        if HAS_TORCH and self.model is not None:
            torch.save(self.model.state_dict(), weights_path)
            logger.info(f"[ML_MODEL] Model weights and metadata saved to {target_dir}")

    def load(self, model_dir: Optional[str] = None) -> bool:
        """Loads weights and metadata from disk if available."""
        target_dir = model_dir or self.model_dir
        meta_path = os.path.join(target_dir, "model_metadata.json")
        weights_path = os.path.join(target_dir, "app_lstm.pt")
        vocab_path = os.path.join(target_dir, "vocab.json")

        if not (os.path.exists(meta_path) and os.path.exists(weights_path) and os.path.exists(vocab_path)):
            return False

        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                saved_meta = json.load(f)
            self.metadata = saved_meta.get("metadata", self.metadata)
            self.seq_length = saved_meta.get("seq_length", self.seq_length)
            self.embedding_dim = saved_meta.get("embedding_dim", self.embedding_dim)
            self.hidden_dim = saved_meta.get("hidden_dim", self.hidden_dim)
            self.dropout = saved_meta.get("dropout", self.dropout)

            with open(vocab_path, "r", encoding="utf-8") as f:
                vocab_data = json.load(f)
            self.app2idx = vocab_data.get("app2idx", {})
            self.idx2app = {int(k): v for k, v in vocab_data.get("idx2app", {}).items()}

            if HAS_TORCH:
                vocab_size = len(self.app2idx)
                model = PyTorchAppLSTM(
                    vocab_size=vocab_size,
                    embedding_dim=self.embedding_dim,
                    hidden_dim=self.hidden_dim,
                    dropout=self.dropout
                )
                model.load_state_dict(torch.load(weights_path, map_location=torch.device('cpu'), weights_only=True))
                model.eval()
                self.model = model
                logger.info(f"[ML_MODEL] Successfully loaded LSTM model from {weights_path} (Vocab={vocab_size})")
                return True
        except Exception as e:
            logger.error(f"[ML_MODEL] Failed to load saved LSTM model: {e}")
            self.model = None

        return False
