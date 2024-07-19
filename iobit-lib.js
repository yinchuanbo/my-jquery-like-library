(function (global, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory(global);
  } else {
    factory(global);
  }
})(typeof window !== "undefined" ? window : this, function (window) {
  const myLibrary = function (selector) {
    return new myLibrary.fn.init(selector);
  };
  myLibrary.fn = myLibrary.prototype = {
    constructor: myLibrary,
    headers: {},
    init: function (selector) {
      if (!selector) {
        return this;
      }
      this.elements = document.querySelectorAll(selector);
      return this;
    },
    each: function (callback) {
      Array.prototype.forEach.call(this.elements, callback);
      return this;
    },
  };
  myLibrary.fn.init.prototype = myLibrary.fn;
  window.$$ = window.myLibrary = myLibrary;
  return myLibrary;
});

myLibrary.fn.extend = function (obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      myLibrary.fn[key] = obj[key];
    }
  }
  return this;
};

// DOM
myLibrary.fn.extend({
  qs: function (selector, doc = document) {
    if (selector) {
      return doc.querySelector(selector);
    }
    return this.elements[0];
  },
  qsAll: function (selector = null, doc = document) {
    if (selector) {
      return doc.querySelectorAll(selector);
    }
    return this.elements;
  },
  addClass: function (className) {
    return this.each((item) => {
      item.classList.add(className);
    });
  },
  removeClass: function (className) {
    return this.each((item) => {
      item.classList.remove(className);
    });
  },
  toggleClass: function (className) {
    return this.each((item) => {
      item.classList.toggle(className);
    });
  },
  css: function (property, value, selector = null) {
    if (selector) {
      const items = this.qsAll(selector);
      if (items?.length) {
        items.forEach((item) => {
          item.style[property] = value;
        });
      }
      return;
    }
    return this.each((item) => {
      item.style[property] = value;
    });
  },
  append: function (content) {
    return this.each(function (item) {
      if (typeof content === "string") {
        item.insertAdjacentHTML("beforeend", content);
      } else if (content instanceof HTMLElement) {
        item.appendChild(content);
      }
    });
  },
  prepend: function (content) {
    return this.each(function (item) {
      if (typeof content === "string") {
        item.insertAdjacentHTML("afterbegin", content);
      } else if (content instanceof HTMLElement) {
        item.insertBefore(content, item.firstChild);
      }
    });
  },
});

// 事件
myLibrary.fn.extend({
  on: function (event, handler) {
    return this.each(function () {
      this.addEventListener(event, handler);
    });
  },
  off: function (event, handler) {
    return this.each(function () {
      this.removeEventListener(event, handler);
    });
  },
});

// 本地存储
myLibrary.fn.extend({
  setItem: function (key, value) {
    if (!key) return;
    key = key.toString();
    value = typeof value === "string" ? value : JSON.stringify(value);
    window.localStorage.setItem(key, value);
  },
  getItem: function (key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (error) {
      return localStorage.getItem(key);
    }
  },
  removeItem: function (key) {
    if (!key) {
      window.localStorage.clear();
      return;
    }
    if (typeof key === "string") {
      window.localStorage.removeItem(key);
    } else if (Array.isArray(key)) {
      for (let i = 0; i < key.length; i++) {
        window.localStorage.removeItem(key[i]);
      }
    }
  },
  setCookie: function (c_name, value, expiredays, host = ".vidnoz.com") {
    const exdate = new Date();
    exdate.setDate(exdate.getDate() + expiredays);
    const c_value =
      encodeURIComponent(value) +
      (expiredays == null ? "" : ";expires=" + exdate.toUTCString()) +
      ";path=/;domain=" +
      host;
    document.cookie = c_name + "=" + c_value;
  },
  getCookie: function (cookieName) {
    const allCookies = document.cookie;
    const cookiesArray = allCookies.split(";");
    for (const cookie of cookiesArray) {
      const [key, value] = cookie.trim().split("=");
      if (key === cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },
});

// request 请求
myLibrary.fn.extend({
  get: function (url, headers = {}) {
    const controller = new AbortController();
    const { signal } = controller;
    controllers.push(controller);
    return fetch(url, {
      method: "GET",
      headers: {
        ...this.headers,
        ...headers,
      },
      signal,
    }).then((response) => response.json());
  },
  post: function (url, data, headers = {}) {
    const controller = new AbortController();
    const { signal } = controller;
    controllers.push(controller);
    return fetch(url, {
      method: "POST",
      headers: {
        ...this.headers,
        ...headers,
      },
      signal,
      body: JSON.stringify(data),
    }).then((response) => response.json());
  },
  postFormData: function (url, data, headers = {}) {
    const controller = new AbortController();
    const { signal } = controller;
    controllers.push(controller);
    const curHeaders = {
      ...this.headers,
      ...headers,
    };
    delete curHeaders["Content-Type"];
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }
    return fetch(url, {
      method: "POST",
      headers: curHeaders,
      signal,
      body: formData,
    }).then((response) => response.json());
  },
  put: function (url, data, headers = {}) {
    const controller = new AbortController();
    const { signal } = controller;
    controllers.push(controller);
    return fetch(url, {
      method: "PUT",
      headers,
      signal,
      body: data,
    }).then((response) => response.status);
  },
});

// API 封装

// 获取设备类型
myLibrary.fn.extend({
  isMobile: function () {
    const userAgent = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  },
  isIosOrAndroid: function () {
    var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
    var isiOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isAndroid) {
      return "android";
    } else if (isiOS) {
      return "ios";
    }
  },
});

// 下载
myLibrary.fn.extend({
  downloadAssets: function (url, filename = "", callback = () => {}) {
    let error = false;
    this.get(url)
      .then((response) => {
        if (!response.ok) {
          error = true;
          callback?.({
            status: response.status,
            error: true,
          });
          return;
        } else {
          error = false;
        }
        const contentLength = response.headers.get("Content-Length");
        const total = parseInt(contentLength, 10);
        let loaded = 0;
        const reader = response.body.getReader();
        return new ReadableStream({
          start(controller) {
            function pump() {
              return reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }
                loaded += value.length;
                const progress = Math.round((loaded / total) * 100);
                callback?.({
                  status: response.status,
                  progress: progress,
                  error: false,
                });
                controller.enqueue(value);
                return pump();
              });
            }
            return pump();
          },
        });
      })
      .then((stream) => new Response(stream))
      .then((response) => response.blob())
      .then((blob) => {
        if (!error) {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(blobUrl);
        }
      })
      .catch(() => {
        callback?.({
          status: 500,
          error: true,
        });
      });
  },
});

// Other
myLibrary.fn.extend({
  httpsTemp: function (str, bool = true) {
    return bool ? `https://${str}/` : `https://${str}/`;
  },
  copyText: async (val) => {
    if (navigator.clipboard && navigator.permissions) {
      await navigator.clipboard.writeText(val);
    } else {
      const textArea = document.createElement("textArea");
      textArea.value = val;
      textArea.style.width = "100px";
      textArea.style.position = "fixed";
      textArea.style.left = "-999px";
      textArea.style.top = "10px";
      // textArea.setAttribute("readonly", "readonly");
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);
      document.execCommand("copy");
      setTimeout(() => {
        document.body.removeChild(textArea);
      }, 0);
    }
  },
  watchFileUpload: function (fileInput, callback) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        callback(file);
      }
    });
  },
});
