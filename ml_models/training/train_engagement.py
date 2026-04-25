# =============================================================================
# training/train_engagement.py
# Train a single 3-class XGBClassifier for engagement/fatigue detection.
# Saves calibrated model to models/artifacts/engagement_classifier.joblib
#
# Run: python training/train_engagement.py
# =============================================================================

import os
import sys
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import ENGAGEMENT_MODEL_PATH, MODEL_DIR, ENGAGEMENT_CLASS_LABELS
from data.training_schema import SyntheticDataGenerator
from data.feature_engineering import get_engagement_feature_names
from models.engagement_classifier import build_ann_engagement_model


def train_and_save(
    n_samples: int = 8000,
    output_path: str = ENGAGEMENT_MODEL_PATH,
    verbose: bool = True,
) -> dict:
    """
    Train the engagement/fatigue classifier and save to disk.

    Training strategy
    -----------------
    - Stratified train/val split (80/20) to preserve class balance
    - Class imbalance: inverse-frequency sample_weight passed to fit()
    - Calibration: CalibratedClassifierCV(isotonic, cv=3)
    - Evaluation: macro F1, per-class precision/recall, confusion matrix
    - Calibration quality: per-class Brier score

    Returns
    -------
    dict with evaluation metrics
    """
    try:
        import pandas as pd
        import numpy as np
        import joblib
        from sklearn.model_selection import StratifiedShuffleSplit
        from sklearn.metrics import (
            classification_report,
            confusion_matrix,
            f1_score,
            brier_score_loss,
        )
        from sklearn.preprocessing import label_binarize
    except ImportError:
        raise ImportError(
            "Required: pip install xgboost scikit-learn pandas numpy joblib"
        )

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    feature_names = get_engagement_feature_names()

    if verbose:
        print(f"Generating {n_samples} synthetic engagement samples...")

    gen    = SyntheticDataGenerator(seed=42)
    X, y   = gen.generate_engagement_dataset(n_samples=n_samples)

    if verbose:
        print(f"Label distribution: {y.value_counts().to_dict()}")
        # 0=fatigued, 1=neutral, 2=engaged

    # Align feature columns
    for col in feature_names:
        if col not in X.columns:
            X[col] = 0.0
    X = X[feature_names]

    # Stratified split
    sss    = StratifiedShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, val_idx = next(sss.split(X, y))
    X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
    y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

    if verbose:
        print(f"Train: {len(X_train)}  |  Val: {len(X_val)}")

    # Compute sample weights for class balance -> Oversampling for MLP
    # MLPClassifier doesn't natively support sample_weight well in all configurations,
    # so we oversample the minority classes to balance the training set.
    train_df = pd.concat([X_train, y_train], axis=1)
    max_size = train_df['engagement_label'].value_counts().max()
    
    lst = [train_df]
    for class_index, group in train_df.groupby('engagement_label'):
        lst.append(group.sample(max_size - len(group), replace=True, random_state=42))
    train_df_balanced = pd.concat(lst)
    
    X_train_bal = train_df_balanced[feature_names]
    y_train_bal = train_df_balanced['engagement_label']

    if verbose:
        print(f"Balanced Train: {len(X_train_bal)} samples")

    # Build model
    model = build_ann_engagement_model()

    if verbose:
        print("Training calibrated MLPClassifier (3-class)...")

    model.fit(X_train_bal.values, y_train_bal.values)

    # Evaluate
    y_prob  = model.predict_proba(X_val.values)    # shape: (n, 3)
    y_pred  = y_prob.argmax(axis=1)

    macro_f1 = f1_score(y_val, y_pred, average="macro")

    if verbose:
        print(f"\nMacro F1: {macro_f1:.4f}")
        print("\nClassification Report:")
        labels = [ENGAGEMENT_CLASS_LABELS[i] for i in range(3)]
        print(classification_report(y_val, y_pred, target_names=labels, zero_division=0))
        print("Confusion Matrix (rows=true, cols=pred):")
        cm = confusion_matrix(y_val, y_pred)
        print(f"  {'':12} {' '.join(f'{l:12}' for l in labels)}")
        for i, row in enumerate(cm):
            print(f"  {labels[i]:12} {' '.join(f'{v:12d}' for v in row)}")

    # Per-class Brier scores (calibration)
    y_bin      = label_binarize(y_val, classes=[0, 1, 2])
    brier_per_class = {
        ENGAGEMENT_CLASS_LABELS[i]: round(float(brier_score_loss(y_bin[:, i], y_prob[:, i])), 4)
        for i in range(3)
    }
    if verbose:
        print(f"\nBrier scores (calibration, lower=better):")
        for cls, bs in brier_per_class.items():
            print(f"  {cls}: {bs:.4f}")

    # Feature importance removed (Not natively supported by MLPClassifier)
    feat_importances = []

    # Save model
    import joblib
    joblib.dump(model, output_path)
    if verbose:
        print(f"\nModel saved -> {output_path}")

    results = {
        "macro_f1":          round(macro_f1, 4),
        "brier_per_class":   brier_per_class,
        "n_train":           int(len(X_train)),
        "n_val":             int(len(X_val)),
        "top_features":      feat_importances[:10],
    }

    summary_path = os.path.join(os.path.dirname(output_path), "engagement_training_results.json")
    with open(summary_path, "w") as f:
        json.dump(results, f, indent=2)

    if verbose:
        print(f"Results saved -> {summary_path}")

    return results


if __name__ == "__main__":
    train_and_save(n_samples=50000, verbose=True)
