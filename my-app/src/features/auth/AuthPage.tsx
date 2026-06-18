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
  const { language, setLanguage, t } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [error, setError] = useState('');
  
  // Ref để GSAP nắm được cái khung form
  const formContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 1. Logic GSAP: Trượt qua lại 2 chiều
  const handleTabChange = (targetTab: AuthTab) => {
    if (activeTab === targetTab) return;
    
    // Xác định hướng trượt (Login -> Register: -1 trượt trái, Register -> Login: 1 trượt phải)
    const direction = targetTab === 'register' ? -1 : 1;
    
    gsap.to(formContainerRef.current, {
      x: direction * 40, // Trượt ra xa 40px
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        // Sau khi mờ hẳn thì đổi State
        setActiveTab(targetTab);
        setError('');
        
        // Trượt vào từ hướng ngược lại
        gsap.fromTo(formContainerRef.current, 
          { x: -direction * 40, opacity: 0 }, 
          { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
        );
      }
    });

    gsap.to(imgRef.current, {
      scale: targetTab === 'register' ? 1.15 : 1,
      duration: 0.8, // Để thời gian dài hơn form một chút tạo cảm giác smooth
      ease: 'power3.out'
    });
  };

  // 2. Logic điều hướng chung (Dùng cho cả form và Google)
  const processLogin = () => {
    onLoginSuccess(role);
    // Nhảy vào route tương ứng với role (owner hoặc renter)
    navigate(role === 'owner' ? '/owner' : '/renter');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError(language === 'en' ? 'Please fill in all fields.' : 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (activeTab === 'register' && password !== confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match.' : 'Mật khẩu không khớp.');
      return;
    }

    processLogin();
  };

  // 3. Logic khi nhấn nút Google
  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    // Simulate việc Google trả về token thành công, cho vô trong luôn
    processLogin();
  };

  const trans = {
    hello: language === 'en' ? 'Hello !' : 'Xin chào !',
    welcomeBack: language === 'en' ? 'Welcome Back' : 'Chào mừng trở lại',
    createAcc: language === 'en' ? 'Create an account' : 'Tạo tài khoản mới',
    emailPlaceholder: language === 'en' ? 'Enter Email' : 'Nhập địa chỉ Email',
    passPlaceholder: language === 'en' ? 'Enter Password' : 'Nhập Mật khẩu',
    confirmPassPlaceholder: language === 'en' ? 'Confirm Password' : 'Xác nhận Mật khẩu',
    signIn: language === 'en' ? 'Sign In' : 'Đăng nhập',
    signUp: language === 'en' ? 'Sign Up' : 'Đăng ký',
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
            <button 
              className="auth-lang-btn" 
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            >
              {language === 'en' ? 'VI / EN' : 'EN / VI'}
            </button>
            <button 
              className={`auth-tab-link ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              {trans.signIn}
            </button>
            <button 
              className={`auth-tab-link ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              {trans.signUp}
            </button>
          </div>

          <div ref={formContainerRef} className="auth-anim-wrapper">
            
            <div className="auth-header">
              {activeTab === 'login' ? (
                <h1>{trans.hello}<br/>{trans.welcomeBack}</h1>
              ) : (
                <h1>{trans.createAcc}</h1>
              )}
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-input-wrapper">
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder={trans.emailPlaceholder}
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="auth-input-wrapper">
                <input 
                  type="password" 
                  className="auth-input" 
                  placeholder={trans.passPlaceholder}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {activeTab === 'register' && (
                <>
                  <div className="auth-input-wrapper">
                    <input 
                      type="password" 
                      className="auth-input" 
                      placeholder={trans.confirmPassPlaceholder}
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="auth-role-badges">
                    <div 
                      className={`auth-role-badge ${role === 'owner' ? 'active' : ''}`}
                      onClick={() => setRole('owner')}
                    >
                      {trans.ownerLabel}
                    </div>
                    <div 
                      className={`auth-role-badge ${role === 'renter' ? 'active' : ''}`}
                      onClick={() => setRole('renter')}
                    >
                      {trans.renterLabel}
                    </div>
                  </div>
                </>
              )}

              {error && <div style={{ color: '#f85149', fontSize: '13px', fontWeight: 500, textAlign: 'center' }}>{error}</div>}

              <button type="submit" className="auth-submit-btn">
                {activeTab === 'login' ? trans.signIn : trans.signUp}
              </button>
            </form>

            <div className="auth-divider">{trans.orContinue}</div>

            <div className="auth-social-group">
              {/* Nút Google đã được gắn hàm onClick */}
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

          </div>
        </div>
      </div>
    </div>
  );
};