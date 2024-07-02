const readline = require("readline");

const { authProxy } = require("./utils/mainUtils");

const { proxies } = require("./utils/fileUtils");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log("Начинаю поиск логинов паролей проксей");

  await proxies(authProxy, 0);

  console.log(
    "------------------------------------------------------------------------------------"
  );

  rl.question("Нажмите Enter, чтобы закрыть", () => {
    rl.close();

    process.exit(0);
  });
}

main();
