import json
import subprocess
import requests
import shlex
import time, os


SERVER_IP = os.getenv('SERVER_IP')  # EC2 instance IP of database/server
SERVER_PORT = os.getenv('SERVER_PORT', '3000')
AUTH_TOKEN = os.getenv('AUTH_TOKEN')


def run_curl_command(curl_command):
  args = shlex.split(curl_command)

  result = subprocess.run(args, capture_output=True, text=True)
  return result


def run_test(test):
  curl_command = test['test']['command']
  expected_status = test['test']['response']['status']
  expected_body = test['test']['response']['body']

  curl_result = run_curl_command(curl_command)

  if curl_result.returncode != 0:
    return {"success": False, "reason": f"Error executing test '{test['name']}': {curl_result.stderr}"}

  try:
    response_body = json.loads(curl_result.stdout)
  except json.JSONDecodeError:
    return {"success": False, "reason": f"Invalid JSON response in test '{test['name']}'"}

  if curl_result.returncode != expected_status:
    return {"success": False, "reason": f"Test '{test['name']}' failed: Expected status {expected_status}, got {curl_result.returncode}"}

  if response_body != expected_body:
    return {"success": False, "reason": f"Test '{test['name']}' failed: Expected body {expected_body}, got {response_body}"}

  return {"success": True, "reason": f"Test '{test['name']}' Passed"}


def run_tests(tests):
  results = {"passed": 0, "failed": 0, "total": len(tests), "results": []}

  for test in tests:
    test_result = run_test(test)
    results["results"].append({
        "name": test["name"],
        "result": test_result
    })
    if test_result:
      results["passed"] += 1
    else:
      results["failed"] += 1
      
  return results


def upload_results(student_id, results):
  url = f"http://{SERVER_IP}:{SERVER_PORT}/upload-results?student_id={student_id}"
  headers = {'Content-Type': 'application/json'}
  response = requests.post(url, json=results, headers=headers)
  return response


def check_database_health():
  url = f"http://{SERVER_IP}:{SERVER_PORT}/"
  try:
    response = requests.get(url)
    return response.status_code == 200
  except requests.RequestException:
    return False


def get_student_id():
  with open('/autograder/submission_metadata.json', 'r') as file:
    metadata = json.load(file)
    return metadata['users'][0]['id']
  

def upload_tests(student_id, tests):
  url = f"http://{SERVER_IP}:{SERVER_PORT}/submit-tests?student_id={student_id}"
  headers = {'Content-Type': 'application/json'}
  response = requests.post(url, json=tests, headers=headers)
  return response


def start_server(server_path):
  process = subprocess.Popen(["node", "index.js"], cwd=server_path)
  time.sleep(5)
  return process


def stop_server(process):
  process.terminate()
  process.wait()


def write_output(data):
  with open('/autograder/results/results.json', 'w') as file:
    json.dump(data, file)


def main():
  sample_server = start_server("/autograder/source/sample-server")

  with open('tests.json', 'r') as file:
    tests = json.load(file)

  sample_results = run_tests(tests)
  stop_server(sample_server)
  if sample_results["total"] != sample_results["passed"]:
    # TODO: give different feedback message with description of failed tests
    write_output({"error": "Test cases did not pass sample implementation. If you believe this to be an error, please contact the administrator."})
    return
  

  if not check_database_health():
    # TODO: give different feedback message with description of passed tests (from above), as well as error
    write_output({"error": "Server is not running or not healthy. Contact the assignment administrators."})
    return

  student_id = get_student_id()

  # Upload tests to the database, get response of all tests
  response = upload_tests(student_id, tests)
  if response.status_code != 200:
    # TODO: give different feedback message with description of passed tests (from above), as well as error
    write_output({"error": "Error uploading tests to the database."})
    return
  all_tests = response.json()

  student_server = start_server("/autograder/submission")

  all_results = run_tests(all_tests)
  stop_server(student_server)
  if all_results["total"] != all_results["passed"]:
    # TODO: give detailed feedback message with description of failed/passed tests
    write_output({"error": "All test cases did not pass."})
    return
  
  # TODO: Upload results to the database
  # upload_response = upload_results(student_id, {"success": "All tests passed"})
  # if upload_response.status_code != 200:
  #   results = {"error": "Error uploading results to the database"}
  #   with open('/autograder/results/results.json', 'w') as file:
  #       json.dump(results, file)
  #   return

if __name__ == "__main__":
  main()
