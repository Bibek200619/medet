from __future__ import annotations

from dataclasses import dataclass

from backend.app.schemas.medet_response import (
    DEFAULT_INPUT_TYPE,
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
)


@dataclass(frozen=True)
class LanguageProfile:
    code: str
    display_name: str
    native_name: str
    speech_locale: str
    prompt_hint: str


@dataclass(frozen=True)
class MultilingualPromptContext:
    language: str
    display_name: str
    native_name: str
    speech_locale: str
    system_instruction: str
    user_message: str


LANGUAGE_PROFILES: dict[str, LanguageProfile] = {
    "en": LanguageProfile("en", "English", "English", "en-IN", "Respond in simple English."),
    "hi": LanguageProfile("hi", "Hindi", "हिंदी", "hi-IN", "Respond in simple Hindi."),
    "bn": LanguageProfile("bn", "Bengali", "বাংলা", "bn-IN", "Respond in simple Bengali."),
    "ne": LanguageProfile("ne", "Nepali", "नेपाली", "ne-NP", "Respond in simple Nepali."),
    "ta": LanguageProfile("ta", "Tamil", "தமிழ்", "ta-IN", "Respond in simple Tamil."),
    "kn": LanguageProfile("kn", "Kannada", "ಕನ್ನಡ", "kn-IN", "Respond in simple Kannada."),
}


FOLLOWUP_TEXT: dict[str, str] = {
    "en": (
        "I understand. Please tell me how long this has been happening, the age "
        "of the person, and whether there is fever, pain, bleeding, or weakness."
    ),
    "hi": (
        "मैं समझ रहा हूँ। कृपया बताएं यह कब से हो रहा है, व्यक्ति की उम्र क्या है, "
        "और क्या बुखार, दर्द, खून बहना या कमजोरी है।"
    ),
    "bn": (
        "আমি বুঝতে পারছি। দয়া করে বলুন এটি কতক্ষণ ধরে হচ্ছে, ব্যক্তির বয়স কত, "
        "এবং জ্বর, ব্যথা, রক্তপাত বা দুর্বলতা আছে কি না।"
    ),
    "ne": (
        "म बुझ्दैछु। कृपया यो कहिलेदेखि भइरहेको छ, व्यक्तिको उमेर कति हो, "
        "र ज्वरो, दुखाइ, रगत बग्ने वा कमजोरी छ कि छैन बताउनुहोस्।"
    ),
    "ta": (
        "நான் புரிந்து கொள்கிறேன். இது எப்போது முதல் உள்ளது, அந்த நபரின் வயது என்ன, "
        "காய்ச்சல், வலி, ரத்தப்போக்கு அல்லது பலவீனம் உள்ளதா என்பதை சொல்லுங்கள்."
    ),
    "kn": (
        "ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ಇದು ಎಷ್ಟು ಸಮಯದಿಂದ ಇದೆ, ಆ ವ್ಯಕ್ತಿಯ ವಯಸ್ಸು ಎಷ್ಟು, "
        "ಜ್ವರ, ನೋವು, ರಕ್ತಸ್ರಾವ ಅಥವಾ ದುರ್ಬಲತೆ ಇದೆಯೇ ಎಂದು ಹೇಳಿ."
    ),
}


EMERGENCY_ESCALATION_TEXT: dict[str, str] = {
    "en": (
        "This may be serious. Please seek medical help immediately. Contact a nearby "
        "health worker, clinic, ambulance, or emergency service now. I cannot diagnose "
        "this, but these symptoms need urgent attention."
    ),
    "hi": (
        "यह गंभीर हो सकता है। कृपया तुरंत पास के स्वास्थ्य कार्यकर्ता, क्लिनिक, "
        "एम्बुलेंस या आपात सेवा से मदद लें। मैं बीमारी की पक्की पहचान नहीं कर सकता, "
        "लेकिन इन लक्षणों में तुरंत ध्यान जरूरी है।"
    ),
    "bn": (
        "এটি গুরুতর হতে পারে। দয়া করে এখনই কাছের স্বাস্থ্যকর্মী, ক্লিনিক, "
        "অ্যাম্বুলেন্স বা জরুরি সেবার সাহায্য নিন। আমি নিশ্চিত রোগ বলতে পারি না, "
        "কিন্তু এই লক্ষণগুলোতে দ্রুত চিকিৎসা দরকার।"
    ),
    "ne": (
        "यो गम्भीर हुन सक्छ। कृपया तुरुन्त नजिकको स्वास्थ्यकर्मी, क्लिनिक, "
        "एम्बुलेन्स वा आपतकालीन सेवामा सम्पर्क गर्नुहोस्। म पक्का रोग भन्न सक्दिन, "
        "तर यी लक्षणमा छिटो जाँच जरूरी छ।"
    ),
    "ta": (
        "இது தீவிரமாக இருக்கலாம். தயவு செய்து உடனே அருகிலுள்ள சுகாதார பணியாளர், "
        "மருத்துவமனை, ஆம்புலன்ஸ் அல்லது அவசர சேவையை தொடர்பு கொள்ளுங்கள். நான் உறுதியான "
        "நோயறிதல் சொல்ல முடியாது, ஆனால் இந்த அறிகுறிகளுக்கு உடனடி கவனம் தேவை."
    ),
    "kn": (
        "ಇದು ಗಂಭೀರವಾಗಿರಬಹುದು. ದಯವಿಟ್ಟು ಈಗಲೇ ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರು, ಕ್ಲಿನಿಕ್, "
        "ಆಂಬುಲೆನ್ಸ್ ಅಥವಾ ತುರ್ತು ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ. ನಾನು ಖಚಿತ ರೋಗನಿರ್ಣಯ ಹೇಳಲು ಸಾಧ್ಯವಿಲ್ಲ, "
        "ಆದರೆ ಈ ಲಕ್ಷಣಗಳಿಗೆ ತಕ್ಷಣ ಗಮನ ಬೇಕು."
    ),
}


DOCTOR_SUGGESTION_TEXT: dict[str, str] = {
    "en": (
        "Please try to speak with a doctor or trained health worker, especially if this "
        "is getting worse, lasting long, or happening to a child, pregnant person, or elder."
    ),
    "hi": (
        "कृपया डॉक्टर या प्रशिक्षित स्वास्थ्य कार्यकर्ता से बात करने की कोशिश करें, "
        "खासकर अगर समस्या बढ़ रही है, लंबे समय से है, या बच्चा, गर्भवती व्यक्ति या बुजुर्ग प्रभावित हैं।"
    ),
    "bn": (
        "দয়া করে ডাক্তার বা প্রশিক্ষিত স্বাস্থ্যকর্মীর সঙ্গে কথা বলার চেষ্টা করুন, "
        "বিশেষ করে সমস্যা বাড়লে, দীর্ঘ সময় থাকলে, বা শিশু, গর্ভবতী ব্যক্তি বা বয়স্ক মানুষ আক্রান্ত হলে।"
    ),
    "ne": (
        "कृपया डाक्टर वा तालिमप्राप्त स्वास्थ्यकर्मीसँग कुरा गर्ने प्रयास गर्नुहोस्, "
        "विशेष गरी समस्या बढ्दैछ, लामो समय छ, वा बच्चा, गर्भवती व्यक्ति वा वृद्धलाई भएको छ भने।"
    ),
    "ta": (
        "தயவு செய்து மருத்துவர் அல்லது பயிற்சி பெற்ற சுகாதார பணியாளரிடம் பேச முயற்சிக்கவும், "
        "குறிப்பாக பிரச்சனை அதிகரித்தால், நீண்ட நேரம் இருந்தால், அல்லது குழந்தை, கர்ப்பிணி நபர், முதியவர் பாதிக்கப்பட்டால்."
    ),
    "kn": (
        "ದಯವಿಟ್ಟು ವೈದ್ಯರು ಅಥವಾ ತರಬೇತಿ ಪಡೆದ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರೊಂದಿಗೆ ಮಾತನಾಡಲು ಪ್ರಯತ್ನಿಸಿ, "
        "ವಿಶೇಷವಾಗಿ ಸಮಸ್ಯೆ ಹೆಚ್ಚುತ್ತಿದ್ದರೆ, ಹೆಚ್ಚು ಕಾಲ ಇದ್ದರೆ, ಅಥವಾ ಮಗು, ಗರ್ಭಿಣಿ ವ್ಯಕ್ತಿ ಅಥವಾ ಹಿರಿಯರಿಗೆ ಆಗಿದ್ದರೆ."
    ),
}


def get_language_profile(language: str | None) -> LanguageProfile:
    code = (language or DEFAULT_LANGUAGE).lower()
    if code not in SUPPORTED_LANGUAGES:
        code = DEFAULT_LANGUAGE
    return LANGUAGE_PROFILES[code]


def build_multilingual_prompt_context(
    *,
    message: str,
    language: str | None,
    input_type: str = DEFAULT_INPUT_TYPE,
) -> MultilingualPromptContext:
    profile = get_language_profile(language)
    voice_note = (
        "The user message came from speech-to-text, so tolerate short phrases, "
        "unclear grammar, and transcription mistakes."
        if input_type == "voice"
        else "The user message came from typed text."
    )

    system_instruction = "\n".join(
        (
            "You are Medet AI, a multilingual rural healthcare assistant.",
            "Never claim to be a doctor and never give a final diagnosis.",
            "Use calm, simple, non-technical language for people with limited medical knowledge.",
            "Ask one or two helpful follow-up questions when details are missing.",
            "If there are emergency warning signs, clearly recommend immediate medical attention.",
            "Avoid dangerous home-treatment confidence and avoid fear-inducing language.",
            f"{profile.prompt_hint} Keep the response in {profile.native_name}.",
            voice_note,
        )
    )

    return MultilingualPromptContext(
        language=profile.code,
        display_name=profile.display_name,
        native_name=profile.native_name,
        speech_locale=profile.speech_locale,
        system_instruction=system_instruction,
        user_message=message,
    )


def get_followup_text(language: str | None) -> str:
    profile = get_language_profile(language)
    return FOLLOWUP_TEXT[profile.code]


def get_emergency_escalation_text(language: str | None) -> str:
    profile = get_language_profile(language)
    return EMERGENCY_ESCALATION_TEXT[profile.code]


def get_doctor_suggestion_text(language: str | None) -> str:
    profile = get_language_profile(language)
    return DOCTOR_SUGGESTION_TEXT[profile.code]
