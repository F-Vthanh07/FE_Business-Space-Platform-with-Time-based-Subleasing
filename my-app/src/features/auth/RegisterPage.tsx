import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { gsap } from 'gsap';
import { Turnstile } from '@marsidev/react-turnstile';
import { API_BASE_URL } from '../../config/api';
import './AuthPage.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();

  // States cho Form đăng ký
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Date of Birth state split
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  
  // Gender state
  const [gender, setGender] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States cho OTP
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Turnstile State
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  // States thông báo & loading
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Lists for DOB dropdowns
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Real-time password requirement checkers
  const passMet6Char = password.length >= 6;
  const passMetLetters = /[a-zA-Z]/.test(password);
  const passMetNumbers = /[0-9]/.test(password);

  // GSAP Entrance animation
  useEffect(() => {
    gsap.fromTo(cardRef.current, 
      { opacity: 0, y: 30, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (showOtpForm) {
      await handleVerifyOtp();
    } else {
      await handleRegister();
    }
  };

  // --- API REGISTER ---
  const handleRegister = async () => {
    if (!email.trim() || !password || !name || !phoneNumber || !dobDay || !dobMonth || !dobYear || !gender) {
      setError(language === 'en' ? 'Please fill in all fields.' : 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    // Password requirements check
    if (!passMet6Char || !passMetLetters || !passMetNumbers) {
      setError(language === 'en' ? 'Password does not meet all requirements.' : 'Mật khẩu chưa đáp ứng đủ yêu cầu.');
      return;
    }

    // Mật khẩu xác nhận validation
    if (password !== confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match.' : 'Mật khẩu xác nhận không khớp.');
      return;
    }

    // Check age limit (>= 16)
    const birthDate = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      setError(language === 'en' ? 'You must be at least 16 years old.' : 'Bạn phải từ 16 tuổi trở lên.');
      return;
    }

    // Turnstile check
    if (!turnstileToken) {
      setError(language === 'en' ? 'Please verify you are human.' : 'Vui lòng xác thực bạn không phải là robot.');
      return;
    }

    setIsLoading(true);
    try {
      const dobISO = birthDate.toISOString();

      const response = await fetch(`${API_BASE_URL}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify({ 
          email, 
          password, 
          dob: dobISO, 
          phoneNumber, 
          name, 
          turnstileToken
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || (language === 'en' ? 'Registration failed.' : 'Đăng ký thất bại.'));
      }

      setShowOtpForm(true);
      setSuccessMsg(language === 'en' ? 'Success! Please check your email for OTP.' : 'Thành công! Vui lòng kiểm tra email để nhận mã OTP.');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Register Error:', err);
      setError(err.message || 'Không thể kết nối đến máy chủ.');
      setTurnstileToken(''); 
      setTurnstileKey((prev) => prev + 1); 
    } finally {
      setIsLoading(false);
    }
  };

  // --- API VERIFY OTP ---
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError(language === 'en' ? 'Please enter the OTP code.' : 'Vui lòng nhập mã OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify({ email, otpCode })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || (language === 'en' ? 'Invalid OTP.' : 'Xác thực OTP thất bại.'));
      }

      setSuccessMsg(language === 'en' ? 'Account verified! You can now log in.' : 'Tài khoản đã xác thực! Bạn có thể đăng nhập.');
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      setError(err.message || 'Lỗi xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  const trans = {
    createAcc: language === 'en' ? 'Create an account' : 'Tạo tài khoản mới',
    verifyAcc: language === 'en' ? 'Verify Account' : 'Xác thực tài khoản',
    emailPlaceholder: language === 'en' ? 'Enter Email' : 'Nhập địa chỉ Email',
    passPlaceholder: language === 'en' ? 'Enter Password' : 'Nhập Mật khẩu',
    confirmPassPlaceholder: language === 'en' ? 'Confirm Password' : 'Xác nhận Mật khẩu',
    namePlaceholder: language === 'en' ? 'Full Name' : 'Họ và tên',
    phonePlaceholder: language === 'en' ? 'Phone Number' : 'Số điện thoại',
    otpPlaceholder: language === 'en' ? 'Enter 6-digit OTP' : 'Nhập mã OTP 6 số',
    signUp: language === 'en' ? (isLoading ? 'Creating...' : 'Sign Up') : (isLoading ? 'Đang tạo...' : 'Đăng ký'),
    verifyBtn: language === 'en' ? (isLoading ? 'Verifying...' : 'Verify OTP') : (isLoading ? 'Đang xác thực...' : 'Xác nhận OTP'),
    haveAccount: language === 'en' ? 'Already have an account ?' : 'Đã có tài khoản ?',
    signInIt: language === 'en' ? 'Sign In!' : 'Đăng nhập ngay!',
    dobLabel: language === 'en' ? 'Date of Birth' : 'Ngày sinh',
    genderLabel: language === 'en' ? 'Gender' : 'Giới tính',
    ageHint: language === 'en' ? 'You must be at least 16 years old' : 'Bạn phải từ 16 tuổi trở lên',
    male: language === 'en' ? 'Male' : 'Nam',
    female: language === 'en' ? 'Female' : 'Nữ',
    other: language === 'en' ? 'Other' : 'Khác',
    selectGender: language === 'en' ? 'Select gender' : 'Chọn giới tính',
    day: language === 'en' ? 'Day' : 'Ngày',
    month: language === 'en' ? 'Month' : 'Tháng',
    year: language === 'en' ? 'Year' : 'Năm',
  };

  return (
    <div className="auth-wrapper">
      <div ref={cardRef} className="auth-container">
        
        {/* VISUAL PANEL */}
        <div className="auth-visual-panel">
          <button className="auth-back-btn" onClick={() => navigate('/')}>
            ← {language === 'en' ? 'Back to Home' : 'Về trang chủ'}
          </button>
          <img 
            ref={imgRef}
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000" 
            alt="Space" 
            className="auth-visual-img" 
          />
          <div className="auth-visual-overlay"></div>
        </div>

        {/* FORM PANEL */}
        <div className="auth-form-panel">
          
          <div ref={formContainerRef} className="auth-anim-wrapper">
            
            <div className="auth-header">
              <h1>{showOtpForm ? trans.verifyAcc : trans.createAcc}</h1>
            </div>

            {successMsg && <div className="auth-success-msg">{successMsg}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              
              {showOtpForm ? (
                <div className="auth-field-group">
                  <label className="auth-label">{trans.otpPlaceholder} <span>*</span></label>
                  <div className="auth-input-wrapper">
                    <input 
                      type="text" 
                      className="auth-input" 
                      placeholder={trans.otpPlaceholder}
                      value={otpCode} 
                      onChange={(e) => setOtpCode(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Full Name */}
                  <div className="auth-field-group">
                    <label className="auth-label">{trans.namePlaceholder} <span>*</span></label>
                    <div className="auth-input-wrapper">
                      <input 
                        type="text" 
                        className="auth-input" 
                        placeholder={trans.namePlaceholder} 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        disabled={isLoading} 
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="auth-field-group">
                    <label className="auth-label">{trans.phonePlaceholder} <span>*</span></label>
                    <div className="auth-input-wrapper">
                      <input 
                        type="tel" 
                        className="auth-input" 
                        placeholder={trans.phonePlaceholder} 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)} 
                        disabled={isLoading} 
                      />
                    </div>
                  </div>

                  {/* Date of Birth split select */}
                  <div className="auth-field-group">
                    <label className="auth-label">{trans.dobLabel} <span>*</span></label>
                    <div className="dob-selects">
                      <select 
                        className="dob-select" 
                        value={dobDay} 
                        onChange={(e) => setDobDay(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="">{trans.day}</option>
                        {days.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>

                      <select 
                        className="dob-select" 
                        value={dobMonth} 
                        onChange={(e) => setDobMonth(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="">{trans.month}</option>
                        {months.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      <select 
                        className="dob-select" 
                        value={dobYear} 
                        onChange={(e) => setDobYear(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="">{trans.year}</option>
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="dob-hint">{trans.ageHint}</div>
                  </div>

                  {/* Gender Select */}
                  <div className="auth-field-group">
                    <label className="auth-label">{trans.genderLabel} <span>*</span></label>
                    <select 
                      className="gender-select" 
                      value={gender} 
                      onChange={(e) => setGender(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">{trans.selectGender}</option>
                      <option value="male">{trans.male}</option>
                      <option value="female">{trans.female}</option>
                      <option value="other">{trans.other}</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div className="auth-field-group">
                    <label className="auth-label">Email <span>*</span></label>
                    <div className="auth-input-wrapper">
                      <input 
                        type="email" 
                        className="auth-input" 
                        placeholder={trans.emailPlaceholder} 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        disabled={isLoading} 
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="auth-field-group">
                    <label className="auth-label">Password <span>*</span></label>
                    <div className="auth-input-wrapper">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        className="auth-input" 
                        placeholder={trans.passPlaceholder} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        disabled={isLoading} 
                        style={{ paddingRight: '50px' }}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          // Eye off SVG
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          // Eye SVG
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>

                    {/* Interactive password requirement list */}
                    <div className="pass-check-list">
                      <div className={`pass-check-item ${passMet6Char ? 'met' : ''}`}>
                        <span className="pass-check-icon">{passMet6Char ? '✓' : '○'}</span>
                        <span>{language === 'en' ? 'At least 6 characters' : 'Ít nhất 6 ký tự'}</span>
                      </div>
                      <div className={`pass-check-item ${passMetLetters ? 'met' : ''}`}>
                        <span className="pass-check-icon">{passMetLetters ? '✓' : '○'}</span>
                        <span>{language === 'en' ? 'Contains letters' : 'Chứa chữ cái'}</span>
                      </div>
                      <div className={`pass-check-item ${passMetNumbers ? 'met' : ''}`}>
                        <span className="pass-check-icon">{passMetNumbers ? '✓' : '○'}</span>
                        <span>{language === 'en' ? 'Contains numbers' : 'Chứa chữ số'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="auth-field-group">
                    <label className="auth-label">{trans.confirmPassPlaceholder} <span>*</span></label>
                    <div className="auth-input-wrapper">
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        className="auth-input" 
                        placeholder={trans.confirmPassPlaceholder} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        disabled={isLoading} 
                        style={{ paddingRight: '50px' }}
                      />
                      <button 
                        type="button" 
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          // Eye off SVG
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          // Eye SVG
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CLOUDFLARE TURNSTILE */}
                  <div className="turnstile-wrapper">
                    <Turnstile
                      key={turnstileKey}
                      siteKey="0x4AAAAAADnUZrc9Wc0pQQjU"
                      onSuccess={(token) => setTurnstileToken(token)}
                      options={{
                        theme: 'dark',
                      }}
                    />
                  </div>
                </>
              )}

              {error && <div className="auth-error-msg">{error}</div>}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {showOtpForm ? trans.verifyBtn : trans.signUp}
              </button>
            </form>

            {!showOtpForm && (
              <div className="auth-footer-text" style={{ marginTop: '24px' }}>
                {trans.haveAccount} <span onClick={() => navigate('/login')}>{trans.signInIt}</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
