// On page load or when changing themes, best to add inline in `head` to avoid FOUC
if (
  localStorage.theme === "dark" ||
  (!("theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

document.addEventListener("DOMContentLoaded", () => {
  // Theme toggle functionality
  const themeToggleBtns = Array.from(
    document.getElementsByClassName("theme-toggle")
  );
  const themeDarkIcons = Array.from(
    document.getElementsByClassName("theme-toggle-dark-icon")
  );
  const themeLightIcons = Array.from(
    document.getElementsByClassName("theme-toggle-light-icon")
  );

  // Change the icons inside the button based on previous settings
  if (themeDarkIcons.length > 0 && themeLightIcons.length > 0) {
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      themeLightIcons.forEach((icon) => icon.classList.remove("hidden"));
    } else {
      themeDarkIcons.forEach((icon) => icon.classList.remove("hidden"));
    }
  }

  // Theme toggle handler
  if (
    themeToggleBtns.length > 0 &&
    themeDarkIcons.length > 0 &&
    themeLightIcons.length > 0
  ) {
    themeToggleBtns.forEach((themeToggleBtn) => {
      themeToggleBtn.addEventListener("click", function () {
        // Toggle icons
        themeDarkIcons.forEach((icon) => icon.classList.toggle("hidden"));
        themeLightIcons.forEach((icon) => icon.classList.toggle("hidden"));

        // Toggle dark class on html element
        document.documentElement.classList.toggle("dark");

        // Save preference to localStorage
        const isDark = document.documentElement.classList.contains("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      });
    });
  }

  // Initialize mobile menu
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuButton && mobileMenu) {
    // Toggle mobile menu
    const toggleMobileMenu = (e) => {
      if (e) e.stopPropagation();
      const isExpanded =
        mobileMenuButton.getAttribute("aria-expanded") === "true" || false;
      mobileMenuButton.setAttribute("aria-expanded", !isExpanded);
      mobileMenu.classList.toggle("hidden");

      // Toggle between menu and close icon
      const menuIcon = mobileMenuButton.querySelector("svg");
      if (menuIcon) {
        menuIcon.innerHTML = isExpanded
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />';
      }
    };

    // Close menu when clicking outside
    const closeMenuOnOutsideClick = (e) => {
      if (
        !mobileMenuButton.contains(e.target) &&
        !mobileMenu.contains(e.target)
      ) {
        mobileMenu.classList.add("hidden");
        mobileMenuButton.setAttribute("aria-expanded", "false");
        const menuIcon = mobileMenuButton.querySelector("svg");
        if (menuIcon) {
          menuIcon.innerHTML =
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />';
        }
      }
    };

    // Add event listeners
    mobileMenuButton.addEventListener("click", toggleMobileMenu);
    document.addEventListener("click", closeMenuOnOutsideClick);
  }

  // Add fade-in animations
  const fadeElements = document.querySelectorAll(".fade-in, .fade-in-up");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          entry.target.classList.add("opacity-100", "translate-y-0");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  fadeElements.forEach((element) => {
    observer.observe(element);
  });

  // Add dynamic styles
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.textContent = `
          @keyframes blob {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0, 0) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
          .animation-delay-6000 { 
            animation-delay: 6s;
            animation-duration: 8s;
          }
          /* Dark mode specific styles */
          .dark .google-gradient {
            opacity: 0.9;
          }
          .dark .bg-white {
            background-color: var(--card-bg);
          }
          .dark .text-gray-800 {
            color: var(--text);
          }
        `;
  document.head.appendChild(styleSheet);
});
const createApp = () => {
  alert("Not available yet!, Please wait for the next update");
};
