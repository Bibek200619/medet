from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas.medet_response import DEFAULT_LANGUAGE
from app.services.language_support import (
    get_doctor_suggestion_text,
    get_emergency_escalation_text,
)


TRUST_SAFE = "safe"
TRUST_GUARDED = "guarded"


@dataclass(frozen=True)
class MedicalSafetyResult:
    response: str
    medical_warning: bool
    trust_level: str
    reasons: tuple[str, ...] = ()
    suggest_doctor: bool = False


@dataclass(frozen=True)
class SafetyRule:
    reason: str
    patterns: tuple[re.Pattern[str], ...]
    remove_sentence: bool = True
    suggest_doctor: bool = True


def _compile(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern, re.IGNORECASE)


DANGEROUS_RULES: tuple[SafetyRule, ...] = (
    SafetyRule(
        reason="guaranteed_diagnosis",
        patterns=(
            _compile(r"\b(you definitely have|you certainly have|this is definitely|this is certainly)\b"),
            _compile(r"\b(i am|i'm)\s+(100%|completely|totally)\s+sure\b"),
            _compile(r"\b(no doubt|guaranteed)\b.{0,30}\b(diagnosis|disease|condition)\b"),
            _compile(r"\bthis proves\b.{0,40}\b(heart attack|stroke|cancer|diabetes|infection)\b"),
        ),
    ),
    SafetyRule(
        reason="unsafe_medication_certainty",
        patterns=(
            _compile(r"\b(take|give|use)\b.{0,40}\b\d+(\.\d+)?\s?(mg|mcg|g|ml|tablets?|pills?|capsules?)\b"),
            _compile(r"\b(double|triple|increase|stop|skip)\b.{0,30}\b(dose|medicine|medication|insulin|antibiotic|blood thinner)\b"),
            _compile(r"\b(take|give)\b.{0,30}\b(antibiotic|steroid|insulin|warfarin|blood thinner|opioid)\b"),
            _compile(r"\bmedicine will definitely cure\b"),
        ),
    ),
    SafetyRule(
        reason="dangerous_self_treatment",
        patterns=(
            _compile(r"\b(treat|manage|handle)\b.{0,30}\b(at home|yourself|without a doctor)\b"),
            _compile(r"\b(do not|don't|dont)\b.{0,20}\b(go to|visit|see|contact)\b.{0,20}\b(doctor|hospital|clinic|health worker)\b"),
            _compile(r"\b(no need|unnecessary)\b.{0,30}\b(doctor|hospital|clinic|medical care|emergency)\b"),
            _compile(r"\b(ignore|wait it out|sleep it off)\b"),
        ),
    ),
    SafetyRule(
        reason="emergency_minimization",
        patterns=(
            _compile(r"\b(chest pain|breathing difficulty|cannot breathe|stroke|seizure|unconscious|heavy bleeding)\b.{0,60}\b(not serious|safe|normal|nothing to worry)\b"),
            _compile(r"\b(not serious|safe|normal|nothing to worry)\b.{0,60}\b(chest pain|breathing difficulty|cannot breathe|stroke|seizure|unconscious|heavy bleeding)\b"),
        ),
    ),
    SafetyRule(
        reason="fake_medical_confidence",
        patterns=(
            _compile(r"\b(guaranteed cure|permanent cure|100% cure|sure cure)\b"),
            _compile(r"\b(always works|never fails)\b"),
            _compile(r"\b(no side effects|completely safe for everyone)\b"),
        ),
    ),
)


PROFESSIONAL_CARE_PATTERNS: tuple[re.Pattern[str], ...] = (
    _compile(r"\b(pregnant|pregnancy|baby|infant|elderly|old person|diabetes|high blood pressure)\b"),
    _compile(r"\b(fever)\b.{0,30}\b(3 days|three days|high|very high|not going down)\b"),
    _compile(r"\b(worse|worsening|severe|persistent|for many days|not improving)\b"),
    _compile(r"\b(blood in stool|blood in urine|dehydration|unable to drink)\b"),
)


SAFE_FALLBACK_TEXT: dict[str, str] = {
    "en": (
        "I may not be able to fully identify the condition. Please consult a healthcare "
        "professional, especially if symptoms are severe, worsening, or not improving. "
        "If symptoms worsen, seek emergency care immediately."
    ),
    "hi": (
        "मैं पूरी तरह बीमारी की पहचान नहीं कर सकता। कृपया स्वास्थ्य पेशेवर से सलाह लें, "
        "खासकर अगर लक्षण तेज हों, बढ़ रहे हों या ठीक न हो रहे हों। लक्षण बिगड़ें तो तुरंत आपात मदद लें।"
    ),
    "bn": (
        "আমি পুরোপুরি রোগটি নিশ্চিত করতে পারি না। দয়া করে স্বাস্থ্যকর্মী বা ডাক্তারের পরামর্শ নিন, "
        "বিশেষ করে লক্ষণ বেশি হলে, বাড়লে বা না কমলে। লক্ষণ খারাপ হলে দ্রুত জরুরি সাহায্য নিন।"
    ),
    "ne": (
        "म रोग पक्का छुट्याउन सक्दिन। कृपया स्वास्थ्यकर्मी वा डाक्टरसँग सल्लाह लिनुहोस्, "
        "विशेष गरी लक्षण कडा छ, बढ्दैछ वा निको भएको छैन भने। लक्षण बिग्रिए तुरुन्त आपतकालीन मद्दत लिनुहोस्।"
    ),
    "ta": (
        "நான் நிலையை முழுமையாக உறுதி செய்ய முடியாது. அறிகுறிகள் கடுமையாக இருந்தால், அதிகரித்தால் "
        "அல்லது குறையாவிட்டால் மருத்துவர் அல்லது சுகாதார பணியாளரை அணுகுங்கள். அறிகுறிகள் மோசமானால் உடனே அவசர உதவி பெறுங்கள்."
    ),
    "kn": (
        "ನಾನು ಸ್ಥಿತಿಯನ್ನು ಖಚಿತವಾಗಿ ಗುರುತಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಲಕ್ಷಣಗಳು ತೀವ್ರವಾಗಿದ್ದರೆ, ಹೆಚ್ಚುತ್ತಿದ್ದರೆ "
        "ಅಥವಾ ಕಡಿಮೆಯಾಗದಿದ್ದರೆ ವೈದ್ಯರು ಅಥವಾ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರನ್ನು ಸಂಪರ್ಕಿಸಿ. ಲಕ್ಷಣಗಳು ಕೆಟ್ಟರೆ ತಕ್ಷಣ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ."
    ),
}


UNCERTAINTY_TEXT: dict[str, str] = {
    "en": "I cannot diagnose this for certain from messages alone.",
    "hi": "सिर्फ संदेश से मैं पक्की बीमारी नहीं बता सकता।",
    "bn": "শুধু বার্তা দেখে আমি নিশ্চিত রোগ বলতে পারি না।",
    "ne": "सन्देशबाट मात्र म पक्का रोग भन्न सक्दिन।",
    "ta": "செய்தி மட்டும் வைத்து நான் உறுதியான நோயறிதல் சொல்ல முடியாது.",
    "kn": "ಸಂದೇಶಗಳಿಂದ ಮಾತ್ರ ನಾನು ಖಚಿತ ರೋಗನಿರ್ಣಯ ಹೇಳಲು ಸಾಧ್ಯವಿಲ್ಲ.",
}


EMERGENCY_CORE_PHRASES: dict[str, tuple[str, ...]] = {
    "en": ("medical help immediately", "urgent attention"),
    "hi": ("गंभीर हो सकता है", "तुरंत"),
    "bn": ("গুরুতর হতে পারে", "দ্রুত"),
    "ne": ("गम्भीर हुन सक्छ", "तुरुन्त"),
    "ta": ("தீவிரமாக இருக்கலாம்", "உடனடி"),
    "kn": ("ಗಂಭೀರವಾಗಿರಬಹುದು", "ತಕ್ಷಣ"),
}


def guard_medical_response(
    response: str,
    *,
    user_message: str | None = None,
    emergency: bool = False,
    language: str = DEFAULT_LANGUAGE,
) -> MedicalSafetyResult:
    """
    Inspect and soften AI healthcare text before it reaches the frontend.

    This is a lightweight safety layer, not a classifier. It catches common
    unsafe wording patterns and replaces them with calmer professional-care
    guidance while preserving the existing response when it is already safe.
    """
    cleaned_response = response.strip()
    if not cleaned_response:
        return MedicalSafetyResult(
            response=_fallback(language, emergency),
            medical_warning=True,
            trust_level=TRUST_GUARDED,
            reasons=("empty_response",),
            suggest_doctor=True,
        )

    triggered_reasons: list[str] = []
    suggest_doctor = _needs_professional_care(user_message)
    safe_sentences: list[str] = []

    for sentence in _split_sentences(cleaned_response):
        sentence_reasons = _sentence_reasons(sentence)
        if sentence_reasons:
            triggered_reasons.extend(sentence_reasons)
            continue
        safe_sentences.append(sentence)

    guarded = bool(triggered_reasons)
    final_response = " ".join(safe_sentences).strip()

    if guarded:
        final_response = _append_once(final_response, _fallback(language, emergency))
        suggest_doctor = True

    if emergency:
        final_response = _append_emergency_once(final_response, language)
        suggest_doctor = True

    if suggest_doctor and not emergency:
        final_response = _append_once(final_response, get_doctor_suggestion_text(language))

    final_response = _ensure_uncertainty_if_needed(final_response, language, guarded)

    return MedicalSafetyResult(
        response=final_response,
        medical_warning=guarded,
        trust_level=TRUST_GUARDED if guarded else TRUST_SAFE,
        reasons=tuple(dict.fromkeys(triggered_reasons)),
        suggest_doctor=suggest_doctor,
    )


def _sentence_reasons(sentence: str) -> list[str]:
    return [
        rule.reason
        for rule in DANGEROUS_RULES
        if any(pattern.search(sentence) for pattern in rule.patterns)
    ]


def _needs_professional_care(user_message: str | None) -> bool:
    if not user_message:
        return False
    return any(pattern.search(user_message) for pattern in PROFESSIONAL_CARE_PATTERNS)


def _ensure_uncertainty_if_needed(text: str, language: str, guarded: bool) -> str:
    if not guarded:
        return text
    uncertainty = _localized(UNCERTAINTY_TEXT, language)
    return _append_once(text, uncertainty)


def _fallback(language: str, emergency: bool) -> str:
    if emergency:
        return get_emergency_escalation_text(language)
    return _localized(SAFE_FALLBACK_TEXT, language)


def _append_emergency_once(text: str, language: str) -> str:
    addition = get_emergency_escalation_text(language)
    normalized = text.lower()
    for phrase in EMERGENCY_CORE_PHRASES.get(language, EMERGENCY_CORE_PHRASES[DEFAULT_LANGUAGE]):
        if phrase.lower() in normalized:
            return text
    return _append_once(text, addition)


def _localized(options: dict[str, str], language: str) -> str:
    return options.get(language, options[DEFAULT_LANGUAGE])


def _split_sentences(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []

    parts = re.split(r"(?<=[.!?।])\s+", normalized)
    return [part.strip() for part in parts if part.strip()]


def _append_once(text: str, addition: str) -> str:
    if addition in text:
        return text
    if not text:
        return addition
    return f"{text}\n\n{addition}"
