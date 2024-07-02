const axios = require("axios");
const { HttpProxyAgent } = require("http-proxy-agent");
const { chromium } = require("playwright");

const { mobilePass, mobileReboot } = require("../mobile/mobileUtils");

async function launchProxy(proxyStr) {
  const { username, password, ip, port, routerAddress } =
    parseProxyString(proxyStr);

  try {
    const browser = await chromium.launch({
      proxy: { server: `http://${ip}:${port}`, username, password },
      headless: false,
    });

    const context = await browser.newContext();

    // Open pages without errors
    async function safeNavigate(page, url) {
      try {
        await page.goto(url);
      } catch (e) {
        // Error caught, but not displayed
        // console.log(e);
      }
    }

    async function safeRouterNavigate() {
      try {
        await routerPage.goto(routerAddress, { waitUntil: "networkidle" });
      } catch (e) {
        // Error caught, but not displayed
        // console.log(e);
      }
    }

    const routerPage = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();
    const page4 = await context.newPage();
    await routerPage.bringToFront();

    safeNavigate(page2, "https://www.speedtest.net");
    safeNavigate(page3, "https://2ip.ru");
    safeNavigate(page4, "http://dev-null.su");
    await safeRouterNavigate();

    const finalUrl = await routerPage.url();

    if (finalUrl.includes("/index.html#/index")) {
      await mobilePass(routerPage);
    } else {
      await residentPass(routerPage);
    }
  } catch (e) {
    // Error caught, but not displayed
    // console.log(e);
  }
}

async function checkProxy(proxyStr) {
  const httpAgent = new HttpProxyAgent(`http://${proxyStr}`, {
    rejectUnauthorized: false,
  });

  const { routerAddress } = parseProxyString(proxyStr);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    "Cache-Control": "no-cache",
  };

  try {
    await Promise.all([
      axios.get("http://mail.ru", { headers, httpAgent, timeout: 5000 }),
    ]);

    try {
      await axios.get("http://dev-null.su/", {
        headers,
        httpAgent,
        timeout: 10000,
      });

      return `${proxyStr} - неоплачен`;
    } catch (e) {
      // Error caught, but not displayed
      // console.log(e);
    }

    return `${proxyStr} - работает`;
  } catch (e) {
    // Error caught, but not displayed
    // console.log(e);

    try {
      const res = await axios.get(routerAddress, {
        headers,
        httpAgent,
        timeout: 5000,
      });

      return `${proxyStr} - без интернета`;
    } catch (e) {
      // Error caught, but not displayed
      // console.log(e);
      return `${proxyStr} - НЕДОСТУПЕН`;
    }
  }
}

async function rebootProxy(proxyStr) {
  const { username, password, ip, port, routerAddress } =
    parseProxyString(proxyStr);

  try {
    const check = await checkProxy(proxyStr);

    if (check == `${proxyStr} - НЕДОСТУПЕН`) {
      return `${proxyStr} - НЕДОСТУПЕН`;
    }
  } catch (error) {
    return `${proxyStr} - ошибка`, error;
  }

  try {
    const browser = await chromium.launch({
      proxy: { server: `http://${ip}:${port}`, username, password },
      headless: true,
    });

    const context = await browser.newContext();

    const page = await context.newPage();

    const navigationPromise = page.waitForNavigation({
      waitUntil: "networkidle",
      timeout: 10000,
    });

    try {
      await page.goto(routerAddress, { timeout: 10000 });
      // added try-catch here, may not work sometimes, CHECK!!!!!!!!!!!
      try {
        await navigationPromise;
      } catch (e) {
        console.log(e);
      }
    } catch (error) {
      await browser.close();
      return `${proxyStr} - НЕДОСТУПЕН`;
    }

    try {
      const firstSelector = await Promise.race([
        page.waitForSelector("body > h4:nth-child(1)", { timeout: 5000 }),
        page.waitForSelector("body > h2:nth-child(1)", { timeout: 5000 }),
      ]);

      const text = await firstSelector.textContent();
      if (text === "401 Unauthorized" || text === "403 Access Denied") {
        await browser.close();
        return `${proxyStr} - нет доступа`;
      }
    } catch (error) {
      if (
        !/waiting for locator\('body > h[42]:nth-child\(1\)'\) to be visible/.test(
          error.message
        )
      ) {
        return `${proxyStr} - ошибка`;
      }
    }

    const finalUrl = page.url();

    if (finalUrl.includes("/cgi-bin/luci")) {
      try {
        await residentPass(page);
      } catch (error) {
        return `${proxyStr} - не удалось ввести пароль, резидент`;
      }

      await page.goto(`${routerAddress}/cgi-bin/luci/admin/system/reboot`);

      try {
        await page.waitForSelector(`.cbi-button`);
        await page.click(".cbi-button");
      } catch (error) {
        return `${proxyStr} - не удалось найти кнопку ребута`;
      }

      await page.waitForTimeout(500);
      await browser.close();
    } else if (finalUrl.includes("/index.html#/index")) {
      try {
        await mobilePass(page);
      } catch (error) {
        return `${proxyStr} - не удалось ввести пароль, мобильный роутер`;
      }

      try {
        await mobileReboot(page);
      } catch (error) {
        return `${proxyStr} - не удалось перезагрузить мобильный роутер`;
      }

      await page.waitForTimeout(500);

      await browser.close();
    } else {
      await browser.close();
      return `${proxyStr} - неопознанный интерфейс`;
    }

    return `${proxyStr} - перезагружен`;
  } catch (error) {
    return `${proxyStr} - ошибка, ${error}`;
  }
}

async function authProxy(proxyStr) {
  const { username, password, ip, port, routerAddress } =
    parseProxyString(proxyStr);

  try {
    const check = await checkProxy(proxyStr);

    if (check == `${proxyStr} - НЕДОСТУПЕН`) {
      return `${proxyStr} - НЕДОСТУПЕН`;
    }
  } catch (error) {
    return `${proxyStr} - ошибка`, error;
  }

  try {
    const browser = await chromium.launch({
      proxy: { server: `http://${ip}:${port}`, username, password },
      headless: true,
    });

    const context = await browser.newContext();

    const page = await context.newPage();

    const navigationPromise = page.waitForNavigation({
      waitUntil: "networkidle",
      timeout: 10000,
    });

    try {
      await page.goto(routerAddress, { timeout: 10000 });
      // added try-catch here, may not work sometimes, CHECK!!!!!!!!!!!
      try {
        await navigationPromise;
      } catch (e) {
        console.log(e);
      }
    } catch (error) {
      await browser.close();
      return `${proxyStr} - НЕДОСТУПЕН`;
    }

    const finalUrl = page.url();

    if (finalUrl.includes("/cgi-bin/luci")) {
      try {
        await residentPass(page);
      } catch (error) {
        return `${proxyStr} - не удалось ввести пароль, резидент`;
      }

      await page.goto(`${routerAddress}/cgi-bin/luci/admin/network/network`);

      try {
        await page.waitForSelector(
          `#cbi-network-wan > td.td.cbi-section-table-cell.nowrap.cbi-section-actions > div > button.cbi-button.cbi-button-edit`
        );
        await page.click(
          "#cbi-network-wan > td.td.cbi-section-table-cell.nowrap.cbi-section-actions > div > button.cbi-button.cbi-button-edit"
        );
      } catch (error) {
        return `${proxyStr} - не удалось найти кнопку edit`;
      }

      try {
        await page.click(
          'button.cbi-button.cbi-button-neutral[title="Reveal/hide password"]'
        );
      } catch (error) {
        return `${proxyStr} - не удалось найти кнопку раскрытия пароля, ${error}`;
      }

      try {
        await page.waitForTimeout(1000);

        // Дожидаемся появления элементов ввода
        await page.waitForSelector("#widget\\.cbid\\.network\\.wan\\.username");
        await page.waitForSelector("#widget\\.cbid\\.network\\.wan\\.password");

        // Извлечение значений из полей ввода
        const usernamee = await page.inputValue(
          "#widget\\.cbid\\.network\\.wan\\.username"
        );
        const passwordd = await page.inputValue(
          "#widget\\.cbid\\.network\\.wan\\.password"
        );

        await browser.close();
        return `${proxyStr} - ${usernamee}, ${passwordd}`;
      } catch (e) {
        await browser.close();
        return `${e}`;
      }
    } else {
      await browser.close();
      return `${proxyStr} - неопознанный интерфейс или не резидент`;
    }
  } catch (error) {
    return `${proxyStr} - ошибка, ${error}`;
  }
}

//Обработка строки прокси
function parseProxyString(proxyStr) {
  const [credentials, ipAndPort] = proxyStr.split("@");
  const [username, password] = credentials.split(":");
  const [ip, port] = ipAndPort.split(":");
  const router = port.slice(-2).replace(/^0/, "");
  const routerAddress = `http://192.168.${router}.1`;

  return { username, password, ip, port, routerAddress };
}

//Ввод пароля резидент роутера
async function residentPass(page) {
  const passwordSelectors = [
    "input[name='luci_password']",
    "input.cbi-input-text[name='luci_password']",
    "input#luci_password",
    "input.cbi-input-password[name='luci_password']",
    "input#password",
  ];

  const confirmButtonSelectors = [
    "button.btn.cbi-button-positive.important",
    "input[type='submit'].btn.cbi-button.cbi-button-apply",
    "input[type='submit'].cbi-button.cbi-button-reset",
    "a[onclick='dologin()']",
  ];

  const errorMessagesSelectors = [
    "div.alert-message.error",
    "div.alert-message.warning > p",
    "div.errorbox",
    "div#error",
  ];

  const passwords = ["admin"];

  async function findElement(selectors) {
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) return element;
    }
    return null;
  }

  for (const password of passwords) {
    const passwordInput = await findElement(passwordSelectors);
    if (!passwordInput) break;

    const confirmButton = await findElement(confirmButtonSelectors);
    if (!confirmButton) break;

    await passwordInput.fill("");
    await passwordInput.type(password);

    await confirmButton.click();

    try {
      await page.waitForTimeout(3000);

      const errorMessage = await findElement(errorMessagesSelectors);
      if (errorMessage) continue;
      break;
    } catch (error) {
      // console.log(error);
      break;
    }
  }
}

module.exports = {
  launchProxy,
  checkProxy,
  rebootProxy,
  authProxy,
  parseProxyString,
  residentPass,
};
