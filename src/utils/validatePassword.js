const validatePassword = (password) => {
    const passwordCriteria = {
      minLength: 8,
      maxLength: 16,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecialCharacter: true,
    };
  
    const checks = [
      password.length >= passwordCriteria.minLength,
      password.length <= passwordCriteria.maxLength,
      passwordCriteria.requireUppercase ? /[A-Z]/.test(password) : true,
      passwordCriteria.requireLowercase ? /[a-z]/.test(password) : true,
      passwordCriteria.requireNumber ? /\d/.test(password) : true,
      passwordCriteria.requireSpecialCharacter ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : true,
    ];
  
    return checks.every(Boolean);
  };
  
  export default validatePassword;
  