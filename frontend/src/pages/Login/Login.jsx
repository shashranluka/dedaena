import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.scss";
import { loginUser } from "../../services/auth";
import SocialLogin from "../../components/SocialLogin/SocialLogin";
import { isAuthenticated } from "../../services/auth";
import { useEffect } from "react";

function Login() {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "მომხმარებლის სახელი აუცილებელია";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "პაროლი აუცილებელია";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const loginData = {
        username: formData.username,
        password: formData.password
      };

      const response = await loginUser(loginData);
      
      if (response.access_token) {
        // Save token to localStorage
        localStorage.setItem("token", response.access_token);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // If remember me is checked, save for longer
        if (formData.rememberMe) {
          localStorage.setItem("rememberMe", "true");
        }

        // Success message
        alert(`მოგესალმებით, ${response.user.username}!`);
        
        // Navigate to main page
        navigate("/");
      }
    } catch (error) {
      setErrors({
        submit: error.message || "არასწორი მომხმარებლის სახელი ან პაროლი"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>შესვლა</h1>
          <p>შედით თქვენს ანგარიშში</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">
              მომხმარებლის სახელი <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? "error" : ""}
              placeholder="username"
              autoComplete="username"
              autoFocus
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">
              პაროლი <span className="required">*</span>
            </label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span>დამახსოვრება</span>
            </label>
            <Link to="/forgot-password" className="forgot-password">
              დაგავიწყდა პაროლი?
            </Link>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="submit-error">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "შესვლა..." : "შესვლა"}
          </button>

          {/* Registration Link */}
          <div className="form-footer">
            <p>
              არ გაქვთ ანგარიში?{" "}
              <Link to="/registration">რეგისტრაცია</Link>
            </p>
          </div>
        </form>

        {/* Social Login (Optional) */}
        <SocialLogin 
          disabled={loading}
          loading={loading}
          onClick={() => {
            // TODO: implement Google login logic here
            alert("Google-ით შესვლა ჯერ არ არის გააქტიურებული.");
          }}
        />
      </div>
    </div>
  );
}

export default Login;