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
  // ********************* 配置 **********************
  const httpsTemp = (str) => {
    return `https://${str}/`;
  };
  const isProduction = location.host.includes("www.vidnoz.com") ? true : false;
  const headers = {
    "Content-Type": "application/json",
    "X-TASK-VERSION": XTASKVERSION || "2.0.0",
  };
  const baseApi = isProduction
    ? httpsTemp("tool-api.vidnoz.com")
    : httpsTemp("tool-api-test.vidnoz.com");
  const pcAppDomain = isProduction
    ? httpsTemp("aiapp.vidnoz.com")
    : httpsTemp("ai-test.vidnoz.com");
  const mAppDomain = isProduction
    ? httpsTemp("m.vidnoz.com")
    : httpsTemp("m-test-f700c64e.vidnoz.com");
  // ********************* 配置 **********************
  myLibrary.fn = myLibrary.prototype = {
    constructor: myLibrary,
    controllers: [],
    isProduction,
    headers,
    baseApi,
    httpsTemp,
    pcAppDomain,
    mAppDomain,
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
  getHeaders: function () {
    const headers = this.headers;
    const curToken = this.getCookie("access_token");
    if (curToken) {
      headers["Authorization"] = "Bearer " + curToken;
    } else {
      delete this.headers?.Authorization;
    }
    return headers;
  },
  get: function (url, headers = {}) {
    const controller = new AbortController();
    const { signal } = controller;
    this.controllers.push(controller);
    return fetch(url, {
      method: "GET",
      headers: {
        ...this.getHeaders(),
        ...headers,
      },
      signal,
    }).then((response) => response.json());
  },
  post: function (url, data, headers = {}) {
    const controller = new AbortController();
    const { signal } = controller;
    this.controllers.push(controller);
    return fetch(url, {
      method: "POST",
      headers: {
        ...this.getHeaders(),
        ...headers,
      },
      signal,
      body: JSON.stringify(data),
    }).then((response) => response.json());
  },
  postFormData: function (url, data, headers = {}) {
    const controller = new AbortController();
    const { signal } = controller;
    this.controllers.push(controller);
    const curHeaders = {
      ...this.getHeaders(),
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
    this.controllers.push(controller);
    return fetch(url, {
      method: "PUT",
      headers,
      signal,
      body: data,
    }).then((response) => response.status);
  },
});

// API 封装
myLibrary.fn.extend({
  addTask: async function (params = {}) {
    try {
      const res = await this.post(`${this.baseApi}ai/ai-tool/add-task`, params);
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  getTask: async function (params = {}) {
    try {
      const res = await this.post(`${this.baseApi}ai/tool/get-task`, params);
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  getTaskLoop: async function (taskId, callback = () => {}) {
    let time = 0;
    while (true) {
      try {
        const res = await this.getTask({
          id: taskId,
        });
        const status = res?.data?.status;
        if (status === 0) {
          await callback?.(res);
          return Promise.resolve(res?.data?.additional_data ?? {});
        } else if (![0, -1, -2].includes(status)) {
          return Promise.reject();
        }
      } catch (error) {
        if (time >= 5) {
          return Promise.reject();
        }
        time++;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  },
  // loop 为轮询函数，callback 为异步函数
  loop: async function (addTData = {}, callback = () => {}) {
    try {
      const res = await this.addTask(addTData);
      const code = res?.code;
      const taskId = res?.data?.task_id;
      if (code === 200 && taskId) {
        try {
          const data = await this.getTaskLoop(taskId, callback);
          return Promise.resolve({
            code: 200,
            task_id: taskId,
            data,
          });
        } catch (error) {
          return Promise.reject(error);
        }
      } else {
        return Promise.resolve({
          code,
        });
      }
    } catch (error) {
      return Promise.reject(error);
    }
  },
  getAccessUrl: async function (params = {}) {
    try {
      const res = await this.post(
        `${this.baseApi}ai/source/get-access-url`,
        params
      );
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  tempUploadUrl: async function (params = {}) {
    try {
      const res = await this.post(
        `${this.baseApi}ai/source/temp-upload-url`,
        params
      );
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  canTask: async function (params = {}) {
    try {
      const res = await this.post(`${this.baseApi}ai/tool/can-task`, params);
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
});

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

// components
myLibrary.fn.extend({
  UniversalPopup: function ({
    title = "",
    desc = "",
    btnText = "",
    status = "success",
  }) {
    const popupDoms = this.qsAll(".UniversalPopup");
    if (popupDoms?.length) {
      popupDoms.forEach((item) => {
        item.remove();
      });
    }
    const html = `
       <div class="UniversalPopup ${status}">
         <div class="UniversalPopup__main">
           <div class="UniversalPopup__main_title">${title}</div>
           <div class="UniversalPopup__main_desc">${desc}</div>
           <div class="UniversalPopup__main_bar">
             <div class="UniversalPopup__main_process"></div>
           </div>
           <div class="UniversalPopup__main_btn">
             <button>${btnText}</button>
           </div>
           <div class="UniversalPopup__main_close">
            <svg id="win_icon_close" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
              <path id="路径_158819" data-name="路径 158819" d="M-8171.115,3374.287l11.474,11.131" transform="translate(8175.615 -3369.787)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/>
              <path id="路径_158820" data-name="路径 158820" d="M-8159.641,3374.287l-11.474,11.131" transform="translate(8175.615 -3369.787)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/>
              <rect id="矩形_5357" data-name="矩形 5357" width="20" height="20" fill="none"/>
            </svg>
           </div>
         </div>
       </div>
     `;
    document.body.insertAdjacentHTML("beforeend", html);
    const popupDom = this.qs(".UniversalPopup");
    const closeBtn = this.qs(".UniversalPopup__main_close", popupDom);
    const okBtn = this.qs(".UniversalPopup__main_btn button", popupDom);
    closeBtn.onclick = () => {
      popupDom.remove();
    };
    okBtn.onclick = () => {
      popupDom.remove();
    };
  },
});

// Other
myLibrary.fn.extend({
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
