from config import config
import os
import speedtest
import sys

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
utils_path = os.path.join(parent_dir, 'utils')
sys.path.append(utils_path)


list_path = config['list']
RESULT_path = config['RESULT']


def set_proxy_environment(proxy_string):
    auth, rest = proxy_string.split('@')
    user, password = auth.split(':')
    host, port = rest.split(':')
    proxy_url = f"http://{user}:{password}@{host}:{port}"
    os.environ['http_proxy'] = proxy_url
    os.environ['https_proxy'] = proxy_url
    return user, port


def test_speed_and_ping():
    st = speedtest.Speedtest()
    best_server = st.get_best_server()  # Выбор лучшего сервера
    ping = best_server['latency']  # Пинг
    download_speed = st.download() / 1_000_000  # бит/с в Мбит/с
    upload_speed = st.upload() / 1_000_000
    return download_speed, upload_speed, ping


def read_proxy_list(file):
    with open(file, 'r') as file:
        proxies = [line.strip() for line in file if line.strip()]
    return proxies


def write_results_to_file(file, user, port, download=None, upload=None, ping=None, error=None):
    if error:
        file.write(f"{user} {port}: Ошибка при измерении - {error}\n")
    else:
        file.write(f"{user} {port}: Скорость загрузки: {
                   download:.2f} Мбит/с, Скорость отдачи: {upload:.2f} Мбит/с, Пинг: {ping:.2f} мс\n")


def main():
    proxy_list = read_proxy_list(list_path)
    print(f"Файл {list_path} прочитан")

    with open(RESULT_path, "w") as result_file:
        print("Измерение скорости и пинга запущено")
        for proxy in proxy_list:
            user, port = set_proxy_environment(proxy)

            try:
                download, upload, ping = test_speed_and_ping()
                print(f"{user} {port}: Скорость загрузки: {
                      download:.2f} Мбит/с, Скорость отдачи: {upload:.2f} Мбит/с, Пинг: {ping:.2f} мс")
                write_results_to_file(
                    result_file, user, port, download, upload, ping)
            except Exception as e:
                print(f"{user} {port}: {str(e)}")
                write_results_to_file(result_file, user, port, error=str(e))

            os.environ['http_proxy'] = ''
            os.environ['https_proxy'] = ''


if __name__ == "__main__":
    main()
