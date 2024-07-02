// This script checks if a list of proxies is working.
// It uses the checkProxy function, which takes a proxy line in the format username:password @IP:port and checks the connection to certain sites using httpAgent and axios.

const fs = require("fs");
const readline = require("readline");

const { checkProxy } = require("./utils/mainUtils");
const {
  checkFile,
  removeEmptyLines,
  proxies,
  findProxyLines,
  list,
  listResult,
} = require("./utils/fileUtils");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  let repeatCheck = true;
  removeEmptyLines(list);

  if (!fs.existsSync(listResult)) {
    console.log(`Файл ${listResult} не существует`);
    rl.close();
    return;
  }

  while (repeatCheck) {
    await new Promise((resolve) => {
      rl.question(
        "Введите количество проверок (или имя пользователя и количество проверок): ",
        async (answer) => {
          const inputs = answer.split(" ");
          let repeatTimes;
          let username;

          if (inputs.length === 1) {
            repeatTimes = parseInt(inputs[0]);
          } else if (inputs.length === 2) {
            username = inputs[0];
            repeatTimes = parseInt(inputs[1]);
          } else {
            console.log("Неверный ввод. Попробуйте снова.");
            resolve();
            return;
          }

          if (!isNaN(repeatTimes) && repeatTimes > 0) {
            if (username) {
              const proxyLines = findProxyLines(username);
              if (proxyLines.length > 0) {
                fs.writeFileSync(list, proxyLines.join("\n"));
                console.log(`Добавлены прокси для пользователя ${username}`);
              } else {
                console.log(`Не найдены прокси для пользователя ${username}`);
                resolve();
                return;
              }
            }

            let i = 0;
            while (
              i < repeatTimes &&
              checkFile(list) &&
              fs.existsSync(listResult)
            ) {
              console.log(`Проверка #${i + 1} из ${repeatTimes}`);
              await proxies(checkProxy, 1);
              console.log(
                "------------------------------------------------------------------------------------"
              );

              i++;
            }

            if (!checkFile(list)) {
              console.log(`Все прокси работают (добавьте новые в файл)`);
              console.log(
                "------------------------------------------------------------------------------------"
              );
            } else {
              console.log(`Проверка завершена`);
              console.log(
                "------------------------------------------------------------------------------------"
              );
            }
            resolve();
          } else {
            console.log("Неверный ввод. Попробуйте снова.");
            resolve();
          }
        }
      );
    });
  }
}

main();
