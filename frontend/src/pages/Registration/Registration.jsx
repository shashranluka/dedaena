import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Registration.scss";
import { registerUser } from "../../services/auth";

function Registration() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation rules
  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "მომხმარებლის სახელი აუცილებელია";
    } else if (formData.username.length < 3) {
      newErrors.username = "მომხმარებლის სახელი უნდა იყოს მინიმუმ 3 სიმბოლო";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "მხოლოდ ლათინური ასოები, ციფრები და ქვედა ხაზი";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "ელ-ფოსტა აუცილებელია";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "არასწორი ელ-ფოსტის ფორმატი";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "პაროლი აუცილებელია";
    } else if (formData.password.length < 6) {
      newErrors.password = "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "პაროლის დადასტურება აუცილებელია";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "პაროლები არ ემთხვევა";
    }

    // Terms agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "უნდა დაეთანხმოთ წესებსა და პირობებს";
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
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };

      const response = await registerUser(userData);
      console.log("Registration response:", response);
      
      if (response.message) {
        // Show success message
        alert("რეგისტრაცია წარმატებით დასრულდა! გთხოვთ შეხვიდეთ სისტემაში.");
        navigate("/login");
      }
    } catch (error) {
      setErrors({
        submit: error.message || "რეგისტრაცია ვერ მოხერხდა. სცადეთ თავიდან."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <h1>რეგისტრაცია</h1>
          <p>შექმენით ახალი ანგარიში დედაენაზე</p>
        </div>

        <form className="registration-form" onSubmit={handleSubmit}>
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
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">
              ელ-ფოსტა <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
              placeholder="example@email.com"
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
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
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              პაროლის დადასტურება <span className="required">*</span>
            </label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "error" : ""}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Terms Agreement */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className={errors.agreeToTerms ? "error" : ""}
              />
              <span>
                ვეთანხმები <Link to="/terms">წესებსა და პირობებს</Link>
              </span>
            </label>
            {errors.agreeToTerms && (
              <span className="error-message">{errors.agreeToTerms}</span>
            )}
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
            {loading ? "რეგისტრაცია..." : "რეგისტრაცია"}
          </button>

          {/* Login Link */}
          <div className="form-footer">
            <p>
              უკვე გაქვთ ანგარიში?{" "}
              <Link to="/login">შესვლა</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Registration;