// Hamburger Menu Toggle
function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  const hamburger = document.querySelector(".hamburger");

  navLinks.classList.toggle("active");
  hamburger.classList.toggle("active");

  // Prevent body scroll when menu is open
  if (navLinks.classList.contains("active")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
}

// Close menu when clicking on a link
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const navLinksContainer = document.querySelector(".nav-links");
      const hamburger = document.querySelector(".hamburger");

      if (navLinksContainer.classList.contains("active")) {
        navLinksContainer.classList.remove("active");
        hamburger.classList.remove("active");
        document.body.style.overflow = "auto";
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    const navLinksContainer = document.querySelector(".nav-links");
    const hamburger = document.querySelector(".hamburger");
    const nav = document.querySelector("nav");

    if (
      !nav.contains(e.target) &&
      navLinksContainer.classList.contains("active")
    ) {
      navLinksContainer.classList.remove("active");
      hamburger.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  });
});
