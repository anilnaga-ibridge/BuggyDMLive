// Quick Application Bootstrap Script
if (typeof window.serviceWorkerVersion === 'undefined') {
  window.serviceWorkerVersion = null;
}

// Check if localStorage is supported in the browser
if (typeof (Storage) !== "undefined") {
  var itemValue = localStorage.getItem("flutter.6ammart_theme");
  if (itemValue !== null) {
    if (itemValue === "true") {
      document.body.classList.add("theme-dark");
    } else {
      document.body.classList.remove("theme-light");
    }
  }
}

function removePreloader() {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.classList.add('preloader-fade-out');
    setTimeout(function() {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, 350);
  }
}

function initSvg() {
  document.querySelectorAll("img.svg").forEach(function (img) {
    var imgID = img.getAttribute("id");
    var imgClass = img.getAttribute("class");
    var imgURL = img.getAttribute("src");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", imgURL, true);
    xhr.responseType = "document";
    xhr.onload = function () {
      if (xhr.status === 200) {
        var data = xhr.response;
        var svg = data ? data.querySelector("svg") : null;
        if (svg) {
          if (typeof imgID !== "undefined") {
            svg.setAttribute("id", imgID);
          }
          if (typeof imgClass !== "undefined") {
            svg.setAttribute("class", imgClass + " replaced-svg");
          }
          svg.removeAttribute("xmlns:a");
          if (!svg.getAttribute("viewBox") && svg.getAttribute("height") && svg.getAttribute("width")) {
            svg.setAttribute("viewBox", "0 0 " + svg.getAttribute("height") + " " + svg.getAttribute("width"));
          }
          img.parentNode.replaceChild(svg, img);
        }
      }
    };
    xhr.send();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSvg);
} else {
  initSvg();
}

// Flutter Web initialization
function startFlutterApp() {
  if (window._flutter && window._flutter.loader) {
    _flutter.loader.loadEntrypoint({
      serviceWorker: {
        serviceWorkerVersion: typeof serviceWorkerVersion !== "undefined" ? serviceWorkerVersion : null,
      },
      onEntrypointLoaded: function (engineInitializer) {
        let config = { renderer: 'canvaskit' };
        engineInitializer.initializeEngine(config).then(function (appRunner) {
          if (document.getElementById('splash'))
            document.getElementById('splash').remove();
          appRunner.runApp();
          setTimeout(removePreloader, 400);
        });
      }
    });
  } else {
    setTimeout(startFlutterApp, 25);
  }
}

if (document.readyState === 'complete') {
  startFlutterApp();
} else {
  window.addEventListener('load', startFlutterApp);
}
