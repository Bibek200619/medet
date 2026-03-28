"""
Emergency symptom detection for Medet.

This module intentionally uses transparent, maintainable rules instead of ML.
It is designed to be called before and after AI generation so the backend can
attach safety metadata without changing the streaming architecture.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable


DetectionResult = dict[str, str | bool | None]


@dataclass(frozen=True)
class EmergencyRule:
    severity: str
    reason: str
    keywords: tuple[str, ...]
    patterns: tuple[re.Pattern[str], ...] = ()


def _compile(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern, re.IGNORECASE)


EMERGENCY_RULES: tuple[EmergencyRule, ...] = (
    EmergencyRule(
        severity="high",
        reason="Possible chest pain or heart attack symptoms detected",
        keywords=(
            "chest pain",
            "pain in chest",
            "chest tightness",
            "heavy chest",
            "pressure in chest",
            "heart attack",
            "left arm pain",
            "jaw pain with sweating",
            "cold sweat with chest pain",
            "severe chest",
            "chhati dard",
            "seene me dard",
            "buk betha",
        ),
        patterns=(
            _compile(r"\b(chest|heart)\b.{0,30}\b(pain|tight|pressure|heavy|burning)\b"),
            _compile(r"\b(pain|tightness|pressure)\b.{0,30}\b(chest|heart)\b"),
        ),
    ),
    EmergencyRule(
        severity="high",
        reason="Possible breathing difficulty detected",
        keywords=(
            "breathing difficulty",
            "difficulty breathing",
            "trouble breathing",
            "shortness of breath",
            "cannot breathe",
            "can't breathe",
            "cant breathe",
            "unable to breathe",
            "not breathing",
            "gasping",
            "suffocating",
            "breathless",
            "saans nahi",
            "saans lene mein dikkat",
            "saans phool",
            "dam ghut",
        ),
        patterns=(
            _compile(r"\b(can'?t|cannot|unable to|not)\b.{0,18}\bbreathe\b"),
            _compile(r"\b(breath|breathing)\b.{0,24}\b(difficult|trouble|problem|stopped)\b"),
        ),
    ),
    EmergencyRule(
        severity="high",
        reason="Possible severe bleeding detected",
        keywords=(
            "severe bleeding",
            "heavy bleeding",
            "bleeding a lot",
            "blood not stopping",
            "bleeding not stopping",
            "large blood loss",
            "too much blood",
            "khoon nahi ruk raha",
            "bahut khoon",
        ),
        patterns=(
            _compile(r"\b(bleeding|blood)\b.{0,30}\b(not stopping|wont stop|won't stop|a lot|too much|heavy|severe)\b"),
            _compile(r"\b(heavy|severe|too much)\b.{0,18}\b(bleeding|blood)\b"),
        ),
    ),
    EmergencyRule(
        severity="high",
        reason="Possible unconsciousness detected",
        keywords=(
            "unconscious",
            "passed out",
            "fainted and not waking",
            "not waking up",
            "collapsed",
            "behosh",
            "hosh nahi",
        ),
        patterns=(
            _compile(r"\b(not|isn'?t|aint|ain't)\b.{0,18}\b(waking|responding|conscious)\b"),
            _compile(r"\b(fainted|passed out|collapsed)\b.{0,30}\b(not waking|unconscious|not responding)\b"),
        ),
    ),
    EmergencyRule(
        severity="high",
        reason="Possible seizure detected",
        keywords=(
            "seizure",
            "seizures",
            "fits",
            "convulsion",
            "body shaking uncontrollably",
            "jerking and unconscious",
            "daura",
            "mirgi",
        ),
        patterns=(
            _compile(r"\b(body|arms|legs)\b.{0,24}\b(shaking|jerking)\b.{0,24}\b(uncontrolled|uncontrollably|unconscious)\b"),
        ),
    ),
    EmergencyRule(
        severity="high",
        reason="Possible stroke symptoms detected",
        keywords=(
            "stroke",
            "face drooping",
            "face weakness",
            "arm weakness",
            "one side weakness",
            "sudden weakness",
            "slurred speech",
            "cannot speak",
            "can't speak",
            "sudden confusion",
            "lakwa",
            "bol nahi pa raha",
        ),
        patterns=(
            _compile(r"\b(sudden|one side)\b.{0,30}\b(weakness|numbness|paralysis)\b"),
            _compile(r"\b(face|mouth)\b.{0,24}\b(droop|drooping|twisted|weak)\b"),
            _compile(r"\b(slurred|unclear)\b.{0,12}\bspeech\b"),
        ),
    ),
    EmergencyRule(
        severity="high",
        reason="Possible pregnancy bleeding detected",
        keywords=(
            "pregnant bleeding",
            "bleeding during pregnancy",
            "pregnancy bleeding",
            "pregnant and bleeding",
            "bleeding while pregnant",
            "garbhavati bleeding",
            "pregnancy me bleeding",
        ),
        patterns=(
            _compile(r"\b(pregnant|pregnancy|garbhavati)\b.{0,35}\b(bleeding|blood)\b"),
            _compile(r"\b(bleeding|blood)\b.{0,35}\b(pregnant|pregnancy|garbhavati)\b"),
        ),
    ),
    EmergencyRule(
        severity="high",
        reason="Possible severe burn detected",
        keywords=(
            "severe burn",
            "bad burn",
            "deep burn",
            "large burn",
            "burned face",
            "burn on face",
            "electric burn",
            "chemical burn",
            "jal gaya badly",
        ),
        patterns=(
            _compile(r"\b(severe|bad|deep|large|chemical|electric)\b.{0,18}\bburn\b"),
            _compile(r"\bburn\b.{0,24}\b(face|chest|large|deep|chemical|electric)\b"),
        ),
    ),
)


def detect_emergency(text: str | None) -> DetectionResult:
    """Return Medet emergency metadata for a user message or AI response."""
    normalized = _normalize(text)
    if not normalized:
        return _no_emergency()

    for rule in EMERGENCY_RULES:
        if _matches_rule(normalized, rule):
            return {
                "emergency": True,
                "severity": rule.severity,
                "reason": rule.reason,
            }

    return _no_emergency()


def is_emergency(text: str | None) -> bool:
    """Convenience helper for callers that only need a boolean."""
    return bool(detect_emergency(text)["emergency"])


def _matches_rule(text: str, rule: EmergencyRule) -> bool:
    for keyword in rule.keywords:
        term = _normalize(keyword)
        if term in text and not _is_negated(text, term):
            return True

    for pattern in rule.patterns:
        match = pattern.search(text)
        if match and not _is_negated(text, match.group(0)):
            return True

    return False


def _normalize(text: str | None) -> str:
    if not text:
        return ""
    lowered = text.lower().replace("’", "'")
    lowered = re.sub(r"[^a-z0-9\u0900-\u097f\u0980-\u09ff']+", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()


def _is_negated(text: str, term: str) -> bool:
    escaped = re.escape(term)
    return any(pattern.search(text) for pattern in _negation_patterns(escaped))


def _negation_patterns(escaped_term: str) -> Iterable[re.Pattern[str]]:
    yield re.compile(rf"\b(no|not|without|dont|don't|doesnt|doesn't|never)\s+.{{0,24}}\b{escaped_term}\b")
    yield re.compile(rf"\b{escaped_term}\b.{{0,24}}\b(no|not|gone|better|stopped)\b")


def _no_emergency() -> DetectionResult:
    return {
        "emergency": False,
        "severity": "low",
        "reason": None,
    }
