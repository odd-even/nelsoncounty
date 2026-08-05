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
})();
