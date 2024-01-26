import json
import subprocess
import requests
import shlex
import time, os
import re


SERVER_IP = os.getenv('SERVER_IP') # EC2 instance IP of database/server
SERVER_PORT = os.getenv('SERVER_PORT', '3000')
SERVER_URI = f"http://{SERVER_IP}:{SERVER_PORT}"
AUTH_TOKEN = os.getenv('AUTH_TOKEN')


def load_config():
  global num_public_tests_for_access
  with open('config.json', 'r') as file:
    config = json.load(file)
    num_public_tests_for_access = config['numPublicTestsForAccess']


def run_curl_command(curl_command):
  modified_curl_command = curl_command + ' -w "\\n%{http_code}"'
  args = shlex.split(modified_curl_command)

  result = subprocess.run(args, capture_output=True, text=True)

  output_parts = result.stdout.strip().split('\n')
  response_body = '\n'.join(output_parts[:-1])
  response_code = int(output_parts[-1])

  return result.returncode, result.stdout, result.stderr, response_code, response_body


def run_junit_test(junit_path, test_class, classpath):
  """
  Runs a JUnit test and captures the result.

  :param junit_path: Path to junit.jar.
  :param test_class: Fully qualified name of the test class to run.
  :param classpath: Classpath including the project classes and JUnit.
  :return: A dictionary with the test results.
  """
  # Construct the Java command
  command = [
    'java',
    '-cp',
    f"{junit_path}:{classpath}", # For Windows, use ';' instead of ':'
    'org.junit.runner.JUnitCore',
    test_class
  ]
  # java -cp .:/usr/share/java/junit.jar org.junit.runner.JUnitCore [test class name]
  
  result = subprocess.run(command, capture_output=True, text=True)
  
  output = result.stdout + result.stderr
  if result.returncode != 0:
    return {'success': False, 'output': output}
  return parse_junit_output(output)

def parse_junit_output(output):
  """
  Parses the console output from a JUnit test run to extract results.

  :param output: Console output as a string.
  :return: A dictionary with parsed test results.
  """
  test_results = {
    'success': False,
    'run': 0,
    'failures': [],
    'errors': []
  }

  # Basic parsing logic - customize as needed based on your output
  if "FAILURES!!!" in output:
    test_results['success'] = False
    failure_matches = re.findall(r"test(.*)\((.*)\)", output)
    for match in failure_matches:
      test_results['failures'].append({'test': match[0].strip(), 'class': match[1]})
  else:
    test_results['success'] = True
  
  run_matches = re.search(r"Tests run: (\d+),", output)
  if run_matches:
    test_results['run'] = int(run_matches.group(1))
  
  # Errors parsing can be added similarly
  
  return test_results


def run_test(test):
  curl_command = test['test']['command']
  expected_status = test['test']['response']['status']
  expected_body = test['test']['response']['body']

  returncode, _, stderr, response_code, response_body = run_curl_command(curl_command)

  if returncode != 0:
    return {"success": False, "reason": f"Error executing test '{test['name']}':\n{stderr}"}

  if response_code != expected_status:
    return {"success": False, "reason": f"Test '{test['name']}' failed: Expected status {expected_status}, got {response_code}"}

  if response_body != expected_body:
    return {"success": False, "reason": f"Test '{test['name']}' failed: Expected body {expected_body}, got {response_body}"}

  return {"success": True, "reason": f"Test '{test['name']}' Passed"}


def run_tests(tests):
  results = {"passed": 0, "failed": 0, "total": len(tests), "results": []}

  for test in tests:
    test_result = run_test(test)
    results["results"].append({
        "name": test["name"],
        "result": test_result,
        "test": test
    })
    if test_result["success"]:
      results["passed"] += 1
    else:
      results["failed"] += 1
      
  return results


def check_database_health():
  url = f"{SERVER_URI}/"
  headers = {'Authorization': AUTH_TOKEN}
  try:
    response = requests.get(url, headers=headers)
    return response.status_code == 200
  except requests.RequestException:
    return False


def get_student_id():
  with open('/autograder/submission_metadata.json', 'r') as file:
    metadata = json.load(file)
    return metadata['users'][0]['id']


def get_assignment_title():
  with open('/autograder/submission_metadata.json', 'r') as file:
    metadata = json.load(file)
    title = metadata['assignment']['title']
    safe_title = re.sub(r'\s+', '_', title)
    safe_title = re.sub(r'[^\w-]', '', safe_title)
    return safe_title


def upload_tests(assignment_title, student_id, tests, params):
  url = f"{SERVER_URI}/submit-tests/{assignment_title}?student_id={student_id}"
  headers = {'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN}
  response = requests.post(url, params=params, json=tests, headers=headers)
  return response


def upload_results(assignment_title, student_id, results):
  url = f"{SERVER_URI}/submit-results/{assignment_title}?student_id={student_id}"
  headers = {'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN}
  response = requests.post(url, json=results, headers=headers)
  return response


def start_server(server_path, npm_install=False):
  if npm_install:
    subprocess.run(["npm", "install"], cwd=server_path)
  process = subprocess.Popen(["node", "index.js"], cwd=server_path)
  time.sleep(5)
  return process


def stop_server(process):
  process.terminate()
  process.wait()


def write_output(data):
  if len(data["tests"]) == 0:
    data["score"] = 0
  with open('/autograder/results/results.json', 'w') as file:
    json.dump(data, file)


def main():
  load_config()
  
  # Read tests
  try:
    with open('default-tests.json', 'r') as file:
        tests = json.load(file)
  except:
    tests = []
  
  output_str = ""
  if len(tests) > 0:
    # Run tests on sample server
    sample_server = start_server("/autograder/source/sample-server")
    sample_results = run_tests(tests)
    stop_server(sample_server)

    successful_tests = [result["test"] for result in sample_results["results"] if result["result"]["success"]]
  else:
    successful_tests = []

  # Ensure database is running
  if not check_database_health():
    # write_output({"output": "Server is not running or not healthy. Please contact the assignment administrators. In the meantime, here are the outcomes of running your tests on THE SAMPLE SOLUTION.\n" + output_str, "tests": feedback})
    return
  assignment_title = get_assignment_title()

  # Upload tests to the database, get response of all tests
  response = upload_tests(assignment_title, -1, successful_tests, {"num_public_tests": num_public_tests_for_access})
  json_response = response.json()
  if response.status_code < 200 or response.status_code >= 300 or not json_response['success']:
    # write_output({"output": "Error uploading tests to the database. Please contact the assignment administrators. In the meantime, here are the outcomes of running your tests on THE SAMPLE SOLUTION.\n" + output_str, "tests": feedback})
    return
  # if len(json_response['failedToAdd']) > 0:
  #   output_str += "Failed to upload all tests to the database. Make sure test names are unique if you want them to be counted seperately! Please see the following reasons:\n\n"
  #   for failure in json_response['failedToAdd']:
  #     output_str += failure['name'] + ": \t" + failure['reason'] + "\n"
  #   output_str += "\n"
  # elif len(successful_tests) > 0:
  #   output_str += "All tests successfully uploaded to the database!\n"
  # all_tests = response.json()['tests']

if __name__ == "__main__":
  main()
