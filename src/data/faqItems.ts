export interface ClinicFaqItem {
  qEn: string;
  qHi: string;
  aEn: string;
  aHi: string;
}

export const CLINIC_FAQ_ITEMS: ClinicFaqItem[] = [
  {
    qEn: 'Is my online appointment confirmed immediately after submitting the form?',
    qHi: 'फॉर्म सबमिट करने के तुरंत बाद क्या मेरा अपॉइंटमेंट कन्फर्म हो जाता है?',
    aEn: 'Every online submission is logged immediately as a Pending Request and your time slot is held against double booking. Our clinic reception desk verifies doctor availability and confirms the appointment, after which your portal status updates to Confirmed.',
    aHi: 'प्रत्येक ऑनलाइन बुकिंग तुरंत "पुष्टि की प्रतीक्षा" अनुरोध के रूप में दर्ज होती है और आपका स्लॉट डबल-बुकिंग से सुरक्षित रहता है। क्लिनिक रिसेप्शन द्वारा चिकित्सक समय की जांच के बाद स्थिति "कन्फर्म" हो जाती है।',
  },
  {
    qEn: 'Can I attach previous lab reports or prescriptions before visiting?',
    qHi: 'क्या मैं परामर्श से पहले पिछली जांच रिपोर्ट या पर्चे अपलोड कर सकता हूँ?',
    aEn: 'Yes. During Step 6 of appointment booking, you may optionally upload up to three PDF, PNG, or JPG files (up to 2 MB each) so your specialist can review your medical history ahead of your visit.',
    aHi: 'हाँ। अपॉइंटमेंट बुकिंग के चरण 6 में आप वैकल्पिक रूप से अधिकतम तीन PDF, PNG या JPG फ़ाइलें (प्रत्येक अधिकतम 2 MB) संलग्न कर सकते हैं।',
  },
  {
    qEn: 'How do I cancel or reschedule an appointment?',
    qHi: 'मैं अपॉइंटमेंट रद्द या पुनः निर्धारित कैसे कर सकता हूँ?',
    aEn: 'Sign in to your Patient Portal to cancel any pending or confirmed visit, or call our reception desk during clinic hours (Monday–Saturday, 08:30 AM – 08:00 PM) for assisted rescheduling.',
    aHi: 'आप अपने रोगी पोर्टल में लॉगिन करके किसी भी लंबित या कन्फर्म अपॉइंटमेंट को रद्द कर सकते हैं, या समय बदलने के लिए क्लिनिक समय में रिसेप्शन डेस्क पर कॉल कर सकते हैं।',
  },
  {
    qEn: 'Are consultations available in both English and Hindi?',
    qHi: 'क्या चिकित्सक परामर्श और वेबसाइट दोनों हिन्दी और अंग्रेज़ी में उपलब्ध हैं?',
    aEn: 'Yes. All clinic specialists listed on our website communicate comfortably in both English and Hindi, and you can switch the website language anytime using the top navigation bar without losing booking progress.',
    aHi: 'हाँ। हमारे सभी विशेषज्ञ चिकित्सक हिन्दी और अंग्रेज़ी दोनों में परामर्श देते हैं, और आप शीर्ष नेविगेशन से कभी भी भाषा बदल सकते हैं।',
  },
  {
    qEn: 'Does Arogya Multi-Specialty Clinic handle emergency or inpatient admissions?',
    qHi: 'क्या आरोग्य मल्टी-स्पेशलिटी क्लिनिक में आपातकालीन या भर्ती सुविधा उपलब्ध है?',
    aEn: 'No. We are a dedicated outpatient consultation clinic. For medical emergencies requiring urgent intervention or hospitalization, please proceed directly to the nearest emergency hospital.',
    aHi: 'नहीं। यह एक समर्पित बाह्य रोगी (OPD) क्लिनिक है। गंभीर या आपातकालीन चिकित्सा स्थिति में कृपया तुरंत निकटतम आपातकालीन अस्पताल जाएं।',
  },
];
