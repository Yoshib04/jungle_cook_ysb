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

function toggleMobileMenu() {
   $("#hamburger-icon").toggleClass("open");
   $(".mobile-nav").toggleClass("open");
}

$(document).ready(function () {
   route();

   $("#hamburger-icon").on("click", toggleMobileMenu);

   $("nav a").on("click", function (e) {
      let pageID = $(this).attr("href").substring(1);
      window.location.hash = pageID;

      if ($(".mobile-nav").hasClass("open")) {
         toggleMobileMenu();
      }
   });

   $(window).on("hashchange", route);
});
