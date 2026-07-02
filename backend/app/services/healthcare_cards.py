from __future__ import annotations

import re

from app.schemas.medet_response import DEFAULT_LANGUAGE, MedetCard
from app.services.language_support import get_language_profile


MAX_CARDS = 5


CARD_COPY: dict[str, dict[str, tuple[str, str]]] = {
    "en": {
        "emergency": ("Emergency Warning", "Please seek medical help immediately. Contact a nearby health worker, clinic, ambulance, or emergency service now."),
        "action": ("Recommended Action", "Rest in a safe place, keep the person comfortable, and watch symptoms closely."),
        "hydration": ("Fluids", "Drink clean water or oral rehydration fluid in small sips, especially with fever, vomiting, loose motion, or heat."),
        "medication": ("Medicine Safety", "Take only medicines given by a doctor or trained health worker. Do not change dose without medical advice."),
        "doctor_visit": ("Talk To A Health Worker", "Please speak with a doctor or trained health worker if symptoms are severe, worsening, or not improving."),
        "symptom_warning": ("Watch Warning Signs", "Get urgent help if there is breathing trouble, chest pain, fainting, heavy bleeding, seizures, or sudden weakness."),
        "nutrition": ("Food And Strength", "Eat light, simple food if able. For weakness, add soft foods like rice, soup, banana, or curd if available."),
        "followup": ("Follow Up", "Tell me the person’s age, how long this has been happening, and whether symptoms are getting better or worse."),
    },
    "hi": {
        "emergency": ("आपात चेतावनी", "कृपया तुरंत पास के स्वास्थ्य कार्यकर्ता, क्लिनिक, एम्बुलेंस या आपात सेवा से मदद लें।"),
        "action": ("सुझाया गया कदम", "सुरक्षित जगह पर आराम करें, व्यक्ति को आरामदायक रखें, और लक्षणों पर ध्यान दें।"),
        "hydration": ("पानी और तरल", "बुखार, उल्टी, दस्त या गर्मी में साफ पानी या ओआरएस छोटे घूंट में दें।"),
        "medication": ("दवा सुरक्षा", "सिर्फ डॉक्टर या प्रशिक्षित स्वास्थ्य कार्यकर्ता की बताई दवा लें। बिना सलाह खुराक न बदलें।"),
        "doctor_visit": ("स्वास्थ्य कार्यकर्ता से बात करें", "लक्षण तेज हों, बढ़ रहे हों या ठीक न हो रहे हों तो डॉक्टर या स्वास्थ्य कार्यकर्ता से बात करें।"),
        "symptom_warning": ("चेतावनी लक्षण देखें", "सांस में दिक्कत, सीने में दर्द, बेहोशी, ज्यादा खून, दौरा या अचानक कमजोरी हो तो तुरंत मदद लें।"),
        "nutrition": ("खाना और ताकत", "अगर खा सकते हैं तो हल्का खाना लें। कमजोरी में चावल, सूप, केला या दही मदद कर सकते हैं।"),
        "followup": ("आगे की जानकारी", "कृपया उम्र, समस्या कब से है, और लक्षण बढ़ रहे हैं या कम हो रहे हैं बताएं।"),
    },
    "bn": {
        "emergency": ("জরুরি সতর্কতা", "দয়া করে এখনই কাছের স্বাস্থ্যকর্মী, ক্লিনিক, অ্যাম্বুলেন্স বা জরুরি সেবার সাহায্য নিন।"),
        "action": ("প্রস্তাবিত কাজ", "নিরাপদ জায়গায় বিশ্রাম নিন, ব্যক্তিকে আরামে রাখুন, এবং লক্ষণ ভালো করে দেখুন।"),
        "hydration": ("পানি ও তরল", "জ্বর, বমি, পাতলা পায়খানা বা গরমে পরিষ্কার পানি বা ওআরএস অল্প অল্প করে পান করুন।"),
        "medication": ("ওষুধ নিরাপত্তা", "শুধু ডাক্তার বা প্রশিক্ষিত স্বাস্থ্যকর্মীর দেওয়া ওষুধ নিন। পরামর্শ ছাড়া ডোজ বদলাবেন না।"),
        "doctor_visit": ("স্বাস্থ্যকর্মীর সঙ্গে কথা বলুন", "লক্ষণ বেশি হলে, বাড়লে বা না কমলে ডাক্তার বা স্বাস্থ্যকর্মীর সঙ্গে কথা বলুন।"),
        "symptom_warning": ("সতর্ক লক্ষণ দেখুন", "শ্বাসকষ্ট, বুকে ব্যথা, অজ্ঞান, বেশি রক্তপাত, খিঁচুনি বা হঠাৎ দুর্বলতা হলে জরুরি সাহায্য নিন।"),
        "nutrition": ("খাবার ও শক্তি", "খেতে পারলে হালকা খাবার খান। দুর্বলতায় ভাত, স্যুপ, কলা বা দই সহায়ক হতে পারে।"),
        "followup": ("আরও তথ্য", "ব্যক্তির বয়স, কতক্ষণ ধরে হচ্ছে, এবং লক্ষণ বাড়ছে না কমছে তা বলুন।"),
    },
    "ne": {
        "emergency": ("आपतकालीन चेतावनी", "कृपया तुरुन्त नजिकको स्वास्थ्यकर्मी, क्लिनिक, एम्बुलेन्स वा आपतकालीन सेवामा सम्पर्क गर्नुहोस्।"),
        "action": ("सुझाव गरिएको कदम", "सुरक्षित ठाउँमा आराम गर्नुहोस्, व्यक्तिलाई सहज राख्नुहोस्, र लक्षण ध्यान दिनुहोस्।"),
        "hydration": ("पानी र तरल", "ज्वरो, बान्ता, पखाला वा गर्मीमा सफा पानी वा ओआरएस साना घुट्कामा पिउनुहोस्।"),
        "medication": ("औषधि सुरक्षा", "डाक्टर वा तालिमप्राप्त स्वास्थ्यकर्मीले दिएको औषधि मात्र लिनुहोस्। सल्लाह बिना मात्रा नबदल्नुहोस्।"),
        "doctor_visit": ("स्वास्थ्यकर्मीसँग कुरा गर्नुहोस्", "लक्षण कडा, बढ्दै गएको वा निको नभएको छ भने डाक्टर वा स्वास्थ्यकर्मीसँग कुरा गर्नुहोस्।"),
        "symptom_warning": ("चेतावनी लक्षण हेर्नुहोस्", "सास फेर्न गाह्रो, छाती दुखाइ, बेहोस, धेरै रगत, खिँचुनी वा अचानक कमजोरी भए तुरुन्त मद्दत लिनुहोस्।"),
        "nutrition": ("खाना र शक्ति", "खान सक्नुहुन्छ भने हल्का खाना खानुहोस्। कमजोरीमा भात, सुप, केरा वा दही उपयोगी हुन सक्छ।"),
        "followup": ("थप जानकारी", "व्यक्तिको उमेर, समस्या कहिलेदेखि छ, र लक्षण बढ्दैछ कि घट्दैछ बताउनुहोस्।"),
    },
    "ta": {
        "emergency": ("அவசர எச்சரிக்கை", "தயவு செய்து உடனே அருகிலுள்ள சுகாதார பணியாளர், மருத்துவமனை, ஆம்புலன்ஸ் அல்லது அவசர சேவையை தொடர்பு கொள்ளுங்கள்."),
        "action": ("பரிந்துரைக்கப்பட்ட செயல்", "பாதுகாப்பான இடத்தில் ஓய்வு எடுக்கவும், நபரை சௌகரியமாக வைத்திருக்கவும், அறிகுறிகளை கவனிக்கவும்."),
        "hydration": ("தண்ணீர்", "காய்ச்சல், வாந்தி, வயிற்றுப்போக்கு அல்லது வெப்பத்தில் சுத்தமான தண்ணீர் அல்லது ஓஆர்எஸ் சிறிது சிறிதாக குடிக்கவும்."),
        "medication": ("மருந்து பாதுகாப்பு", "மருத்துவர் அல்லது பயிற்சி பெற்ற சுகாதார பணியாளர் கூறிய மருந்துகளை மட்டும் எடுத்துக் கொள்ளுங்கள். ஆலோசனை இல்லாமல் அளவை மாற்ற வேண்டாம்."),
        "doctor_visit": ("சுகாதார பணியாளரிடம் பேசுங்கள்", "அறிகுறிகள் கடுமையாக இருந்தால், அதிகரித்தால் அல்லது குறையாவிட்டால் மருத்துவர் அல்லது சுகாதார பணியாளரிடம் பேசுங்கள்."),
        "symptom_warning": ("எச்சரிக்கை அறிகுறிகள்", "மூச்சு சிரமம், மார்பு வலி, மயக்கம், அதிக ரத்தப்போக்கு, வலிப்பு அல்லது திடீர் பலவீனம் இருந்தால் அவசர உதவி பெறுங்கள்."),
        "nutrition": ("உணவு மற்றும் சக்தி", "சாப்பிட முடிந்தால் எளிய உணவு சாப்பிடுங்கள். பலவீனத்தில் சாதம், சூப், வாழை அல்லது தயிர் உதவலாம்."),
        "followup": ("மேலும் தகவல்", "வயது, இது எப்போது முதல் உள்ளது, அறிகுறிகள் மேம்படுகிறதா மோசமடைகிறதா என்று சொல்லுங்கள்."),
    },
    "kn": {
        "emergency": ("ತುರ್ತು ಎಚ್ಚರಿಕೆ", "ದಯವಿಟ್ಟು ಈಗಲೇ ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರು, ಕ್ಲಿನಿಕ್, ಆಂಬುಲೆನ್ಸ್ ಅಥವಾ ತುರ್ತು ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ."),
        "action": ("ಸೂಚಿಸಿದ ಕ್ರಮ", "ಸುರಕ್ಷಿತ ಸ್ಥಳದಲ್ಲಿ ವಿಶ್ರಾಂತಿ ಮಾಡಿ, ವ್ಯಕ್ತಿಯನ್ನು ಆರಾಮವಾಗಿರಿಸಿ, ಮತ್ತು ಲಕ್ಷಣಗಳನ್ನು ಗಮನಿಸಿ."),
        "hydration": ("ನೀರು ಮತ್ತು ದ್ರವ", "ಜ್ವರ, ವಾಂತಿ, ಜುಳುಜುಳು ಮಲ ಅಥವಾ ಬಿಸಿಲಿನಲ್ಲಿ ಶುದ್ಧ ನೀರು ಅಥವಾ ಓಆರ್ಎಸ್ ಅನ್ನು ಸಣ್ಣ ಸಿಪ್‌ಗಳಲ್ಲಿ ಕುಡಿಯಿರಿ."),
        "medication": ("ಔಷಧಿ ಸುರಕ್ಷತೆ", "ವೈದ್ಯರು ಅಥವಾ ತರಬೇತಿ ಪಡೆದ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರು ಹೇಳಿದ ಔಷಧಿಯನ್ನು ಮಾತ್ರ ತೆಗೆದುಕೊಳ್ಳಿ. ಸಲಹೆ ಇಲ್ಲದೆ ಡೋಸ್ ಬದಲಾಯಿಸಬೇಡಿ."),
        "doctor_visit": ("ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರೊಂದಿಗೆ ಮಾತನಾಡಿ", "ಲಕ್ಷಣಗಳು ತೀವ್ರವಾಗಿದ್ದರೆ, ಹೆಚ್ಚುತ್ತಿದ್ದರೆ ಅಥವಾ ಕಡಿಮೆಯಾಗದಿದ್ದರೆ ವೈದ್ಯರು ಅಥವಾ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರನ್ನು ಸಂಪರ್ಕಿಸಿ."),
        "symptom_warning": ("ಎಚ್ಚರಿಕೆ ಲಕ್ಷಣಗಳು", "ಉಸಿರಾಟ ಕಷ್ಟ, ಎದೆ ನೋವು, ಪ್ರಜ್ಞೆ ತಪ್ಪುವುದು, ಹೆಚ್ಚು ರಕ್ತ, ಫಿಟ್ಸ್ ಅಥವಾ ಅಕಸ್ಮಾತ್ ದುರ್ಬಲತೆ ಇದ್ದರೆ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ."),
        "nutrition": ("ಆಹಾರ ಮತ್ತು ಶಕ್ತಿ", "ತಿನ್ನಲು ಸಾಧ್ಯವಾದರೆ ಹಗುರವಾದ ಆಹಾರ ತಿನ್ನಿ. ದುರ್ಬಲತೆಯಲ್ಲಿ ಅನ್ನ, ಸೂಪ್, ಬಾಳೆಹಣ್ಣು ಅಥವಾ ಮೊಸರು ಸಹಾಯ ಮಾಡಬಹುದು."),
        "followup": ("ಹೆಚ್ಚಿನ ಮಾಹಿತಿ", "ವಯಸ್ಸು, ಇದು ಎಷ್ಟು ಸಮಯದಿಂದ ಇದೆ, ಮತ್ತು ಲಕ್ಷಣಗಳು ಹೆಚ್ಚುತ್ತಿವೆಯೇ ಕಡಿಮೆಯಾಗುತ್ತಿವೆಯೇ ಹೇಳಿ."),
    },
}


HYDRATION_PATTERNS = (
    re.compile(r"\b(fever|vomit|vomiting|diarrhea|loose motion|dehydration|heat|headache|cough)\b", re.IGNORECASE),
    re.compile(r"(बुखार|उल्टी|दस्त|पानी|ज्वरो|बान्ता|पखाला|জ্বর|বমি|পাতলা পায়খানা|காய்ச்சல்|வாந்தி|வயிற்றுப்போக்கு|ಜ್ವರ|ವಾಂತಿ)", re.IGNORECASE),
)
MEDICATION_PATTERNS = (
    re.compile(r"\b(medicine|medication|tablet|pill|dose|antibiotic|paracetamol|painkiller|insulin)\b", re.IGNORECASE),
    re.compile(r"(दवा|औषधि|ওষুধ|மருந்து|ಔಷಧಿ|ಮಾತ್ರೆ)", re.IGNORECASE),
)
NUTRITION_PATTERNS = (
    re.compile(r"\b(weak|weakness|tired|nutrition|food|eat|appetite|pregnant)\b", re.IGNORECASE),
    re.compile(r"(कमजोरी|खाना|भोक|দুর্বল|খাবার|சோர்வு|உணவு|ಹಸಿವು|ದುರ್ಬಲ)", re.IGNORECASE),
)
WARNING_PATTERNS = (
    re.compile(r"\b(worse|worsening|severe|high fever|not improving|many days|persistent)\b", re.IGNORECASE),
    re.compile(r"(बढ़|गंभीर|तेज|बढ्दै|धेरै|বাড়ছে|গুরুতর|அதிகரித்தால்|கடுமை|ಹೆಚ್ಚು|ತೀವ್ರ)", re.IGNORECASE),
)


def build_healthcare_cards(
    *,
    response: str,
    user_message: str | None,
    emergency: bool,
    severity: str,
    suggest_doctor: bool,
    medical_warning: bool,
    trust_level: str,
    language: str,
) -> list[MedetCard]:
    """Build lightweight UI cards from Medet response metadata and symptoms."""
    del trust_level
    text = f"{user_message or ''} {response}".strip()
    card_types: list[str] = []

    if emergency:
        card_types.extend(("emergency", "action", "doctor_visit", "symptom_warning"))
    else:
        card_types.append("action")

        if _matches_any(text, HYDRATION_PATTERNS):
            card_types.append("hydration")
        if _matches_any(text, MEDICATION_PATTERNS) or medical_warning:
            card_types.append("medication")
        if suggest_doctor or severity in {"medium", "high"}:
            card_types.append("doctor_visit")
        if _matches_any(text, WARNING_PATTERNS) or medical_warning:
            card_types.append("symptom_warning")
        if _matches_any(text, NUTRITION_PATTERNS):
            card_types.append("nutrition")

        card_types.append("followup")

    return [_card(card_type, language) for card_type in _dedupe(card_types)[:MAX_CARDS]]


def _card(card_type: str, language: str) -> MedetCard:
    copy = CARD_COPY.get(get_language_profile(language).code, CARD_COPY[DEFAULT_LANGUAGE])
    title, content = copy[card_type]
    return MedetCard(type=card_type, title=title, content=content)


def _matches_any(text: str, patterns: tuple[re.Pattern[str], ...]) -> bool:
    return any(pattern.search(text) for pattern in patterns)


def _dedupe(items: list[str]) -> list[str]:
    return list(dict.fromkeys(items))
