/**
 * The banner, as it runs on somebody else's storefront.
 *
 * Kept as a string rather than as a module we compile and bundle, and the
 * reason is not laziness: this code is delivered by being *read* — pasted into
 * a theme by a shop owner, or reviewed by their developer before they agree to
 * paste it. A build step would put a minified artefact between what we wrote
 * and what they run, and an audit tool that hands somebody opaque code to
 * install on their storefront is asking for exactly the trust it spends its day
 * telling them not to give away.
 *
 * The cost is real and worth naming: nothing in here is typechecked. What
 * stands in for the compiler is `tests/blocking.test.ts`, which loads this into
 * a real browser on a page that fires real trackers and asserts that they do
 * not. That is a better guarantee than types would have given anyway — the
 * failure this code can have is not a wrong type, it is a request that got out.
 *
 * Written in the plain old dialect on purpose. It runs first, in whatever
 * browser a Brazilian shopper happens to own, ahead of any polyfill the theme
 * might load.
 *
 * The comments stay in English, like the rest of the code in this repository.
 * The Portuguese in the generated file is the header block that `snippet.ts`
 * writes above this, which is addressed to the person installing it.
 */
export const CONFIG_PLACEHOLDER = "__BUGSNIFF_CONFIG__";

export const RUNTIME = `(function () {
  var CONFIG = ${CONFIG_PLACEHOLDER};

  // Pasted twice — into the theme and into a page template, which happens —
  // the second copy would patch the patches and answer its own banner.
  if (window.bugsniffConsent) return;

  var COOKIE = "bugsniff_consent";
  var SIX_MONTHS = 180 * 86400;

  // The unpatched accessor, taken before anything else touches it. Everything
  // this banner does to its own cookie goes through here, so the block below
  // can never end up refusing the record of the visitor's own answer.
  var jar = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");

  function readJar() {
    try {
      return jar && jar.get ? jar.get.call(document) : document.cookie;
    } catch (error) {
      // A sandboxed frame throws on the mere mention of cookies. The banner
      // still has a job there: it renders, and it blocks.
      return "";
    }
  }

  function writeJar(line) {
    try {
      if (jar && jar.set) jar.set.call(document, line);
      else document.cookie = line;
    } catch (error) {}
  }

  function cookieValue(name) {
    var parts = ("; " + readJar()).split("; " + name + "=");
    return parts.length === 2 ? parts.pop().split(";").shift() : null;
  }

  /**
   * Which purposes the visitor has said yes to, or null if never asked.
   *
   * The difference matters more than the contents: null is the state the whole
   * product exists to talk about, and it is the state in which everything on
   * the list stays where it is.
   */
  function stored() {
    var value = cookieValue(COOKIE);
    if (value === null) return null;
    if (value === "none") return [];
    return value.split(",").filter(function (purpose) {
      return purpose === "analytics" || purpose === "marketing";
    });
  }

  var granted = stored();

  function allows(purpose) {
    return granted !== null && granted.indexOf(purpose) !== -1;
  }

  function compile(pattern) {
    try {
      return new RegExp(pattern, "i");
    } catch (error) {
      // One unusable pattern costs one service, never the whole banner.
      return null;
    }
  }

  function patterns(key) {
    var found = [];
    CONFIG.blocked.forEach(function (tracker) {
      if (allows(tracker.purpose) || !tracker[key]) return;
      var expression = compile(tracker[key]);
      if (expression) found.push(expression);
    });
    return found;
  }

  // Compiled once, at the top, because the answer cannot change while this page
  // is alive: a decision reloads, so what is held is fixed for the visit. The
  // alternative is recompiling every expression on every request a busy shop
  // makes, which is a few thousand of them.
  var HOSTS = patterns("host");
  var COOKIES = patterns("cookie");

  function anyMatch(expressions, value) {
    return expressions.some(function (expression) {
      return expression.test(value);
    });
  }

  function hostOf(url) {
    try {
      return new URL(url, location.href).hostname;
    } catch (error) {
      return "";
    }
  }

  function blockedUrl(url) {
    if (!url || HOSTS.length === 0) return false;
    var host = hostOf(String(url));
    return host ? anyMatch(HOSTS, host) : false;
  }

  function blockedCookie(line) {
    if (COOKIES.length === 0) return false;
    var name = String(line).split("=")[0].trim();
    return name ? anyMatch(COOKIES, name) : false;
  }

  // ---------------------------------------------------------------- blocking

  // Cookies. Defined on the document itself, which shadows the accessor the
  // store's own scripts reach for on the prototype.
  //
  // What this cannot do is unwrite a cookie the store's *server* sent in a
  // response header. No script on the page can; that one needs the platform
  // integration, and until then it is a limit the install instructions state
  // out loud rather than a gap somebody discovers.
  try {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: function () {
        return readJar();
      },
      set: function (line) {
        if (!blockedCookie(line)) writeJar(line);
      },
    });
  } catch (error) {}

  // src, on the three elements a tracker arrives by.
  //
  // Patched on the prototype rather than watched in the DOM, because the most
  // common shape of a pixel by far — new Image().src = "..." — fires its
  // request from an element that is never inserted anywhere, and a
  // MutationObserver never sees it at all.
  ["HTMLScriptElement", "HTMLImageElement", "HTMLIFrameElement"].forEach(
    function (name) {
      var prototype = window[name] && window[name].prototype;
      var src =
        prototype && Object.getOwnPropertyDescriptor(prototype, "src");
      if (!src || !src.set) return;

      Object.defineProperty(prototype, "src", {
        configurable: true,
        get: src.get,
        set: function (value) {
          if (!blockedUrl(value)) src.set.call(this, value);
        },
      });
    }
  );

  // setAttribute, which is the other way to say the same thing.
  var setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (String(name).toLowerCase() === "src" && blockedUrl(value)) return;
    return setAttribute.apply(this, arguments);
  };

  // And the three that leave no element behind at all.
  var fetched = window.fetch;
  if (fetched) {
    window.fetch = function (input) {
      var url = typeof input === "string" ? input : input && input.url;
      if (blockedUrl(url)) {
        // An empty 204 rather than a rejection: a tracker whose call throws
        // can take the store's own script down with it, and breaking the shop
        // is not an outcome this banner is allowed to have.
        return Promise.resolve(new Response("", { status: 204 }));
      }
      return fetched.apply(this, arguments);
    };
  }

  var open = XMLHttpRequest.prototype.open;
  var send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__bugsniffHeld = blockedUrl(url);
    return open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    if (this.__bugsniffHeld) return;
    return send.apply(this, arguments);
  };

  var beacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
  if (beacon) {
    navigator.sendBeacon = function (url) {
      // True, not false. A caller told the beacon failed sends it again, and
      // the retry is the same request we just declined.
      if (blockedUrl(url)) return true;
      return beacon.apply(null, arguments);
    };
  }

  /**
   * The last line, for a tag the page was born with.
   *
   * A script tag written into the theme's HTML is fetched by the parser before
   * any of the patches above can be reached — nothing running in JavaScript
   * gets in front of that. Stripping the src as the node appears does not
   * unsend the request, but it does stop the tag from executing, which is what
   * decides whether the tracker actually starts. The honest fix is the
   * platform integration rewriting those tags; this is what is possible from
   * inside the page.
   */
  if (window.MutationObserver) {
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (!node.tagName) return;
          var tag = node.tagName.toLowerCase();
          if (tag !== "script" && tag !== "img" && tag !== "iframe") return;

          var url = node.getAttribute && node.getAttribute("src");
          if (!blockedUrl(url)) return;

          node.removeAttribute("src");
          if (tag === "script") node.type = "text/plain";
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  /**
   * Cookies that were already there when the banner arrived.
   *
   * The store tracked people before it was audited, and those cookies outlive
   * the fix by up to two years. Blocking new writes while leaving the old
   * identifiers in place would leave the visitor identified by exactly the
   * services they just refused.
   *
   * Every parent domain is tried because a tracker's cookie is usually set on
   * one — ".loja.com.br", not "loja.com.br" — and the browser refuses the
   * ones that are not ours to touch.
   */
  function sweep() {
    if (COOKIES.length === 0) return;

    var names = readJar()
      .split(";")
      .map(function (pair) {
        return pair.split("=")[0].trim();
      })
      .filter(function (name) {
        return name && anyMatch(COOKIES, name);
      });

    var labels = location.hostname.split(".");
    names.forEach(function (name) {
      var dead = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      writeJar(dead);
      for (var i = 0; i < labels.length - 1; i++) {
        writeJar(dead + "; domain=." + labels.slice(i).join("."));
      }
    });
  }

  sweep();

  // ------------------------------------------------------------------ asking

  function decide(purposes) {
    writeJar(
      COOKIE +
        "=" +
        (purposes.length ? purposes.join(",") : "none") +
        "; path=/; max-age=" +
        SIX_MONTHS +
        "; samesite=lax" +
        (location.protocol === "https:" ? "; secure" : "")
    );

    // Reloaded rather than replayed. What was held back was held back by never
    // being created — a script element whose src was refused is not a script
    // waiting to be released — so the only honest way to let it fire is the
    // ordinary page view it would have fired on. It is also what makes the
    // refusal complete: the sweep runs again from the top.
    location.reload();
  }

  var text = CONFIG.text;
  var colors = CONFIG.colors;

  /**
   * The banner's own root, kept out of the store's CSS.
   *
   * A shadow root because the alternative is a fight nobody wins: a theme with
   * a global rule for "button" or "div" repaints our banner, and a banner
   * whose refuse button has been restyled by the store it is installed on is
   * the exact dark pattern this whole thing exists to point at.
   */
  var mount = document.createElement("div");
  mount.id = "bugsniff-consent";
  var root = mount.attachShadow ? mount.attachShadow({ mode: "open" }) : mount;

  var style = document.createElement("style");
  style.textContent =
    ":host{all:initial}" +
    ".bar{position:fixed;inset:auto 0 0 0;z-index:2147483647;display:flex;" +
    "justify-content:center;padding:12px;box-sizing:border-box;" +
    "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
    ".card{width:100%;max-width:720px;box-sizing:border-box;padding:16px 18px;" +
    "border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.18);" +
    "background:" + colors.background + ";color:" + colors.foreground + "}" +
    ".title{margin:0;font-size:14px;font-weight:600;line-height:1.35}" +
    ".body{margin:6px 0 0;font-size:13px;line-height:1.45;opacity:.8}" +
    ".acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}" +
    // The one rule in this stylesheet that is a product decision rather than a
    // taste: all three controls share it. Same size, same weight, same
    // colours, no outline variant for the refusal and no fill for the accept.
    // A banner whose accept is louder than its refusal is the finding this
    // product writes about other people's stores.
    // "1 1 0" and not "1 1 auto": with the basis on the content, the longest
    // label would come out the widest button, and the accept is usually the
    // longest label. Same prominence has to mean the same width too.
    ".act{flex:1 1 0;min-width:132px;padding:9px 14px;border:0;" +
    "border-radius:999px;font-family:inherit;font-size:13px;font-weight:600;" +
    "cursor:pointer;background:" + colors.accent + ";color:" +
    colors.accentForeground + "}" +
    ".prefs{margin-top:14px;display:flex;flex-direction:column;gap:10px}" +
    ".prefs[hidden]{display:none}" +
    ".choice{display:flex;gap:9px;align-items:flex-start;font-size:13px;" +
    "line-height:1.35}" +
    ".choice input{margin:1px 0 0}" +
    ".note{font-size:12px;opacity:.65}";

  root.appendChild(style);

  var card = document.createElement("div");
  card.className = "card";
  card.setAttribute("role", "dialog");
  // Not modal, and not a wall. The visitor who wants to read the shop before
  // answering is allowed to, which is also what the ANPD guidance describes.
  card.setAttribute("aria-modal", "false");
  card.setAttribute("aria-label", text.title);

  var title = document.createElement("p");
  title.className = "title";
  // textContent, everywhere, for every string that came from the form. The
  // wording is somebody's input and it is never markup.
  title.textContent = text.title;

  var body = document.createElement("p");
  body.className = "body";
  body.textContent = text.body;

  card.appendChild(title);
  card.appendChild(body);

  function action(label, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "act";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  var prefs = document.createElement("div");
  prefs.className = "prefs";
  prefs.hidden = true;

  var boxes = {};

  function choice(label, purpose) {
    var row = document.createElement("label");
    row.className = "choice";

    var box = document.createElement("input");
    box.type = "checkbox";
    if (purpose) {
      box.checked = allows(purpose);
      // Named in the markup as well as in the closure, so a test — and the
      // shop owner's developer with a console open — can find the toggle for a
      // purpose without reading the labels the shop rewrote.
      box.setAttribute("data-purpose", purpose);
      boxes[purpose] = box;
    } else {
      // Ticked and disabled, because it is a fact rather than an offer. A
      // checkbox that cannot be unticked is only honest when it is not
      // pretending to be a choice.
      box.checked = true;
      box.disabled = true;
    }

    var caption = document.createElement("span");
    caption.textContent = label;

    row.appendChild(box);
    row.appendChild(caption);
    return row;
  }

  prefs.appendChild(choice(text.essential, null));
  // Only the purposes this store actually has. A panel offering a choice about
  // advertising to the visitor of a shop that runs none would be a form
  // invented to look thorough.
  CONFIG.purposes.forEach(function (purpose) {
    prefs.appendChild(choice(text[purpose], purpose));
  });

  prefs.appendChild(
    action(text.save, function () {
      decide(
        CONFIG.purposes.filter(function (purpose) {
          return boxes[purpose] && boxes[purpose].checked;
        })
      );
    })
  );

  var acts = document.createElement("div");
  acts.className = "acts";

  acts.appendChild(
    action(text.acceptAll, function () {
      decide(CONFIG.purposes.slice());
    })
  );
  acts.appendChild(
    action(text.rejectAll, function () {
      decide([]);
    })
  );
  acts.appendChild(
    action(text.manage, function () {
      prefs.hidden = !prefs.hidden;
    })
  );

  card.appendChild(acts);
  card.appendChild(prefs);

  var bar = document.createElement("div");
  bar.className = "bar";
  bar.appendChild(card);
  root.appendChild(bar);

  function show() {
    if (!mount.isConnected) document.body.appendChild(mount);
    bar.style.display = "flex";
  }

  function onReady(run) {
    if (document.body) return run();
    document.addEventListener("DOMContentLoaded", run);
  }

  // The visitor's way back, which is the other half of asking: consent that
  // cannot be withdrawn as easily as it was given was never much of a choice.
  // A link anywhere on the store calling bugsniffConsent.open() reopens this.
  window.bugsniffConsent = {
    open: function () {
      onReady(show);
    },
    granted: granted,
  };

  if (granted === null) onReady(show);
})();
`;
