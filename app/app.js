import * as MODEL from "../model/model.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

let currentImageBase64 = "";

function updateNav(user) {
  if (user) {
    $(".logged-in").show();
    $(".logged-out").hide();
  } else {
    $(".logged-in").hide();
    $(".logged-out").show();
  }
}

onAuthStateChanged(MODEL.auth, (user) => {
  console.log(user ? "User is logged in" : "User is logged out");
  updateNav(user);
  if (user) {
    if (window.location.hash === "#login") {
      window.location.hash = "home";
    }
  }
});

function updateNavActiveState(pageID) {
  const navLinks = $(".desktop-nav a, .mobile-nav a");
  navLinks.removeClass("active");
  const activeLink = $(`a[href="#${pageID}"]`);
  activeLink.addClass("active");
}

function route() {
  let hashTag = window.location.hash;
  let pageID = hashTag.replace("#", "");
  $("body").removeClass("page-home page-login page-browse page-create page-your-recipes page-detail");

  if (pageID == "") {
    pageID = "home";
  }


  const user = MODEL.auth.currentUser;
  if (!user && (pageID === "your-recipes" || pageID === "create")) {
    alert("You must be logged in to view this page.");
    window.location.hash = "login";
    return;
  }

  $("body").addClass("page-" + pageID);
  updateNavActiveState(pageID);

  let fileToLoad = pageID;
  if (pageID === "edit") {
    fileToLoad = "create";
  }

  $.ajax({
    url: `pages/${fileToLoad}.html`,
    success: function (data) {
      $("#app-content").html(data);
      if(pageID === "browse") initBrowse();
      if(pageID === "create") initCreate();
      if(pageID === "your-recipes") initYourRecipes();
      if(pageID === "detail") initDetail();
      if(pageID === "edit") initEdit(); 
    },
    error: function () {
      $("#app-content").html("<h2>404 - Page Not Found</h2><p>Please check that pages/" + fileToLoad + ".html exists.</p>");
    },
  });
}


function initBrowse() {
    $("#browse-list").html("<p>Loading recipes...</p>");
    
    $.getJSON("data/data.json", function(data) {
        $("#browse-list").empty();
        
        data.recipes.forEach(recipe => {
            let html = `
            <div class="recipe-card">
                <div class="card-img" style="background-image: url('${recipe.image}')"></div>
                <div class="card-info">
                    <h3>${recipe.name}</h3>
                    <p>${recipe.description}</p>
                    <div class="meta">
                        <div><img src="images/time.svg"> ${recipe.time}</div>
                        <div><img src="images/servings.svg"> ${recipe.servings}</div>
                    </div>
                </div>
            </div>`;
            $("#browse-list").append(html);
        });
    }).fail(function() {
        $("#browse-list").html("<p>Error loading local recipes.</p>");
    });
}


async function initYourRecipes() {
    const user = MODEL.auth.currentUser;
    if(user && user.displayName) {
        $("#user-name-display").text(user.displayName);
    }

    $("#your-recipes-list").html("<p>Loading your recipes...</p>");
    
    try {
        const recipes = await MODEL.getUserRecipes(user.uid);
        $("#your-recipes-list").empty();

        if(recipes.length === 0) {
            $("#your-recipes-list").html("<p>You haven't created any recipes yet.</p>");
            return;
        }

        recipes.forEach(recipe => {
            let html = `
            <div class="recipe-card">
                <div class="card-img" style="background-image: url('${recipe.image}')"></div>
                <div class="card-info">
                    <h3>${recipe.name}</h3>
                    <p>${recipe.description}</p>
                    <div class="meta">
                        <div><img src="images/time.svg"> ${recipe.time}</div>
                        <div><img src="images/servings.svg"> ${recipe.servings}</div>
                    </div>
                    <div class="card-buttons">
                        <button class="btn-view" onclick="appViewRecipe('${recipe.id}')">View</button>
                        <button class="btn-edit" onclick="appEditRecipe('${recipe.id}')">Edit</button>
                        <button class="btn-delete" onclick="appDeleteRecipe('${recipe.id}')">Delete</button>
                    </div>
                </div>
            </div>`;
            $("#your-recipes-list").append(html);
        });
    } catch (error) {
        console.error(error);
    }
}


function initCreate() {
    const user = MODEL.auth.currentUser;
    currentImageBase64 = "";

    if(user && user.displayName) {
        $("#form-title").text(`Hey ${user.displayName}, create your recipe!`);
    }

    $("#custom-attach-btn").click(function() {
        $("#real-file-btn").click();
    });

    $("#real-file-btn").change(function(e) {
        const file = e.target.files[0];
        if (file) {
            $("#file-name-display").val(file.name);
            const reader = new FileReader();
            reader.onload = function(readerEvent) {
                currentImageBase64 = readerEvent.target.result;
            };
            reader.readAsDataURL(file); 
        }
    });

    $("#add-ing").click(() => {
        $("#ingredients-list").append(`
            <div class="input-group">
                <input type="text" class="ing-input" placeholder=" " />
                <label>New Ingredient</label>
            </div>`);
    });

    $("#add-inst").click(() => {
        $("#instructions-list").append(`
            <div class="input-group">
                <input type="text" class="inst-input" placeholder=" " />
                <label>New Instruction</label>
            </div>`);
    });

    $("#recipe-form").off("submit").on("submit", async function(e) {
        e.preventDefault();
        
        let ingredients = $(".ing-input").map((_, el) => $(el).val()).get().filter(v => v);
        let instructions = $(".inst-input").map((_, el) => $(el).val()).get().filter(v => v);

        if(currentImageBase64 === "") {
            alert("Please attach an image file.");
            return;
        }

        let recipeObj = {
            name: $("#recipe-name").val(),
            image: currentImageBase64,
            description: $("#recipe-desc").val(),
            time: $("#recipe-time").val(),
            servings: $("#recipe-servings").val(),
            ingredients: ingredients,
            instructions: instructions,
            uid: user.uid
        };
        alert("Recipe created successfully!");
        try {
            await MODEL.createRecipe(recipeObj);
            alert("Recipe created successfully!");
            window.location.hash = "your-recipes";
        } catch (e) {
            alert("Error creating recipe: " + e.message);
        }
    });
}

async function initDetail() {
    let id = localStorage.getItem("currentRecipeId");
    if(!id) {
        window.location.hash = "browse";
        return;
    }

    const renderDetail = (recipe) => {
        $("#detail-title").text(recipe.name);
        $("#detail-image").attr("src", recipe.image);
        $("#detail-desc").text(recipe.description);
        $("#detail-time").text(recipe.time);
        $("#detail-servings").text(recipe.servings);
        
        $("#detail-ingredients").empty();
        if(recipe.ingredients) recipe.ingredients.forEach(i => $("#detail-ingredients").append(`<li>${i}</li>`));
        
        $("#detail-instructions").empty();
        if(recipe.instructions) recipe.instructions.forEach(i => $("#detail-instructions").append(`<li>${i}</li>`));

        const user = MODEL.auth.currentUser;
        if(user && recipe.uid && user.uid === recipe.uid) {
            $("#detail-actions").show();
            $("#edit-btn").off("click").click(() => appEditRecipe(id));
        } else {
            $("#detail-actions").hide();
        }
    };

    $.getJSON("data/data.json", function(data) {
        let jsonRecipe = data.recipes.find(r => r.id === id);
        if (jsonRecipe) {
            renderDetail(jsonRecipe);
        } else {
            MODEL.getRecipeById(id).then(renderDetail).catch(() => {
                alert("Recipe not found");
            });
        }
    });
}


async function initEdit() {

    let id = localStorage.getItem("editRecipeId");
    if(!id) return;

    const user = MODEL.auth.currentUser;
    if(user && user.displayName) {
        $("#form-title").text(`Hey ${user.displayName}, edit your recipe!`);
    } else {
        $("#form-title").text("Edit your recipe");
    }
    
    $("#submit-btn").text("Update Recipe");


    let recipe = await MODEL.getRecipeById(id);
    

    $("#recipe-name").val(recipe.name);
    $("#recipe-desc").val(recipe.description);
    $("#recipe-time").val(recipe.time);
    $("#recipe-servings").val(recipe.servings);

    currentImageBase64 = recipe.image;
    $("#file-name-display").val("Current Image (Change if needed)");


    $("#custom-attach-btn").off("click").click(function() { $("#real-file-btn").click(); });
    $("#real-file-btn").off("change").change(function(e) {
        const file = e.target.files[0];
        if (file) {
            $("#file-name-display").val(file.name);
            const reader = new FileReader();
            reader.onload = function(readerEvent) {
                currentImageBase64 = readerEvent.target.result;
            };
            reader.readAsDataURL(file); 
        }
    });


    $("#ingredients-list").empty();
    recipe.ingredients.forEach(ing => {
        $("#ingredients-list").append(`
        <div class="input-group">
            <input type="text" class="ing-input" value="${ing}" placeholder=" " />
            <label>Ingredient</label>
        </div>`);
    });
    $("#ingredients-list").append(`<div class="input-group"><button type="button" class="add-btn" id="add-ing">+</button></div>`);

    $("#instructions-list").empty();
    recipe.instructions.forEach(inst => {
        $("#instructions-list").append(`
        <div class="input-group">
            <input type="text" class="inst-input" value="${inst}" placeholder=" " />
            <label>Instruction</label>
        </div>`);
    });
    $("#instructions-list").append(`<div class="input-group"><button type="button" class="add-btn" id="add-inst">+</button></div>`);
    

    $("#add-ing").off("click").click(() => {
            $(`<div class="input-group"><input type="text" class="ing-input" placeholder=" "/><label>New Ingredient</label></div>`).insertBefore($("#ingredients-list button").parent());
    });
    $("#add-inst").off("click").click(() => {
            $(`<div class="input-group"><input type="text" class="inst-input" placeholder=" "/><label>New Instruction</label></div>`).insertBefore($("#instructions-list button").parent());
    });


    $("#recipe-form").off("submit").on("submit", async function(e) {
        e.preventDefault();
        let ingredients = $(".ing-input").map((_, el) => $(el).val()).get().filter(v => v);
        let instructions = $(".inst-input").map((_, el) => $(el).val()).get().filter(v => v);
        
        let newData = {
            name: $("#recipe-name").val(),
            image: currentImageBase64,
            description: $("#recipe-desc").val(),
            time: $("#recipe-time").val(),
            servings: $("#recipe-servings").val(),
            ingredients: ingredients,
            instructions: instructions
        };

        try {
            await MODEL.updateRecipe(id, newData);
            alert("Recipe updated successfully!");
            currentImageBase64 = "";
            window.location.hash = "your-recipes";
        } catch (error) {
            alert("Error updating recipe: " + error.message);
        }
    });
}


window.appViewRecipe = function(id) {
    localStorage.setItem("currentRecipeId", id);
    window.location.hash = "detail";
};

window.appEditRecipe = function(id) {
    localStorage.setItem("editRecipeId", id);
    window.location.hash = "edit";
};

window.appDeleteRecipe = async function(id) {
    if(confirm("Are you sure you want to delete this recipe?")) {

        $("#your-recipes-list").html("<p>Deleting recipe...</p>");
        
        await MODEL.deleteRecipe(id);
        

        initYourRecipes(); 
    }
};


function initListeners() {
  $("#app-content").on("click", "#signup-button", function (e) {
    e.preventDefault();
    const firstName = $("#signup-firstname").val();
    const lastName = $("#signup-lastname").val();
    const email = $("#signup-email").val();
    const password = $("#signup-password").val();

    createUserWithEmailAndPassword(MODEL.auth, email, password)
      .then((userCredential) => {
        updateProfile(userCredential.user, {
            displayName: firstName + " " + lastName
        }).then(() => {
            console.log("Profile updated");
        });
      })
      .catch((error) => {
        alert("Error signing up: " + error.message);
      });
  });

  $("#app-content").on("click", "#login-button", function (e) {
    e.preventDefault();
    const email = $("#login-email").val();
    const password = $("#login-password").val();
    signInWithEmailAndPassword(MODEL.auth, email, password)
      .then((userCredential) => {
        console.log("Logged in");
      })
      .catch((error) => {
        alert("Error logging in: " + error.message);
      });
  });

  $("header, .mobile-nav").on("click", "#logout-link, #mobile-logout-link", function (e) {
    e.preventDefault();
    signOut(MODEL.auth)
      .then(() => {
        window.location.hash = "login";
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  });
}

function toggleMobileMenu() {
  $("#hamburger-icon").toggleClass("open");
  $(".mobile-nav").toggleClass("open");
}

$(document).ready(function () {
  route();
  initListeners();

  $("#hamburger-icon").on("click", toggleMobileMenu);

  $("nav a").on("click", function (e) {
    if (this.id.includes("logout")) return;
    let pageID = $(this).attr("href").substring(1);
    window.location.hash = pageID;
    if ($(".mobile-nav").hasClass("open")) {
      toggleMobileMenu();
    }
  });

  $(window).on("hashchange", route);
});