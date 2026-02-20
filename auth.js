function signUp() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("authMessage");

  if (!email.endsWith("@pw.live")) {
    message.innerText = "Only @pw.live emails allowed.";
    return;
  }

  if (password.length < 4) {
    message.innerText = "Password must be at least 4 characters.";
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || {};

  if (users[email]) {
    message.innerText = "User already exists.";
    return;
  }

  users[email] = password;
  localStorage.setItem("users", JSON.stringify(users));

  message.innerText = "Account created. You can now sign in.";
}

function signIn() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("authMessage");

  const users = JSON.parse(localStorage.getItem("users")) || {};

  if (users[email] && users[email] === password) {
    localStorage.setItem("loggedUser", email);
    window.location.href = "index.html";
  } else {
    message.innerText = "Invalid email or password.";
  }
}