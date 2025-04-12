document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const firstNameInput = document.getElementById('firstName');
    const secondNameInput = document.getElementById('secondName');
    const passwordInput = document.getElementById('password');
    const passwordStrengthIndicator = document.createElement('div');
  
    passwordInput.parentNode.appendChild(passwordStrengthIndicator);
  
    function isValidName(name) {
        const nameRegex = /^[a-zA-Z]{1,12}$/;
        return nameRegex.test(name);
    }
  
    function isValidTelephone(telephone) {
        const telephoneRegex = /^[2459]\d{7}$/;
        return telephoneRegex.test(telephone);
    }
  
    function calculatePasswordStrength(password) {
        let strength = 0;
  
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1; 
        if (/[a-z]/.test(password)) strength += 1; 
        if (/\d/.test(password)) strength += 1; 
        if (/[@$!%*?&]/.test(password)) strength += 1; 
  
        return strength;
    }
  
    function updatePasswordStrengthIndicator(password) {
        const strength = calculatePasswordStrength(password);
        const strengthText = [
            'Too Weak',
            'Weak',
            'Moderate',
            'Strong',
            'Very Strong',
        ];
  
        passwordStrengthIndicator.textContent = `Password Strength: ${strengthText[strength] || 'Too Weak'}`;
        passwordStrengthIndicator.style.color = ['red', 'orange', 'yellow', 'green', 'darkgreen'][strength] || 'red';
    }
  
    firstNameInput.addEventListener('input', () => {
        if (!isValidName(firstNameInput.value)) {
            firstNameInput.setCustomValidity('First name must contain only letters (a-z) and be up to 12 characters long.');
        } else {
            firstNameInput.setCustomValidity('');
        }
    });
  
    secondNameInput.addEventListener('input', () => {
        if (!isValidName(secondNameInput.value)) {
            secondNameInput.setCustomValidity('Second name must contain only letters (a-z) and be up to 12 characters long.');
        } else {
            secondNameInput.setCustomValidity('');
        }
    });
  
  
    passwordInput.addEventListener('input', () => {
        updatePasswordStrengthIndicator(passwordInput.value);
    });
  
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
  
        const firstName = firstNameInput.value.trim();
        const secondName = secondNameInput.value.trim();
        const password = passwordInput.value.trim();
  
        if (!isValidName(firstName)) {
            alert('Invalid first name. Must contain only letters (a-z) and be up to 12 characters long.');
            return;
        }
  
        if (!isValidName(secondName)) {
            alert('Invalid second name. Must contain only letters (a-z) and be up to 12 characters long.');
            return;
        }
  
        if (calculatePasswordStrength(password) < 3) {
            alert('Password is too weak. Make sure it is strong enough.');
            return;
        }
  
        alert('Form submitted successfully!');
    });
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const formData = {
          firstName: document.getElementById('firstName').value,
          secondName: document.getElementById('secondName').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
      };
  
      try {
          const response = await fetch('/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
  
          const result = await response.json();
          if (result.success) {
              localStorage.setItem('user', JSON.stringify(result.user));
              window.location.href = result.redirectUrl; 
            } else {
              alert(result.message); 
            }
      } catch (error) {
          console.error('Error registering user:', error);
          alert('Failed to register user.');
      }
  });
  
  });
  