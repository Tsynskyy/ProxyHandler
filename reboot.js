const readline = require("readline");

const { rebootProxy, checkProxy } = require("./utils/mainUtils");

const {
  removeEmptyLines,
  checkFile,
  proxies,
  list,
  listResult,
} = require("./utils/fileUtils");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  removeEmptyLines(list);

  if (!checkFile(list)) {
    console.log(`Файл ${list} пуст или ${listResult} не существует`);
    rl.close();
    return;
  }

  console.log("Начинаю перезагрузку проксей");

  await proxies(rebootProxy, 0);

  console.log(
    "------------------------------------------------------------------------------------"
  );

  await new Promise((res) => setTimeout(res, 5000));

  await proxies(checkProxy, 0);

  console.log(
    "------------------------------------------------------------------------------------"
  );

  rl.question("Нажмите Enter, чтобы закрыть", () => {
    rl.close();

    process.exit(0);
  });
}

main();
