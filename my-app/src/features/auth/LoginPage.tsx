import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { gsap } from 'gsap';
import { Turnstile } from '@marsidev/react-turnstile';
import { ROUTES, type PortalRole } from '../../routes/routes';
import { invalidateIdentityVerification } from '../identity-verification';
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

interface LoginPageProps {
  onLoginSuccess: (role: PortalRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useThemeLanguage();
  setLanguage('vi'); // Mặc định là tiếng Việt, bạn có thể thay đổi theo nhu cầu


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
        throw new Error(serverMessage || (language === 'en' ? 'Login failed.' : 'Đăng nhập thất bại.'));
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
          localStorage.setItem('current_user_name', decodedToken.name);
        } else {
          localStorage.setItem('current_user_name', 'Người dùng');
        }
      }

      localStorage.setItem('portal_role', finalRole);
      
      if (userId) {
        localStorage.setItem('current_user_id', userId);
        if (data.accessToken) {
          try {
            await fetchUserProfile(userId, data.accessToken);
          } catch (profileErr) {
            console.error('Lỗi lấy userprofile:', profileErr);
          }
        }
      }

      // Lấy ngay thông tin profile (bao gồm isVerified) sau khi đăng nhập thành công
      invalidateIdentityVerification();

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

  const trans = {
    hello: language === 'en' ? 'Hello !' : 'Xin chào !',
    welcomeBack: language === 'en' ? 'Welcome Back' : 'Chào mừng trở lại',
    emailPlaceholder: language === 'en' ? 'Enter Email' : 'Nhập địa chỉ Email',
    passPlaceholder: language === 'en' ? 'Enter Password' : 'Nhập Mật khẩu',
    signIn: language === 'en' ? (isLoading ? 'Signing In...' : 'Sign In') : (isLoading ? 'Đang xử lý...' : 'Đăng nhập'),
    noAccount: language === 'en' ? "Don't Have an account ?" : 'Chưa có tài khoản ?',
    createIt: language === 'en' ? 'Create Account!' : 'Tạo tài khoản!',
    forgotPassword: language === 'en' ? 'Forgot password?' : 'Quên mật khẩu?',
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
          
          {/* <div className="auth-top-controls">
            <button className="auth-lang-btn" onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}>
              {language === 'en' ? 'VI / EN' : 'EN / VI'}
            </button>
          </div> */}

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
                <div className="auth-forgot-link-wrap">
                  <span className="auth-forgot-link" onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}>
                    {trans.forgotPassword}
                  </span>
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

            <div className="auth-footer-text">
              {trans.noAccount} <span onClick={() => navigate('/register')}>{trans.createIt}</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};