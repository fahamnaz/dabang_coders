# =============================================================================
# models/skill_mastery.py
# MODEL 1: Skill Mastery Classifier
#
# Architecture: One XGBClassifier per skill (11 total), each predicting
# binary mastery (0 = not mastered, 1 = mastered).
# Uses predict_proba()[:,1] so the formula engine works with probabilities.
#
# Cold start: returns age-band priors when model is not trained yet or
#             child has fewer than MIN_ATTEMPTS_FOR_INFERENCE attempts.
# Calibration: CalibratedClassifierCV(method="isotonic") applied post-training.
# =============================================================================

import os
import math
import joblib
from typing import Optional
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import (
    SKILLS,
    AGE_BAND_PRIORS,
    AGE_BANDS,
    MODEL_DIR,
    skill_model_path,
)
from data.feature_engineering import extract_skill_features, get_skill_feature_names

MIN_ATTEMPTS_FOR_INFERENCE = 5   # below this → fall back to age-band prior
MIN_CONFIDENCE_THRESHOLD   = 0.55  # below this → output is "low confidence"


class SkillMasteryClassifier:
    """
    Multi-output Skill Mastery Classifier.

    Wraps 11 independent XGBClassifiers, one per skill.
    All models are serialized to models/artifacts/{skill}_mastery.joblib
    and loaded at startup.

    Inference output (per call to predict())
    ----------------------------------------
    {
        "phonics": {
            "mastery_prob": 0.82,
            "mastery_class": "high",
            "confidence": 0.91,
            "cold_start": false
        },
        ...
    }

    mastery_class thresholds  (from config):
        < 0.40  → "low"
        0.40–0.70 → "developing"
        > 0.70  → "high"
    """

    MASTERY_CLASS_THRESHOLDS = {"low": 0.40, "developing": 0.70}  # lower bound per class

    def __init__(self, model_dir: str = MODEL_DIR):
        self.model_dir  = model_dir
        self._models    = {}     # skill -> calibrated XGBClassifier or None
        self._feature_names = get_skill_feature_names()
        self._load_all_models()

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------

    def predict(
        self,
        events: list[dict],
        child_profile: dict,
    ) -> dict:
        """
        Run inference for all 11 skills.

        Parameters
        ----------
        events        : gameplay event list (all events for this child/session)
        child_profile : current ChildProfile dict

        Returns
        -------
        dict keyed by skill name, each value is a dict with mastery_prob,
        mastery_class, confidence, cold_start.
        """
        result = {}
        age_band = _get_age_band(child_profile.get("age_months", 60))

        for skill in SKILLS:
            skill_events = [e for e in events if e.get("skill") == skill]
            n_attempts   = len(skill_events)

            if n_attempts < MIN_ATTEMPTS_FOR_INFERENCE or self._models.get(skill) is None:
                # Cold start: return age-band prior with low confidence
                prior = AGE_BAND_PRIORS[age_band][skill]
                result[skill] = {
                    "mastery_prob":  round(prior, 4),
                    "mastery_class": _classify_mastery(prior),
                    "confidence":    0.40,
                    "cold_start":    True,
                }
                continue

            # Feature extraction
            feats = extract_skill_features(events, skill, child_profile)
            X     = _feats_to_vector(feats, self._feature_names)

            try:
                model  = self._models[skill]
                proba  = model.predict_proba([X])[0]  # shape: [p_class0, p_class1]
                p_mastery = float(proba[1])
                confidence = float(max(proba))        # confidence = certainty of top class

                result[skill] = {
                    "mastery_prob":  round(p_mastery, 4),
                    "mastery_class": _classify_mastery(p_mastery),
                    "confidence":    round(confidence, 4),
                    "cold_start":    False,
                }
            except Exception as e:
                # Graceful fallback — never crash the pipeline
                prior = AGE_BAND_PRIORS[age_band][skill]
                result[skill] = {
                    "mastery_prob":  round(prior, 4),
                    "mastery_class": _classify_mastery(prior),
                    "confidence":    0.35,
                    "cold_start":    True,
                    "_fallback_reason": str(e),
                }

        return result

    def predict_batch(
        self,
        batch: list[tuple[list, dict]],
    ) -> list[dict]:
        """Batch inference. Each element is (events, child_profile)."""
        return [self.predict(events, profile) for events, profile in batch]

    def is_trained(self, skill: Optional[str] = None) -> bool:
        """Check whether model(s) are loaded from disk."""
        if skill:
            return self._models.get(skill) is not None
        return any(m is not None for m in self._models.values())

    # -----------------------------------------------------------------------
    # Internal
    # -----------------------------------------------------------------------

    def _load_all_models(self):
        for skill in SKILLS:
            path = skill_model_path(skill)
            if os.path.exists(path):
                try:
                    self._models[skill] = joblib.load(path)
                except Exception:
                    self._models[skill] = None
            else:
                self._models[skill] = None

    def _register_model(self, skill: str, model):
        """Called by training script after fitting."""
        self._models[skill] = model


# ---------------------------------------------------------------------------
# Model Spec (used by training script)
# ---------------------------------------------------------------------------

def build_ann_skill_model():
    """
    Returns a calibrated Pipeline(StandardScaler + MLPClassifier) for binary
    skill mastery prediction.

    Spec
    ----
    Preprocessing   : StandardScaler (zero-mean, unit-variance)
    Base learner    : MLPClassifier (Artificial Neural Network)
    hidden_layers   : (128, 64, 32)
    activation      : relu
    solver          : adam
    Calibration     : CalibratedClassifierCV(method="isotonic", cv=5)
    """
    try:
        from sklearn.neural_network import MLPClassifier
        from sklearn.calibration import CalibratedClassifierCV
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler
    except ImportError:
        raise ImportError("scikit-learn required: pip install scikit-learn")

    base_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("mlp", MLPClassifier(
            hidden_layer_sizes=(128, 64, 32),
            activation="relu",
            solver="adam",
            alpha=0.001,
            batch_size=64,
            learning_rate="adaptive",
            learning_rate_init=0.001,
            max_iter=500,
            early_stopping=True,
            validation_fraction=0.1,
            n_iter_no_change=20,
            random_state=42,
        )),
    ])

    # Isotonic calibration is more flexible than Platt scaling
    calibrated = CalibratedClassifierCV(
        estimator  = base_pipeline,
        method     = "isotonic",
        cv         = 5,
    )
    return calibrated


# ---------------------------------------------------------------------------
# Private utilities
# ---------------------------------------------------------------------------

def _classify_mastery(prob: float) -> str:
    if prob < 0.40:
        return "low"
    elif prob < 0.70:
        return "developing"
    return "high"


def _get_age_band(age_months: int) -> str:
    age_years = age_months / 12.0
    for band, (lo, hi) in AGE_BANDS.items():
        if lo <= age_years < hi:
            return band
    return "primary"  # default for older children


def _feats_to_vector(feats: dict, feature_names: list[str]) -> list[float]:
    """Convert feature dict to ordered numeric list for XGBoost."""
    return [float(feats.get(name, 0.0)) for name in feature_names]
