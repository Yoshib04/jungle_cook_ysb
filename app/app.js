// **CORRECTED:** Import from the full Firebase CDN URLs
import { auth } from "../model/model.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Function to update the navigation based on login state
function updateNav(user) {
  if (user) {
    $(".logged-in").show();
    $(".logged-out").hide();
  } else {
    $(".logged-in").hide();
    $(".logged-out").show();
  }
}

// Firebase's authentication state listener
onAuthStateChanged(auth, (user) => {
  console.log(user ? "User is logged in" : "User is logged out");
  updateNav(user);
  if (user) {
    if (window.location.hash === "#login") {
      window.location.hash = "home";
    }
  }
});

// Function to handle the active state of navigation links
function updateNavActiveState(pageID) {
  const navLinks = $(".desktop-nav a, .mobile-nav a");
  navLinks.removeClass("active");
  const activeLink = $(`a[href="#${pageID}"]`);
  activeLink.addClass("active");
}

function route() {
  let hashTag = window.location.hash;
  let pageID = hashTag.replace("#", "");
  $("body").removeClass("page-home page-login");

  if (pageID == "") {
    pageID = "home";
  }

  const user = auth.currentUser;
  if (!user && (pageID === "your-recipes" || pageID === "create-recipe-auth")) {
    pageID = "login";
  }

  $("body").addClass("page-" + pageID);
  updateNavActiveState(pageID);

  $.ajax({
    url: `pages/${pageID}.html`,
    success: function (data) {
      $("#app-content").html(data);
    },
    error: function () {
      $("#app-content").html("<h2>404 - Page Not Found</h2>");
    },
  });
}

function initListeners() {
  // Sign Up
  $("#app-content").on("click", "#signup-button", function (e) {
    e.preventDefault();
    const email = $("#signup-email").val();
    const password = $("#signup-password").val();
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Signed up successfully:", userCredential.user);
      })
      .catch((error) => {
        alert("Error signing up: " + error.message);
        console.error("Error signing up:", error);
      });
  });

  // Login
  $("#app-content").on("click", "#login-button", function (e) {
    e.preventDefault();
    const email = $("#login-email").val();
    const password = $("#login-password").val();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Logged in successfully:", userCredential.user);
      })
      .catch((error) => {
        alert("Error logging in: " + error.message);
        console.error("Error logging in:", error);
      });
  });

  // Logout
  $("header, .mobile-nav").on("click", "#logout-link, #mobile-logout-link", function (e) {
    e.preventDefault();
    signOut(auth)
      .then(() => {
        console.log("Logged out successfully.");
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