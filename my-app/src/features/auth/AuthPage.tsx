import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { gsap } from 'gsap';
import './AuthPage.css';

type AuthTab = 'login' | 'register';
type UserRole = 'owner' | 'renter';

interface AuthPageProps {
  onLoginSuccess: (role: UserRole) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [role, setRole] = useState<UserRole>('owner');
  
  // States cho Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  
  // States cho OTP
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // States hệ thống
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const formContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 1. Logic GSAP: Trượt qua lại 2 chiều
  const handleTabChange = (targetTab: AuthTab) => {
    if (activeTab === targetTab || isLoading) return;
    
    const direction = targetTab === 'register' ? -1 : 1;
    
    gsap.to(formContainerRef.current, {
      x: direction * 40,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        // Reset states khi chuyển tab
        setActiveTab(targetTab);
        setError('');
        setSuccessMsg('');
        setShowOtpForm(false);
        setOtpCode('');
        
        gsap.fromTo(formContainerRef.current, 
          { x: -direction * 40, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
        );
      }
    });

    gsap.to(imgRef.current, {
      scale: targetTab === 'register' ? 1.15 : 1,
      duration: 0.8,
      ease: 'power3.out'
    });
  };

  // 2. Logic điều phối Submit Form (Login, Register, OTP)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (showOtpForm) {
      await handleVerifyOtp();
    } else if (activeTab === 'login') {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  // --- API LOGIN ---
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError(language === 'en' ? 'Please fill in all fields.' : 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://localhost:7069/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify({ email, password, turnstileToken: "XXXX.DUMMY.TOKEN.XXXX" })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.message || (language === 'en' ? 'Login failed.' : 'Đăng nhập thất bại.'));

      if (data.accessToken) localStorage.setItem('portal_token', data.accessToken);
      localStorage.setItem('portal_role', role); // Lưu tạm role theo mockup
      
      onLoginSuccess(role);
      navigate(role === 'owner' ? '/owner' : '/renter');

    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- API REGISTER ---
  const handleRegister = async () => {
    if (!email.trim() || !password || !name || !phoneNumber || !dob) {
      setError(language === 'en' ? 'Please fill in all fields.' : 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (password !== confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match.' : 'Mật khẩu không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      // Chuyển ngày sinh sang chuẩn ISO 8601 theo yêu cầu của Swagger
      const dobISO = new Date(dob).toISOString();

      const response = await fetch('https://localhost:7069/api/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify({ 
          email, 
          password, 
          dob: dobISO, 
          phoneNumber, 
          name, 
          turnstileToken: "XXXX.DUMMY.TOKEN.XXXX" 
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.message || (language === 'en' ? 'Registration failed.' : 'Đăng ký thất bại.'));

      // Đăng ký thành công -> Bật form OTP
      setShowOtpForm(true);
      setSuccessMsg(language === 'en' ? 'Success! Please check your email for OTP.' : 'Thành công! Vui lòng kiểm tra email để nhận mã OTP.');

    } catch (err: any) {
      console.error("Register Error:", err);
      setError(err.message || 'Không thể kết nối đến máy chủ.');
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
      const response = await fetch('https://localhost:7069/api/Auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify({ email, otpCode })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.message || (language === 'en' ? 'Invalid OTP.' : 'Xác thực OTP thất bại.'));

      // Xác thực thành công -> Quay về form Login
      setSuccessMsg(language === 'en' ? 'Account verified! You can now log in.' : 'Tài khoản đã xác thực! Bạn có thể đăng nhập.');
      setShowOtpForm(false);
      setActiveTab('login');
      setPassword(''); // Xóa mật khẩu cho bảo mật
      
    } catch (err: any) {
      console.error("Verify OTP Error:", err);
      setError(err.message || 'Lỗi xác thực.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem('portal_role', 'owner');
    onLoginSuccess('owner');
    navigate('/owner');
  };

  // Dịch thuật
  const trans = {
    hello: language === 'en' ? 'Hello !' : 'Xin chào !',
    welcomeBack: language === 'en' ? 'Welcome Back' : 'Chào mừng trở lại',
    createAcc: language === 'en' ? 'Create an account' : 'Tạo tài khoản mới',
    verifyAcc: language === 'en' ? 'Verify Account' : 'Xác thực tài khoản',
    emailPlaceholder: language === 'en' ? 'Enter Email' : 'Nhập địa chỉ Email',
    passPlaceholder: language === 'en' ? 'Enter Password' : 'Nhập Mật khẩu',
    confirmPassPlaceholder: language === 'en' ? 'Confirm Password' : 'Xác nhận Mật khẩu',
    namePlaceholder: language === 'en' ? 'Full Name' : 'Họ và tên',
    phonePlaceholder: language === 'en' ? 'Phone Number' : 'Số điện thoại',
    otpPlaceholder: language === 'en' ? 'Enter 6-digit OTP' : 'Nhập mã OTP 6 số',
    signIn: language === 'en' ? (isLoading ? 'Signing In...' : 'Sign In') : (isLoading ? 'Đang xử lý...' : 'Đăng nhập'),
    signUp: language === 'en' ? (isLoading ? 'Creating...' : 'Sign Up') : (isLoading ? 'Đang tạo...' : 'Đăng ký'),
    verifyBtn: language === 'en' ? (isLoading ? 'Verifying...' : 'Verify OTP') : (isLoading ? 'Đang xác thực...' : 'Xác nhận OTP'),
    orContinue: language === 'en' ? 'Or continue with' : 'Hoặc tiếp tục với',
    noAccount: language === 'en' ? "Don't Have an account ?" : "Chưa có tài khoản ?",
    createIt: language === 'en' ? "Create Account!" : "Tạo tài khoản!",
    haveAccount: language === 'en' ? "Already have an account ?" : "Đã có tài khoản ?",
    signInIt: language === 'en' ? "Sign In!" : "Đăng nhập ngay!",
    ownerLabel: language === 'en' ? "Owner" : "Chủ mặt bằng",
    renterLabel: language === 'en' ? "Renter" : "Khách thuê",
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        
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
          
          <div className="auth-top-controls">
            <button className="auth-lang-btn" onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}>
              {language === 'en' ? 'VI / EN' : 'EN / VI'}
            </button>
            <button 
              className={`auth-tab-link ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              {language === 'en' ? 'Sign In' : 'Đăng nhập'}
            </button>
            <button 
              className={`auth-tab-link ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              {language === 'en' ? 'Sign Up' : 'Đăng ký'}
            </button>
          </div>

          <div ref={formContainerRef} className="auth-anim-wrapper">
            
            <div className="auth-header">
              {showOtpForm ? (
                <h1>{trans.verifyAcc}</h1>
              ) : activeTab === 'login' ? (
                <h1>{trans.hello}<br/>{trans.welcomeBack}</h1>
              ) : (
                <h1>{trans.createAcc}</h1>
              )}
            </div>

            {/* Hiển thị thông báo thành công nếu có */}
            {successMsg && <div style={{ color: '#00D4A0', fontSize: '13px', fontWeight: 600, textAlign: 'center', marginBottom: '16px' }}>{successMsg}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              
              {/* === MÀN HÌNH NHẬP OTP === */}
              {showOtpForm ? (
                <>
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
                </>
              ) : (
                /* === MÀN HÌNH LOGIN / REGISTER === */
                <>
                  {activeTab === 'register' && (
                    <>
                      <div className="auth-input-wrapper">
                        <input 
                          type="text" className="auth-input" placeholder={trans.namePlaceholder}
                          value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading}
                        />
                      </div>
                      <div className="auth-input-wrapper">
                        <input 
                          type="tel" className="auth-input" placeholder={trans.phonePlaceholder}
                          value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isLoading}
                        />
                      </div>
                      <div className="auth-input-wrapper">
                        {/* Native Date Picker cho đơn giản và chuẩn ISO */}
                        <input 
                          type="date" className="auth-input"
                          value={dob} onChange={(e) => setDob(e.target.value)} disabled={isLoading}
                        />
                      </div>
                    </>
                  )}

                  <div className="auth-input-wrapper">
                    <input 
                      type="email" className="auth-input" placeholder={trans.emailPlaceholder}
                      value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                    />
                  </div>

                  <div className="auth-input-wrapper">
                    <input 
                      type="password" className="auth-input" placeholder={trans.passPlaceholder}
                      value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                    />
                  </div>

                  {activeTab === 'register' && (
                    <>
                      <div className="auth-input-wrapper">
                        <input 
                          type="password" className="auth-input" placeholder={trans.confirmPassPlaceholder}
                          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading}
                        />
                      </div>
                      
                      <div className="auth-role-badges">
                        <div className={`auth-role-badge ${role === 'owner' ? 'active' : ''}`} onClick={() => setRole('owner')}>
                          {trans.ownerLabel}
                        </div>
                        <div className={`auth-role-badge ${role === 'renter' ? 'active' : ''}`} onClick={() => setRole('renter')}>
                          {trans.renterLabel}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {error && <div style={{ color: '#f85149', fontSize: '13px', fontWeight: 500, textAlign: 'center' }}>{error}</div>}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {showOtpForm ? trans.verifyBtn : (activeTab === 'login' ? trans.signIn : trans.signUp)}
              </button>
            </form>

            {/* Chỉ hiện dòng Login Social nếu chưa vào màn hình OTP */}
            {!showOtpForm && (
              <>
                <div className="auth-divider">{trans.orContinue}</div>

                <div className="auth-social-group">
                  <button className="auth-social-btn" type="button" onClick={handleGoogleLogin}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </button>
                  <button className="auth-social-btn" type="button">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                  </button>
                </div>

                <div className="auth-footer-text">
                  {activeTab === 'login' ? (
                    <>{trans.noAccount} <span onClick={() => handleTabChange('register')}>{trans.createIt}</span></>
                  ) : (
                    <>{trans.haveAccount} <span onClick={() => handleTabChange('login')}>{trans.signInIt}</span></>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};