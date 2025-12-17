// Form submission handler
function handleSubmit(event) {
  event.preventDefault();

  const form = document.getElementById("contactForm");
  const successMessage = document.getElementById("successMessage");

  // Hide form and show success message
  form.style.display = "none";
  successMessage.style.display = "block";

  // Scroll to success message
  successMessage.scrollIntoView({ behavior: "smooth", block: "center" });

  // Reset form after 5 seconds and show it again
  setTimeout(() => {
    form.reset();
    form.style.display = "block";
    successMessage.style.display = "none";
  }, 5000);
}

// FAQ toggle
function toggleFAQ(element) {
  const faqItem = element.parentElement;
  const answer = faqItem.querySelector(".faq-answer");
  const icon = element.querySelector("i");

  // Close all other FAQs
  document.querySelectorAll(".faq-item").forEach((item) => {
    if (item !== faqItem) {
      item.classList.remove("active");
      item.querySelector(".faq-answer").style.maxHeight = null;
    }
  });

  // Toggle current FAQ
  faqItem.classList.toggle("active");

  if (faqItem.classList.contains("active")) {
    answer.style.maxHeight = answer.scrollHeight + "px";
  } else {
    answer.style.maxHeight = null;
  }
}
