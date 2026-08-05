import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { gsap } from 'gsap';
import { Turnstile } from '@marsidev/react-turnstile';
import { ROUTES } from '../../routes/routes';
import { fetchUserProfile } from './api/auth.api';
import './AuthPage.css';

// HÀM GIẢI MÃ JWT TOKEN ĐỂ LẤY THÔNG TIN
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return null;
  }
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();

  // States cho Form đăng ký
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    if (!email.trim() || !userName.trim() || !name.trim() || !phoneNumber.trim() || !password) {
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

    // Turnstile check
    if (!turnstileToken) {
      setError(language === 'en' ? 'Please verify you are human.' : 'Vui lòng xác thực bạn không phải là robot.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify({ 
          email, 
          password, 
          phoneNumber,
          userName,
          name, 
          turnstileToken
        })
      });

      const rawText = (await response.text()).trim();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }
      }

      if (!response.ok) {
        const serverMessage = typeof data === 'string' ? data : data?.message;
        throw new Error(serverMessage || (language === 'en' ? 'Registration failed.' : 'Đăng ký thất bại.'));
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
      const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify({ email, otpCode })
      });

      const rawText = (await response.text()).trim();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }
      }

      if (!response.ok) {
        const serverMessage = typeof data === 'string' ? data : data?.message;
        throw new Error(serverMessage || (language === 'en' ? 'Invalid OTP.' : 'Xác thực OTP thất bại.'));
      }

      setSuccessMsg(language === 'en' ? 'Account verified! Let\'s complete your profile.' : 'Tài khoản đã xác thực! Hãy hoàn tất hồ sơ của bạn.');

      // Tự đăng nhập ngay sau khi verify OTP để onboarding (xác thực CCCD) có token + userId,
      // giống hệt luồng LoginPage — nếu không, bước verify CCCD ở onboarding sẽ luôn thất bại
      // vì thiếu portal_token/current_user_id trong localStorage.
      try {
        const loginResponse = await fetch('https://flexi-space-capstone-project.onrender.com/api/Auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
          body: JSON.stringify({ email, password, turnstileToken })
        });
        const loginData = await loginResponse.json().catch(() => ({}));

        if (loginResponse.ok && loginData.accessToken) {
          localStorage.setItem('portal_token', loginData.accessToken);

          const decodedToken = parseJwt(loginData.accessToken);
          localStorage.setItem('current_user_name', decodedToken?.name || name || 'Người dùng');

          const message = loginData.message || '';
          const idMatch = message.match(/ID:\s*([A-Za-z0-9]+)/i);
          const roleMatch = message.match(/Role:\s*([A-Za-z0-9_]+)/i);
          const userId = idMatch ? idMatch[1] : null;
          const parsedRole = roleMatch ? roleMatch[1].toLowerCase() : null;

          localStorage.setItem('portal_role', parsedRole === 'admin' ? 'admin' : 'user');

          if (userId) {
            localStorage.setItem('current_user_id', userId);
            try {
              await fetchUserProfile(userId, loginData.accessToken);
            } catch (profileErr) {
              console.error('Lỗi lấy userprofile:', profileErr);
            }
          }
        }
      } catch (autoLoginErr) {
        console.error('Auto-login sau đăng ký thất bại:', autoLoginErr);
      }

      setTimeout(() => {
        navigate(ROUTES.ONBOARDING, { state: { name, phoneNumber, email } });
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
    userNamePlaceholder: language === 'en' ? 'Username' : 'Tên đăng nhập',
    passPlaceholder: language === 'en' ? 'Enter Password' : 'Nhập Mật khẩu',
    confirmPassPlaceholder: language === 'en' ? 'Confirm Password' : 'Xác nhận Mật khẩu',
    namePlaceholder: language === 'en' ? 'Full Name' : 'Họ và tên',
    phonePlaceholder: language === 'en' ? 'Phone Number' : 'Số điện thoại',
    otpPlaceholder: language === 'en' ? 'Enter 6-digit OTP' : 'Nhập mã OTP 6 số',
    signUp: language === 'en' ? (isLoading ? 'Creating...' : 'Sign Up') : (isLoading ? 'Đang tạo...' : 'Đăng ký'),
    verifyBtn: language === 'en' ? (isLoading ? 'Verifying...' : 'Verify OTP') : (isLoading ? 'Đang xác thực...' : 'Xác nhận OTP'),
    haveAccount: language === 'en' ? 'Already have an account ?' : 'Đã có tài khoản ?',
    signInIt: language === 'en' ? 'Sign In!' : 'Đăng nhập ngay!',
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

                  {/* Username */}
                  <div className="auth-field-group">
                    <label className="auth-label">{trans.userNamePlaceholder} <span>*</span></label>
                    <div className="auth-input-wrapper">
                      <input 
                        type="text" 
                        className="auth-input" 
                        placeholder={trans.userNamePlaceholder} 
                        value={userName} 
                        onChange={(e) => setUserName(e.target.value)} 
                        disabled={isLoading} 
                      />
                    </div>
                  </div>

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