(function () {
  var footer = document.querySelector(".nc-site-footer-source > footer");
  if (!footer) return;
  var variants = ["framer-v-g21wlg", "framer-v-19swfjr", "framer-v-4na5j"];
  function apply() {
    var w = footer.parentElement.getBoundingClientRect().width || window.innerWidth;
    variants.forEach(function (v) { footer.classList.remove(v); });
    // Framer canvas widths used by this footer component:
    // desktop ~1728, tablet ~1000 (g21wlg), phone ~400 (19swfjr), small ~338 (4na5j)
    if (w <= 480) footer.classList.add("framer-v-4na5j");
    else if (w <= 809) footer.classList.add("framer-v-19swfjr");
    else if (w <= 1199) footer.classList.add("framer-v-g21wlg");
  }
  apply();
  window.addEventListener("resize", apply);

  // Framer export left Culture/Community/Taste/Experience/Outdoor/Stay without hrefs.
  // Wire them to the same Find Your Adventure category filters nelsoncounty.com uses.
  var destinations = {
    Culture: "https://nelsoncounty.com/find-your-adventure?category=culture",
    Community: "https://nelsoncounty.com/find-your-adventure?category=community",
    Taste: "https://nelsoncounty.com/find-your-adventure?category=taste",
    Experience: "https://nelsoncounty.com/find-your-adventure?category=experience",
    Outdoor: "https://nelsoncounty.com/find-your-adventure?category=outdoor",
    Stay: "https://nelsoncounty.com/find-your-adventure?category=stay"
  };
  footer.querySelectorAll('a[data-framer-name="Links"]').forEach(function (a) {
    var label = (a.textContent || "").replace(/\s+/g, " ").trim();
    var url = destinations[label];
    if (!url) return;
    if (a.getAttribute("href")) return;
    a.setAttribute("href", url);
  });
})();
