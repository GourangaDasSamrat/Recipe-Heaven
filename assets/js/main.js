// Global state
let currentRecipes = [];
let currentRecipeData = null;

// Preloader
window.addEventListener("load", () => {
  // Hide preloader after initial load
  setTimeout(() => {
    document.getElementById("preloader").classList.add("hidden");
  }, 1000);

  // Load recipes on page load
  loadRandomRecipes();
});

// Search on Enter key
document.getElementById("searchInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchRecipes();
  }
});

// ESC key to close modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

// Load random recipes
async function loadRandomRecipes(event) {
  const mealContainer = document.getElementById("meal");
  mealContainer.innerHTML =
    '<div class="loading"><div class="spinner"></div><p>Loading delicious recipes...</p></div>';

  // Set active filter button only if event exists
  if (event && event.target) {
    setActiveFilter(event.target);
  }

  try {
    const promises = [];
    for (let i = 0; i < 12; i++) {
      promises.push(
        fetch("https://www.themealdb.com/api/json/v1/1/random.php")
      );
    }

    const responses = await Promise.all(promises);
    const data = await Promise.all(responses.map((r) => r.json()));

    currentRecipes = data.map((d) => d.meals[0]).filter(Boolean);
    displayRecipes(currentRecipes);
  } catch (error) {
    console.error("Error loading recipes:", error);
    showError(
      "Failed to load recipes. Please check your connection and try again."
    );
  }
}

// Search recipes
async function searchRecipes() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) {
    showError("Please enter a search term");
    return;
  }

  const mealContainer = document.getElementById("meal");
  mealContainer.innerHTML =
    '<div class="loading"><div class="spinner"></div><p>Searching...</p></div>';

  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`
    );
    const data = await response.json();

    if (data.meals) {
      currentRecipes = data.meals;
      displayRecipes(currentRecipes);
    } else {
      showError(`No recipes found for "${query}"`);
    }
  } catch (error) {
    console.error("Error searching recipes:", error);
    showError("Search failed. Please try again.");
  }
}

// Filter by category
async function filterByCategory(category, event) {
  const mealContainer = document.getElementById("meal");
  mealContainer.innerHTML =
    '<div class="loading"><div class="spinner"></div><p>Loading recipes...</p></div>';

  if (event && event.target) {
    setActiveFilter(event.target);
  }

  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
    );
    const data = await response.json();

    if (data.meals) {
      // Get full details for each meal
      const detailedMeals = await Promise.all(
        data.meals.slice(0, 12).map(async (meal) => {
          const res = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
          );
          const detail = await res.json();
          return detail.meals[0];
        })
      );
      currentRecipes = detailedMeals;
      displayRecipes(currentRecipes);
    } else {
      showError(`No recipes found in ${category} category`);
    }
  } catch (error) {
    console.error("Error filtering recipes:", error);
    showError("Failed to load category. Please try again.");
  }
}

// Display recipes
function displayRecipes(recipes) {
  const mealContainer = document.getElementById("meal");

  if (!recipes || recipes.length === 0) {
    showError("No recipes to display");
    return;
  }

  mealContainer.innerHTML = recipes
    .map(
      (recipe) => `
    <div class="recipe-card" onclick="showRecipeDetails('${recipe.idMeal}')">
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
      <div class="recipe-info">
        <h3>${recipe.strMeal}</h3>
        <div class="recipe-meta">
          <span class="recipe-tag"><i class="fas fa-globe"></i> ${recipe.strArea}</span>
          <span class="recipe-tag"><i class="fas fa-tag"></i> ${recipe.strCategory}</span>
        </div>
        <button class="view-btn">
          <i class="fas fa-eye"></i> View Recipe
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

// Show recipe details
async function showRecipeDetails(mealId) {
  const modal = document.getElementById("recipeModal");
  const modalBody = document.getElementById("modalBody");
  const modalTitle = document.getElementById("modalTitle");

  modalBody.innerHTML =
    '<div class="loading"><div class="spinner"></div></div>';
  modal.classList.add("active");

  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
    );
    const data = await response.json();
    const recipe = data.meals[0];

    // Store current recipe data for PDF generation
    currentRecipeData = recipe;

    modalTitle.textContent = recipe.strMeal;

    // Get ingredients
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      if (recipe[`strIngredient${i}`]) {
        ingredients.push({
          ingredient: recipe[`strIngredient${i}`],
          measure: recipe[`strMeasure${i}`],
        });
      }
    }

    modalBody.innerHTML = `
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">

      <h4><i class="fas fa-list"></i> Instructions</h4>
      <p>${recipe.strInstructions}</p>

      <h4><i class="fas fa-shopping-basket"></i> Ingredients</h4>
      <table class="ingredients-table">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Measure</th>
          </tr>
        </thead>
        <tbody>
          ${ingredients
            .map(
              (ing) => `
            <tr>
              <td>${ing.ingredient}</td>
              <td>${ing.measure}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div class="modal-actions">
        ${
          recipe.strYoutube
            ? `
          <button class="action-btn primary" onclick="window.open('${recipe.strYoutube}', '_blank')">
            <i class="fab fa-youtube"></i> Watch Video
          </button>
        `
            : ""
        }
        ${
          recipe.strSource
            ? `
          <button class="action-btn secondary" onclick="window.open('${recipe.strSource}', '_blank')">
            <i class="fas fa-external-link-alt"></i> View Source
          </button>
        `
            : ""
        }
        <button class="action-btn secondary" onclick="downloadRecipePDF()">
          <i class="fas fa-download"></i> Download PDF
        </button>
      </div>
    `;
  } catch (error) {
    console.error("Error loading recipe details:", error);
    modalBody.innerHTML =
      '<div class="error-message"><i class="fas fa-exclamation-circle"></i><p>Failed to load recipe details</p></div>';
  }
}

// Download recipe as PDF
async function downloadRecipePDF() {
  if (!currentRecipeData) {
    alert("No recipe data available");
    return;
  }

  const recipe = currentRecipeData;

  // Get ingredients
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    if (recipe[`strIngredient${i}`]) {
      ingredients.push({
        ingredient: recipe[`strIngredient${i}`],
        measure: recipe[`strMeasure${i}`],
      });
    }
  }

  // Create PDF content
  const pdfContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #667eea; font-size: 32px; margin-bottom: 10px;">${
          recipe.strMeal
        }</h1>
        <p style="color: #764ba2; font-size: 18px;"><strong>Category:</strong> ${
          recipe.strCategory
        } | <strong>Cuisine:</strong> ${recipe.strArea}</p>
      </div>

      <img src="${
        recipe.strMealThumb
      }" style="width: 100%; max-width: 500px; display: block; margin: 20px auto; border-radius: 10px;" />

      <h2 style="color: #667eea; margin-top: 30px; margin-bottom: 15px; font-size: 24px;">📋 Instructions</h2>
      <p style="line-height: 1.8; text-align: justify; color: #333;">${
        recipe.strInstructions
      }</p>

      <h2 style="color: #667eea; margin-top: 30px; margin-bottom: 15px; font-size: 24px;">🛒 Ingredients</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; text-align: left; border: 1px solid #ddd;">Ingredient</th>
            <th style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; text-align: left; border: 1px solid #ddd;">Measure</th>
          </tr>
        </thead>
        <tbody>
          ${ingredients
            .map(
              (ing) => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${ing.ingredient}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${ing.measure}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      ${
        recipe.strYoutube
          ? `<p style="margin-top: 20px;"><strong>🎥 Watch Video:</strong> <a href="${recipe.strYoutube}" style="color: #667eea;">${recipe.strYoutube}</a></p>`
          : ""
      }
      ${
        recipe.strSource
          ? `<p><strong>🔗 Source:</strong> <a href="${recipe.strSource}" style="color: #667eea;">${recipe.strSource}</a></p>`
          : ""
      }

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd;">
        <p style="color: #888; font-size: 14px;">© 2025 Recipe Heaven - Made with ❤️ and 🍕</p>
      </div>
    </div>
  `;

  // Create a temporary element
  const element = document.createElement("div");
  element.innerHTML = pdfContent;
  document.body.appendChild(element);

  // PDF options
  const options = {
    margin: 10,
    filename: `${recipe.strMeal.replace(/[^a-z0-9]/gi, "_")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  // Generate PDF
  try {
    await html2pdf().set(options).from(element).save();

    // Remove temporary element
    setTimeout(() => {
      document.body.removeChild(element);
    }, 100);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
    document.body.removeChild(element);
  }
}

// Close modal
function closeModal() {
  document.getElementById("recipeModal").classList.remove("active");
  currentRecipeData = null;
}

function closeModalOnOutsideClick(event) {
  if (event.target.id === "recipeModal") {
    closeModal();
  }
}

// Load more recipes
function loadMoreRecipes() {
  loadRandomRecipes();
  window.scrollTo({ top: 300, behavior: "smooth" });
}

// Set active filter
function setActiveFilter(button) {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  if (button) {
    button.classList.add("active");
  }
}

// Show error message
function showError(message) {
  const mealContainer = document.getElementById("meal");
  mealContainer.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Oops!</h3>
      <p>${message}</p>
    </div>
  `;
}
