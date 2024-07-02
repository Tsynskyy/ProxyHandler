const readline = require("readline");

const { launchProxy } = require("./utils/mainUtils");

const { findProxyLine } = require("./utils/fileUtils");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(function askForProxy() {
  rl.question("Введите IP и порт прокси (или полный строку): ", (input) => {
    const fullProxy =
      input.includes("@") &&
      input.split("@").length === 2 &&
      input.split(":").length === 3 &&
      input.split(":")[2].length === 4 &&
      input.split(".").length === 4;

    // Проверка соответствия введеной строки формату полной строки прокси
    const proxyStr = fullProxy ? input : findProxyLine(input);

    if (proxyStr) {
      try {
        launchProxy(proxyStr);
      } catch (e) {
        // Ошибка поймана, но без вывода
      }

      askForProxy();
    } else {
      console.log("Строка прокси не найдена или неверна");
      askForProxy();
    }
  });
})();
