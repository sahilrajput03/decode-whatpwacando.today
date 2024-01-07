import { isTouchScreen, isOffline } from "./utils.js";

export const router = ({ outlet, nav, routes, onAfterRender }) => {
  const domain = location.origin;

  outlet.addEventListener("animationend", (e) => {
    if (e.animationName === "fadeout") {
      const curView = outlet.querySelector(".current");
      curView.classList.add("active");
      curView.classList.remove("current");
    }
  });

  const navLinks = nav
    ? [...nav.querySelectorAll("a")].map((link) => {
        link.dataset.href = link.href.replace(domain, "");

        return link;
      })
    : [];

  const getMatchedRoute = (u) =>
    routes.reduce((matched, route) => {
      const url = new URL(u);
      const parameters = route.url.match(/(:([a-z]+))/g);
      const routeUrl = parameters
        ? route.url.replace(/(:[a-z]+)/g, "(.+)")
        : route.url;
      const routeParams = parameters
        ? parameters.map((param) => param.substr(1))
        : [];
      const routeRegex = new RegExp(`^${routeUrl}$`);
      const result = routeRegex.exec(url.pathname);
      const query = url.search;

      if (result) {
        const paramValues = result
          .slice(1)
          .map((param) => param.split("?").shift());

        route.params = routeParams.reduce((acc, key, index) => {
          acc[key] = paramValues[index];
          return acc;
        }, {});

        if (url.search.length) {
          url.searchParams.forEach((value, key) => (route.params[key] = value));
        }

        return Object.assign({}, route, { url: result[0] });
      }
      return matched;
    });

  const supportsViewTransitions = () => "startViewTransition" in document;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && isTouchScreen()) {
      const activeView = document.querySelector(".view.active");

      const activeUrl = activeView ? activeView.dataset.view : null;

      if (activeUrl) {
        const activeRoute = routes.find((route) => route.url === activeUrl);

        if (
          activeRoute.onExit &&
          "exitOnHidden" in activeRoute &&
          activeRoute.exitOnHidden
        ) {
          activeRoute.onExit();
        }
      }
    }
  });

  const hasView = (url) =>
    outlet.querySelector(`div[data-view="${url}"]`) !== null;

  const addView = (url, template, reload = false) => {
    const container = document.createElement("div");
    container.insertAdjacentHTML("beforeend", template);
    const view = container.querySelector(".view");

    view.dataset.view = url;
    view.classList.add("active");

    if (reload) {
      view.classList.remove("next-screen");
    }

    outlet.insertAdjacentElement("beforeend", view);
  };

  const renderTemplate = ({ template, url }, reload) => {
    if (outlet.querySelector("[data-shell-content]")) {
      outlet
        .querySelectorAll("[data-shell-content]")
        .forEach((el) => el.remove());
    }

    if (!hasView(url)) {
      addView(url, template, reload);
    }

    const prevView = outlet.querySelector(".view.active");
    const nextView = outlet.querySelector(`div[data-view="${url}"]`);

    setTimeout(() => {
      if (prevView === nextView) {
        prevView.classList.remove("next-screen");
      } else {
        const prevViewClass = nextView.classList.contains("next-screen")
          ? "prev-screen"
          : "next-screen";
        const nextViewClass = nextView.classList.contains("prev-screen")
          ? "current"
          : "active";
        prevView.classList.remove("active");
        prevView.classList.add(prevViewClass);

        nextView.classList.add(nextViewClass);
        nextView.classList.remove(
          prevViewClass === "next-screen" ? "prev-screen" : "next-screen"
        );

        if (onAfterRender && typeof onAfterRender === "function") {
          onAfterRender();
        }
      }
    }, 10);
  };

  const setActiveLink = (url) => {
    navLinks.forEach((link) => {
      if (
        (link.dataset.href === "/" && link.dataset.href === url) ||
        (link.dataset.href !== "/" && url.indexOf(link.dataset.href) === 0)
      ) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  };

  const activateRoute = (route, reload = false) => {
    renderTemplate(route, reload);
    setActiveLink(route.url);

    if (typeof route.controller === "function") {
      route.controller(route.params);
    }

    document
      .querySelector('meta[property="og:url"]')
      .setAttribute("content", location.href);
  };

  const matchRoute = async (url, reload = false) => {
    const matchedRoute = getMatchedRoute(url);

    if (matchedRoute) {
      const { template } =
        typeof matchedRoute.template === "string"
          ? matchedRoute
          : await matchedRoute.template();

      matchedRoute.template = template;

      const state = { template, url };

      if (!reload) {
        history.pushState(state, null, url);
      }

      const activeView = document.querySelector(".view.active");

      const activeUrl = activeView ? activeView.dataset.view : null;

      if (activeUrl) {
        const activeRoute = routes.find((route) => route.url === activeUrl);

        if (activeRoute.onExit) {
          activeRoute.onExit();
        }
      }

      activateRoute(matchedRoute, reload);
    }
  };

  const isInternalLink = (el) => el.href && el.href.includes(domain);
  const isBackLink = (el) => el.classList && el.classList.contains("back");

  const handleClick = (e) => {
    const path = e.composedPath();
    const backLink = path.find(isBackLink);
    const internalLink = path.find(isInternalLink);
    const openInSameTab = !e.ctrlKey && !e.metaKey;

    if (backLink) {
      history.back();
    } else {
      if (internalLink && openInSameTab) {
        e.preventDefault();

        matchRoute(internalLink.href);

        return false;
      } else if (!internalLink && isOffline()) {
        e.preventDefault();
      }
    }
  };

  if (supportsViewTransitions()) {
    const isBackNavigation = (e) => {
      const { navigationType, destination } = e;
      if (navigationType === "push" || navigationType === "replace") {
        return false;
      }
      if (
        destination.index !== -1 &&
        destination.index < navigation.currentEntry.index
      ) {
        return true;
      }
      return false;
    };

    navigation.addEventListener("navigate", (e) => {
      const { url } = e.destination;
      const { navigationType } = e;

      if (url === location.href && navigationType !== "reload") {
        e.preventDefault();
        return;
      }

      const backNavigation = isBackNavigation(e);

      if (backNavigation) {
        document.documentElement.classList.add("back-transition");
      }

      if (navigationType === "reload") {
        document.documentElement.classList.add("reload-transition");
      }

      e.intercept({
        scroll: "manual", // makes sure home page opens scrolled to top on back navigation
        async handler() {
          const matchedRoute = getMatchedRoute(url);

          if (matchedRoute) {
            const { template } =
              typeof matchedRoute.template === "string"
                ? matchedRoute
                : await matchedRoute.template();
            const transition = document.startViewTransition(() => {
              // makes sure new page is scrolled to top on forward navigation
              if (!backNavigation) {
                window.scrollTo(0, 0);
              }
              outlet.innerHTML = template;

              if (typeof matchedRoute.controller === "function") {
                matchedRoute.controller(matchedRoute.params);
              }
            });

            try {
              await transition.finished;
            } finally {
              document.documentElement.classList.remove(
                "back-transition",
                "reload-transition"
              );
            }
          }
        },
      });
    });

    document.body.addEventListener("click", async (e) => {
      const path = e.composedPath();
      const backLink = path.find(isBackLink);

      if (backLink) {
        try {
          await navigation.back().finished;
        } catch (e) {
          navigation.navigate("/");
        }
      }
    });

    const loadRoute = async () => {
      const matchedRoute = getMatchedRoute(location.href);

      if (matchedRoute) {
        const { template } =
          typeof matchedRoute.template === "string"
            ? matchedRoute
            : await matchedRoute.template();
        outlet.innerHTML = template;

        if (typeof matchedRoute.controller === "function") {
          matchedRoute.controller(matchedRoute.params);
        }
      }
    };

    loadRoute();
  } else {
    outlet.addEventListener("click", handleClick);

    document
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("click", handleClick));

    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.url) {
        const matchedRoute = getMatchedRoute(e.state.url);
        matchedRoute.template = e.state.template;

        activateRoute(matchedRoute);
      } else {
        e.preventDefault();
        matchRoute(location.origin);
      }
    });

    matchRoute(location.href, true);
  }
};

// https://stackoverflow.com/questions/19662434/in-ios-7-safari-how-do-you-differentiate-popstate-events-via-edge-swipe-vs-the
