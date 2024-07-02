const fs = require("fs");

const config = require("./config");

const Proxies = config.Proxies;
const list = config.list;
const listResult = config.listResult;

// Проверка наличия и пустоты файла
function checkFile(file) {
  try {
    if (!fs.existsSync(file)) {
      console.log(`Файл ${file} не найден.`);
      return false;
    }

    const fileContent = fs.readFileSync(file, "utf-8").trim();
    if (fileContent.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Произошла ошибка при чтении файла: ${error.message}`);
    return false;
  }
}

// Удаление пустых строк в файле
function removeEmptyLines(file) {
  try {
    const fileContent = fs.readFileSync(file, "utf-8");

    const filteredContent = fileContent
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join("\n");

    fs.writeFileSync(file, filteredContent);
  } catch (error) {
    console.error(`Ошибка при обработке файла: ${error.message}`);
  }
}

// Нахождение прокси-строки в файле Proxies
function findProxyLine(input) {
  if (!checkFile(Proxies)) {
    return;
  }

  const regex = /(\d+\.\d+\.\d+\.\d+:\d+)/;
  const match = input.match(regex);

  if (match) {
    const proxyData = fs.readFileSync(Proxies, "utf8");
    const lines = proxyData.split("\n");

    for (let line of lines) {
      if (line.includes(match[0])) {
        return line.trim();
      }
    }
  }

  return null;
}

// Нахождение прокси-списка в файле Proxies
function findProxyLines(username) {
  if (!checkFile(Proxies)) {
    return;
  }

  const data = fs.readFileSync(Proxies, "utf8");
  const lines = data.split("\n");

  const filteredProxies = lines.filter((line) => {
    const [userPart] = line.split("@");
    const [user] = userPart.split(":");
    return user === username;
  });

  return filteredProxies;
}

// Возвращение списка прокси
function readProxiesFromFile(file) {
  const fileContent = fs.readFileSync(file, "utf-8");

  return fileContent
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

function writeResultsToFile(results, file) {
  const joinedResults = results.join("\n");
  fs.writeFileSync(file, joinedResults, { flag: "w" });
}

function filterProxies(listResultPath, listPath, filter) {
  const results = fs
    .readFileSync(listResultPath, "utf-8")
    .split("\n")
    .map((line) => line.trim());

  const filteredProxies = results
    .filter((line) => line.includes(filter))
    .map((line) => line.split(" ")[0]);

  let proxies = fs
    .readFileSync(listPath, "utf-8")
    .split("\n")
    .map((line) => line.trim());

  proxies = proxies.filter((proxy) => !filteredProxies.includes(proxy));

  fs.writeFileSync(listPath, proxies.join("\n"));
}

async function proxies(actionFunction, filterFlag) {
  try {
    const proxies_list = readProxiesFromFile(list);
    const proxyPromises = proxies_list.map((proxyStr) =>
      actionFunction(proxyStr)
    );
    const results = await Promise.all(proxyPromises);

    results.forEach((logMessage) => {
      console.log(logMessage.trim());
    });

    writeResultsToFile(results, listResult);

    if (filterFlag === 1) {
      filterProxies(listResult, list, "работает");
    }
  } catch (error) {
    console.error("Произошла ошибка:", error);
  }
}

module.exports = {
  checkFile,
  removeEmptyLines,
  findProxyLine,
  findProxyLines,
  readProxiesFromFile,
  writeResultsToFile,
  filterProxies,
  proxies,
  list,
  listResult,
};
