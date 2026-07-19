import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { gsap } from 'gsap';
import { Turnstile } from '@marsidev/react-turnstile';
import { ROUTES, type PortalRole } from '../../routes/routes';
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

interface LoginPageProps {
  onLoginSuccess: (role: PortalRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useThemeLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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

    if (!email.trim() || !password) {
      setError(language === 'en' ? 'Please fill in all fields.' : 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (!turnstileToken) {
      setError(language === 'en' ? 'Please verify you are human.' : 'Vui lòng xác thực bạn không phải là robot.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://flexi-space-capstone-project.onrender.com/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify({ email, password, turnstileToken })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || (language === 'en' ? 'Login failed.' : 'Đăng nhập thất bại.'));
      }

      const message = data.message || '';
      const idMatch = message.match(/ID:\s*([A-Za-z0-9]+)/i);
      const roleMatch = message.match(/Role:\s*([A-Za-z0-9_]+)/i);

      const userId = idMatch ? idMatch[1] : null;
      const parsedRole = roleMatch ? roleMatch[1].toLowerCase() : null;

      const finalRole: PortalRole = parsedRole === 'admin' ? 'admin' : 'user';

      if (data.accessToken) {
        localStorage.setItem('portal_token', data.accessToken);
        
        // BÓC TÁCH TOKEN Ở ĐÂY
        const decodedToken = parseJwt(data.accessToken);
        if (decodedToken && decodedToken.name) {
          // Lấy đúng cái key "name" mà BE trả về
          localStorage.setItem('current_user_name', decodedToken.name);
        } else {
          localStorage.setItem('current_user_name', 'Người dùng');
        }
      }

      localStorage.setItem('portal_role', finalRole);
      
      if (userId) {
        localStorage.setItem('current_user_id', userId);
      }

      onLoginSuccess(finalRole);
      navigate(finalRole === 'admin' ? ROUTES.ADMIN : ROUTES.USER);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.message || 'Không thể kết nối đến máy chủ.');
      setTurnstileToken('');
      setTurnstileKey((prev) => prev + 1); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem('portal_role', 'user');
    onLoginSuccess('user');
    navigate(ROUTES.USER);
  };

  const trans = {
    hello: language === 'en' ? 'Hello !' : 'Xin chào !',
    welcomeBack: language === 'en' ? 'Welcome Back' : 'Chào mừng trở lại',
    emailPlaceholder: language === 'en' ? 'Enter Email' : 'Nhập địa chỉ Email',
    passPlaceholder: language === 'en' ? 'Enter Password' : 'Nhập Mật khẩu',
    signIn: language === 'en' ? (isLoading ? 'Signing In...' : 'Sign In') : (isLoading ? 'Đang xử lý...' : 'Đăng nhập'),
    orContinue: language === 'en' ? 'Or continue with' : 'Hoặc tiếp tục với',
    noAccount: language === 'en' ? "Don't Have an account ?" : 'Chưa có tài khoản ?',
    createIt: language === 'en' ? 'Create Account!' : 'Tạo tài khoản!',
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
          
          <div className="auth-top-controls">
            <button className="auth-lang-btn" onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}>
              {language === 'en' ? 'VI / EN' : 'EN / VI'}
            </button>
          </div>

          <div ref={formContainerRef} className="auth-anim-wrapper">
            
            <div className="auth-header">
              <h1>{trans.hello}<br/>{trans.welcomeBack}</h1>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              
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

              {error && <div className="auth-error-msg">{error}</div>}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {trans.signIn}
              </button>
            </form>

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
              {trans.noAccount} <span onClick={() => navigate('/register')}>{trans.createIt}</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};