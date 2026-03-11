const TRANSLATIONS = {
  ar: {
    // عام
    appName: 'Toshka Barber',
    loading: 'جاري التحميل...',
    sending: 'جاري الإرسال...',
    verifying: 'جاري التحقق...',
    creatingAccount: 'جاري إنشاء الحساب...',
    signingIn: 'جاري تسجيل الدخول...',
    switchLang: 'English',

    // خطوات
    step1: 'رقم الهاتف',
    step2: 'رمز التحقق',
    step3: 'كلمة المرور',
    step4: 'البيانات',

    // الخطوة 1
    phoneTitle: 'رقم الهاتف',
    phoneSubtitle: 'أدخل رقم هاتفك المصري. سنرسل لك رمز تحقق عبر واتس آب.',
    phoneLabel: 'رقم الموبايل',
    phonePlaceholder: '01x xxxx xxxx',
    sendCode: 'إرسال الرمز',

    // الخطوة 2
    otpTitle: 'رمز التحقق',
    otpSubtitle: 'أدخل الرمز المكوّن من 6 أرقام المرسل إلى واتس آب.',
    didntReceive: 'لم يصلك الرمز؟',
    resendTimer: 'إعادة إرسال ({s}ث)',
    resendNow: 'إعادة إرسال',
    confirmCode: 'تأكيد الرمز',

    // الخطوة 3
    passTitle: 'كلمة المرور',
    passSubtitle: 'قم بتعيين كلمة مرور قوية لحماية حسابك.',
    passLabel: 'كلمة المرور',
    confirmPassLabel: 'تأكيد كلمة المرور',
    passPh: '••••••••',
    continueBtn: 'المتابعة',

    // الخطوة 4
    profileTitle: 'البيانات الشخصية',
    profileSubtitle: 'أكمل ملفك الشخصي للبدء في الحجز.',
    nameLabel: 'الاسم بالكامل (إجباري)',
    namePh: 'أدخل اسمك',
    addPhoto: 'إضافة صورة',
    createAccount: 'إنشاء الحساب',
    skipPhoto: 'تخطي الصورة',

    // تسجيل الدخول
    loginTitle: 'مرحباً بعودتك',
    loginSubtitle: 'سجّل دخولك للمتابعة.',
    loginBtn: 'تسجيل الدخول',
    noAccount: 'ليس لديك حساب؟',
    registerNow: 'سجّل الآن',
    haveAccount: 'لديك حساب بالفعل؟',
    signInNow: 'تسجيل الدخول',

    // أخطاء
    invalidPhone: 'يرجى إدخال رقم هاتف مصري صحيح (010/011/012/015).',
    fieldRequired: 'هذا الحقل مطلوب.',
    passTooShort: 'كلمة المرور 8 أحرف على الأقل.',
    passMismatch: 'كلمتا المرور غير متطابقتين.',
    invalidOtp: 'يرجى إدخال الرمز المكوّن من 6 أرقام.',
    networkError: 'خطأ في الاتصال. تحقق من الإنترنت.',
    phoneExists: 'رقم الهاتف مسجّل مسبقاً.',
    invalidCreds: 'رقم الهاتف أو كلمة المرور غير صحيحة.',
    otpExpired: 'رمز التحقق منتهي أو غير صحيح. اطلب رمزاً جديداً.',
  },
  en: {
    appName: 'Toshka Barber',
    loading: 'Loading...',
    sending: 'Sending...',
    verifying: 'Verifying...',
    creatingAccount: 'Creating Account...',
    signingIn: 'Signing In...',
    switchLang: 'العربية',

    step1: 'Phone',
    step2: 'OTP',
    step3: 'Password',
    step4: 'Profile',

    phoneTitle: 'Phone Number',
    phoneSubtitle: 'Enter your Egyptian phone number. We\'ll send a WhatsApp verification code.',
    phoneLabel: 'Mobile Number',
    phonePlaceholder: '01x xxxx xxxx',
    sendCode: 'Send Code',

    otpTitle: 'Verification Code',
    otpSubtitle: 'Enter the 6-digit code sent to your WhatsApp.',
    didntReceive: "Didn't receive the code?",
    resendTimer: 'Resend ({s}s)',
    resendNow: 'Resend Code',
    confirmCode: 'Confirm Code',

    passTitle: 'Password',
    passSubtitle: 'Set a strong password to protect your account.',
    passLabel: 'Password',
    confirmPassLabel: 'Confirm Password',
    passPh: '••••••••',
    continueBtn: 'Continue',

    profileTitle: 'Personal Info',
    profileSubtitle: 'Complete your profile to start booking.',
    nameLabel: 'Full Name (Required)',
    namePh: 'Enter your name',
    addPhoto: 'Add Photo',
    createAccount: 'Create Account',
    skipPhoto: 'Skip Photo',

    loginTitle: 'Welcome Back',
    loginSubtitle: 'Sign in to your account to continue.',
    loginBtn: 'Sign In',
    noAccount: "Don't have an account?",
    registerNow: 'Register Now',
    haveAccount: 'Already have an account?',
    signInNow: 'Sign In',

    invalidPhone: 'Please enter a valid Egyptian phone number (010/011/012/015).',
    fieldRequired: 'This field is required.',
    passTooShort: 'Password must be at least 8 characters.',
    passMismatch: 'Passwords do not match.',
    invalidOtp: 'Please enter all 6 digits.',
    networkError: 'Connection error. Please check your internet.',
    phoneExists: 'This phone number is already registered.',
    invalidCreds: 'Invalid phone number or password.',
    otpExpired: 'Verification code expired or incorrect. Request a new one.',
  }
};

class I18n {
  constructor() {
    this.lang = localStorage.getItem('toshka_lang') || 'ar';
  }

  t(key) {
    return TRANSLATIONS[this.lang]?.[key] ?? TRANSLATIONS['ar'][key] ?? key;
  }

  toggle() {
    this.lang = this.lang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('toshka_lang', this.lang);
    document.documentElement.lang = this.lang;
    document.documentElement.dir  = this.lang === 'ar' ? 'rtl' : 'ltr';
  }

  isArabic() { return this.lang === 'ar'; }
  apply() {
    document.documentElement.lang = this.lang;
    document.documentElement.dir  = this.lang === 'ar' ? 'rtl' : 'ltr';
  }
}

window.i18n = new I18n();
