interface Window {
  CradovaEvent: any;
}

document.addEventListener("DOMContentLoaded", () => {
  const cradovaEvent = window.CradovaEvent;
  if (cradovaEvent) {
    cradovaEvent["after_comp_is_mounted"].push(function () {
      const cra_scroll_pos = parseInt(
        sessionStorage.getItem("cra_scroll_pos") || "",
        10,
      );
      if (cra_scroll_pos) {
        if (!isNaN(cra_scroll_pos)) {
          window.scrollTo(0, cra_scroll_pos);
        }
        sessionStorage.removeItem("cra_scroll_pos");
      }
    });
  }
});
window.addEventListener("beforeunload", function (e) {
  sessionStorage.setItem("cra_scroll_pos", String(window.scrollY));
});
