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
  // **************** 配置 *******************
  const httpsTemp = (str) => `https://${str}/`;
  const curLan = "en";
  const prefix = curLan === "en" ? "www" : curLan;
  const isProduction = location.host.includes(`${prefix}.vidnoz.com`)
    ? true
    : false;
  const headers = {
    "Content-Type": "application/json",
    "X-TASK-VERSION": window?.XTASKVERSION || "2.0.0",
    "Request-Language": curLan,
  };
  const baseApiDomain = isProduction
    ? "tool-api.vidnoz.com"
    : "tool-api-test.vidnoz.com";
  const baseApiDomainOld = isProduction
    ? "api.vidnoz.com"
    : "api-test.vidnoz.com";
  const suffix = curLan === "en" ? "" : `-${curLan}`;
  let mSuffix = ["en", "ar", "tw", "kr"].includes(curLan);
  mSuffix = mSuffix ? "" : `-${curLan}`;
  const pcAppDomain = isProduction
    ? `aiapp${suffix}.vidnoz.com`
    : "ai-test.vidnoz.com";
  const mAppDomain = isProduction
    ? `m${mSuffix}.vidnoz.com`
    : "m-test-f700c64e.vidnoz.com";
  const ApiUrl = {
    "add-task": "ai/ai-tool/add-task",
    "get-task": "ai/tool/get-task",
    "get-access-url": "ai/source/get-access-url",
    "temp-upload-url": "ai/source/temp-upload-url",
    "can-task": "ai/tool/can-task",
    "get-upload-url": "ai/source/get-upload-url",
  };
  // **************** 配置 *******************
  myLibrary.fn = myLibrary.prototype = {
    constructor: myLibrary,
    isProduction,
    headers,
    baseApi: httpsTemp(baseApiDomain),
    baseApiOld: httpsTemp(baseApiDomainOld),
    pcAppDomain: httpsTemp(pcAppDomain),
    mAppDomain: httpsTemp(mAppDomain),
    httpsTemp,
    ApiUrl,
    init: function (selector) {
      this.elements = selector ? document.querySelectorAll(selector) : [];
      return this;
    },
    each: function (callback) {
      this.elements.forEach(callback);
      return this;
    },
    extend: function (obj) {
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          myLibrary.fn[key] = obj[key];
        }
      }
      return this;
    },
  };
  myLibrary.fn.init.prototype = myLibrary.fn;
  window.$$ = window.myLibrary = myLibrary;
  return myLibrary;
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
      const res = await this.post(
        `${this.baseApi}${this.ApiUrl["add-task"]}`,
        params
      );
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  getTask: async function (params = {}) {
    try {
      const res = await this.post(
        `${this.baseApi}${this.ApiUrl["get-task"]}`,
        params
      );
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  loop: async function (addTData = {}, callback = () => {}) {
    async function getTaskLoop(taskId, cb = () => {}) {
      let time = 0;
      while (true) {
        try {
          const res = await this.getTask({
            id: taskId,
          });
          const status = res?.data?.status;
          if (status === 0) {
            await cb?.(res);
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
    }
    try {
      const res = await this.addTask(addTData);
      const code = res?.code;
      const taskId = res?.data?.task_id;
      if (code === 200 && taskId) {
        try {
          const data = await getTaskLoop(taskId, callback);
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
        `${this.baseApi}${this.ApiUrl["get-access-url"]}`,
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
        `${this.baseApi}${this.ApiUrl["temp-upload-url"]}`,
        params
      );
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  getUploadUrl: async function (params = {}) {
    try {
      const res = await this.post(
        `${this.baseApiOld}${this.ApiUrl["get-upload-url"]}`,
        params
      );
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  canTask: async function (params = {}) {
    try {
      const res = await this.post(
        `${this.baseApi}${this.ApiUrl["get-task"]}`,
        params
      );
      return Promise.resolve(res);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  uploadAssets: async function ({ fileName = "", file, permanent = false }) {
    const readText = (blob) => {
      return new Promise((resolve) => {
        const blobReader = new FileReader();
        blobReader.onload = function () {
          resolve(true);
        };
        blobReader.onerror = function (error) {
          resolve(false);
        };
        blobReader.readAsArrayBuffer(blob);
      });
    };
    try {
      const res = await this[permanent ? "getUploadUrl" : "tempUploadUrl"]({
        file_name: fileName || `default.${file.type}`,
      });
      const code = res?.code;
      const uploadUrl = res?.data?.upload_url;
      const key = res?.data?.key;
      if (code === 200 && uploadUrl) {
        const blob = new Blob([file], { type: file.type });
        const result = await readText(blob);
        if (!result) {
          return Promise.resolve({
            code: 404,
            message: "no such file",
          });
        }
        const putRes = await this.put(uploadUrl, blob);
        if (putRes === 200) {
          return Promise.resolve({
            code: 200,
            key,
          });
        } else {
          return Promise.reject();
        }
      } else {
        return Promise.reject();
      }
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
    const isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
    const isiOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isAndroid) {
      return "android";
    } else if (isiOS) {
      return "ios";
    }
  },
});

// Other
myLibrary.fn.extend({
  // 复制文本到剪切板 - 兼容版
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
  // 监听文件上传
  watchFileUpload: function (fileInput, callback) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        callback(file);
      }
    });
  },
  // 资源下载
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
  // 获取元素类型
  getType: function (obj) {
    var _toString = Object.prototype.toString;
    var _type = {
      undefined: "undefined",
      number: "number",
      boolean: "boolean",
      string: "string",
      "[object Function]": "function",
      "[object RegExp]": "regexp",
      "[object Array]": "array",
      "[object Date]": "date",
      "[object Error]": "error",
      // ... 这里可以继续扩展
    };
    return (
      _type[typeof obj] ||
      _type[_toString.call(obj)] ||
      (obj ? "object" : "null")
    );
  },
  // 检测元素之外的点击
  checkClickOutside: function (ele, evt) {
    const isClickedOutside = !ele.contains(evt.target);
    return isClickedOutside;
  },
  // 一次性的事件监听
  onceListen: function (eventName, handler) {
    ele.addEventListener(eventName, handler, { once: true });
  },
  // 生成 uuid
  uuid: function (a) {
    return a
      ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
      : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, this.uuid);
  },
  // 解析 URL 参数
  getSearchParams: function () {
    const searchPar = new URLSearchParams(window.location.search);
    const paramsObj = {};
    for (const [key, value] of searchPar.entries()) {
      paramsObj[key] = value;
    }
    return paramsObj;
  },
  // 平滑滚动到页面顶部
  scrollToTop: function () {
    const c = document.documentElement.scrollTop || document.body.scrollTop;
    if (c > 0) {
      window.requestAnimationFrame(() => this.scrollToTop());
      window.scrollTo(0, c - c / 8);
    }
  },
  // 滚动到元素位置
  smoothScroll: function (element) {
    document.querySelector(element).scrollIntoView({
      behavior: "smooth",
    });
  },
  // 获取当前页面滚动距离
  getScrollPosition: (el = window) => ({
    x: el.scrollLeft || (el.pageXOffset !== undefined ? el.pageXOffset : 0),
    y: el.scrollTop || (el.pageYOffset !== undefined ? el.pageYOffset : 0),
  }),
  // 进入全屏
  fullScreen: function () {
    let el = document.documentElement;
    let rfs =
      el.requestFullScreen ||
      el.webkitRequestFullScreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullScreen;
    if (rfs) {
      rfs.call(el);
    } else if (typeof window.ActiveXObject !== "undefined") {
      let wscript = new ActiveXObject("WScript.Shell");
      if (wscript != null) {
        wscript.SendKeys("{F11}");
      }
    }
  },
  // 退出全屏
  exitScreen: function () {
    let el = document;
    let cfs =
      el.cancelFullScreen ||
      el.webkitCancelFullScreen ||
      el.mozCancelFullScreen ||
      el.exitFullScreen;
    if (cfs) {
      cfs.call(el);
    } else if (typeof window.ActiveXObject !== "undefined") {
      let wscript = new ActiveXObject("WScript.Shell");
      if (wscript != null) {
        wscript.SendKeys("{F11}");
      }
    }
  },
  // 将二进制图片格式数据展示在页面中
  showBinaryImg: function (url = "") {
    this.get(url)
      .then(async (res) => {
        return await res.arrayBuffer();
      })
      .then((res1) => {
        const blob = new Blob([res1]);
        const blobUrl = URL.createObjectURL(blob);
        return blobUrl;
      });
  },
  // 即使页面关闭了，继续请求 01
  continueRequestOnUnload1: function (url = "", data = {}) {
    fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      keepalive: true,
    });
  },
  // 即使页面关闭了，继续请求 02
  continueRequestOnUnload2: function (url = "", data = {}) {
    navigator.sendBeacon(url, JSON.stringify(data));
  },
  // 颜色转换 hex -> rgb
  hexToRGB: function (hex) {
    var hexx = hex.replace("#", "0x");
    var r = hexx >> 16;
    var g = (hexx >> 8) & 0xff;
    var b = hexx & 0xff;
    return `rgb(${r}, ${g}, ${b})`;
  },
  // 颜色转换 rgb -> hex
  RGBToHex: function (rgb) {
    var rgbArr = rgb.split(/[^\d]+/);
    var color = (rgbArr[1] << 16) | (rgbArr[2] << 8) | rgbArr[3];
    return "#" + color.toString(16);
  },
  // FLIP 动画封装函数
  flipAnimate: function (element, duration = 500) {
    const first = {
      rect: element.getBoundingClientRect(),
      opacity: window.getComputedStyle(element).opacity,
    };
    element.style.transform = `translate(${first.rect.left}px, ${first.rect.top}px)`;
    element.style.opacity = 0;
    void element.offsetWidth;
    const last = {
      rect: element.getBoundingClientRect(),
      opacity: window.getComputedStyle(element).opacity,
    };
    const deltaX = first.rect.left - last.rect.left;
    const deltaY = first.rect.top - last.rect.top;
    element.style.transform = `translate(0, 0)`;
    element.style.opacity = 1;
    element.animate(
      [
        { transform: `translate(${deltaX}px, ${deltaY}px)`, opacity: 0 },
        { transform: "translate(0, 0)", opacity: 1 },
      ],
      {
        duration: duration,
        easing: "ease-in-out",
      }
    );
  },
});
