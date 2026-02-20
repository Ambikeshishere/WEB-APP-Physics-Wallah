const USER_DB_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1ZpguueahXEwD-ds3aBzWmrKNZJxYpWYB70tT72xLpbYEufLk6u3yNgt6s5eAWfoxhVsIyJBuJPVD/pub?gid=0&single=true&output=csv";

async function signIn() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("authMessage");
  const btn = document.querySelector(".btn-signin");

  message.innerText = "";

  if (!email) {
    message.innerText = "Please enter your email.";
    return;
  }

  if (!email.endsWith("@pw.live")) {
    message.innerText = "Only @pw.live emails are allowed.";
    return;
  }

  if (!password) {
    message.innerText = "Please enter your password.";
    return;
  }

  btn.innerHTML = "<span>Signing in...</span>";
  btn.disabled = true;

  try {
    const res = await fetch(USER_DB_URL);
    const text = await res.text();

    const rows = text.split("\n").slice(1);
    let validUser = false;

    rows.forEach(row => {
      const cols = row.split(",");
      const dbEmail = cols[0]?.trim();
      const dbPassword = cols[1]?.trim();
      if (dbEmail === email && dbPassword === password) {
        validUser = true;
      }
    });

    if (validUser) {
      localStorage.setItem("loggedUser", email);
      window.location.href = "index.html";
    } else {
      message.innerText = "Invalid email or password.";
      btn.innerHTML = "<span>Sign In</span><span class='btn-arrow'>→</span>";
      btn.disabled = false;
    }

  } catch (err) {
    message.innerText = "Error connecting. Please try again.";
    btn.innerHTML = "<span>Sign In</span><span class='btn-arrow'>→</span>";
    btn.disabled = false;
  }
}

// Allow Enter key to submit
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") signIn();
});