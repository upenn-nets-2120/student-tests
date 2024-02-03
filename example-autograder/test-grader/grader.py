import json
import subprocess
import requests
import shlex
import time, os, sys
import re
import base64
import xml.etree.ElementTree as ET


SERVER_IP = os.getenv('SERVER_IP') # EC2 instance IP of database/server
SERVER_PORT = os.getenv('SERVER_PORT', '3000')
SERVER_URI = f"http://{SERVER_IP}:{SERVER_PORT}"
AUTH_TOKEN = os.getenv('AUTH_TOKEN')


def load_config():
  global config
  with open('/autograder/source/test-grader/config.json', 'r') as file:
    config = json.load(file)
    required_config_vars = ['numPublicTestsForAccess', 'maxTestsPerStudent', 'maxNumReturnedTests', 'weightReturnedTests', 'pomPath', 'jUnitTestLocation']
    for var in required_config_vars:
      assert var in config, f"Missing config variable: '{var}'"


def compare_json(json1, json2, any_order):
  if not any_order:
    return json1 == json2
  if type(json1) != type(json2):
    return False
  if isinstance(json1, dict):
    if json1.keys() != json2.keys():
      return False
    return all(compare_json(json1[key], json2[key], any_order) for key in json1)
  if isinstance(json1, list):
    if any_order:
      return all(any(compare_json(item1, item2, any_order) for item2 in json2) for item1 in json1) and all(any(compare_json(item2, item1, any_order) for item1 in json1) for item2 in json2)
    return all(compare_json(item1, item2, any_order) for item1, item2 in zip(json1, json2))
  return json1 == json2


def run_curl_command(curl_command):
  modified_curl_command = curl_command + ' -w "\\n%{http_code}"'
  args = shlex.split(modified_curl_command)

  result = subprocess.run(args, capture_output=True, text=True)

  output_parts = result.stdout.strip().split('\n')
  response_body = '\n'.join(output_parts[:-1])
  response_code = int(output_parts[-1])

  return result.returncode, result.stdout, result.stderr, response_code, response_body


def run_curl_test(test):
  curl_command = test['test']['command']
  response_type = test['test']['response-type']
  expected_status = test['test']['response']['status']

  returncode, _, stderr, response_code, response_body = run_curl_command(curl_command)

  if returncode != 0:
    return {"success": False, "reason": f"Error executing test '{test['name']}':\n{stderr}"}

  if response_code != expected_status:
    return {"success": False, "reason": f"Test '{test['name']}' failed: Expected status {expected_status}, got {response_code}"}
  
  if response_type == "json":
    try:
      response_json = json.loads(response_body)
    except json.JSONDecodeError:
      return {"success": False, "reason": f"Test '{test['name']}' failed: Response body is not valid JSON"}
    expected_json = test['test']['response']['json']
    any_order = test['test']['any-order'] if 'any-order' in test['test'] else False
    if not compare_json(response_json, expected_json, any_order):
      return {"success": False, "reason": f"Test '{test['name']}' failed: Expected body {expected_json}, got {response_json}"}
  elif response_type == "text":
    expected_body = test['test']['response']['body']
    if response_body != expected_body:
      return {"success": False, "reason": f"Test '{test['name']}' failed: Expected body {expected_body}, got {response_body}"}

  return {"success": True, "reason": f"Test '{test['name']}' Passed"}


def run_junit_tests(test, setup):
  base = "/autograder/source" if setup else "/autograder/submission"
  raw_tests = base64.b64decode(test["content"])
  test_file_path = os.path.join(base, config["jUnitTestLocation"], f"{test['name']}.java")
  pom_file_path = os.path.join(base, config["pomPath"])
  # fix path
  report_path = os.path.join(base, "sample-server", "target/surefire-reports", f"TEST-nets2120.{test['name']}.xml")
  with open(test_file_path, 'wb') as file:
    file.write(raw_tests)
  subprocess.run(["mvn", "test", "-f", pom_file_path])

  if not os.path.exists(report_path):
    return [{"name": test['name'], "success": False, "reason": "Test report not found"}]

  tree = ET.parse(report_path)
  root = tree.getroot()
  test_results = []

  for testcase in root.iter('testcase'):
    test_name = testcase.get('name')
    classname = testcase.get('classname')
    full_test_name = f"{classname}.{test_name}"
    error = testcase.find('error')
    failure = testcase.find('failure')
    if error is not None or failure is not None:
      reason = error.text if error is not None else failure.text
      test_results.append({"name": full_test_name, "success": False, "reason": f"Test '{full_test_name}' Failed: {reason}"})
    else:
      test_results.append({"name": full_test_name, "success": True, "reason": f"Test '{full_test_name}' Passed"})

  return test_results


def run_test(test, setup):
  if test["type"] == "curl":
    return run_curl_test(test)
  elif test["type"] == "junit":
    return run_junit_tests(test, setup)
  else:
    return {"success": False, "reason": f"Unknown test type '{test['type']}'"}


def run_tests(tests, setup=False):
  results = {"passed": 0, "failed": 0, "results": []}

  for test in tests:
    test_result = run_test(test, setup)
    if test["type"] == "curl":
      results["results"].append({
        "name": test["name"],
        "result": test_result,
        "test": test
      })
      if test_result["success"]:
        results["passed"] += 1
      else:
        results["failed"] += 1
    elif test["type"] == "junit":
      for t in test_result:
        results["results"].append({
          "name": t["name"],
          "result": t,
          "test": test
        })
        if t["success"]:
          results["passed"] += 1
        else:
          results["failed"] += 1 

  results["total"] = len(results["results"])
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
    return metadata['users'][0]['email']


def get_assignment_title():
  def clean_title(title):
    safe_title = re.sub(r'\s+', '_', title.lower().strip())
    return re.sub(r'[^\w-]', '', safe_title)
  if 'config' in globals() and 'assignmentTitle' in config:
    return clean_title(config['assignmentTitle'])
  with open('/autograder/submission_metadata.json', 'r') as file:
    metadata = json.load(file)
    return clean_title(metadata['assignment']['title'])


def upload_tests(assignment_title, student_id, tests, params):
  encoded_id = base64.b64encode(student_id.encode('utf-8')).decode('utf-8') # just not in plaintext, but isn't sensitive anyway
  url = f"{SERVER_URI}/submit-tests/{assignment_title}?id={encoded_id}"
  headers = {'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN}
  response = requests.post(url, params=params, json=tests, headers=headers)
  return response


def upload_results(assignment_title, student_id, results):
  encoded_id = base64.b64encode(student_id.encode('utf-8')).decode('utf-8') # just not in plaintext, but isn't sensitive anyway
  url = f"{SERVER_URI}/submit-results/{assignment_title}?id={encoded_id}"
  headers = {'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN}
  response = requests.post(url, json=results, headers=headers)
  return response


def start_server(server_path, setup=False):
  if setup:
    subprocess.run(["bash", "setup-server.sh"], cwd=server_path, check=True)
  process = subprocess.Popen(["bash", "run-server.sh"], cwd=server_path)
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
    with open('/autograder/submission/tests.json', 'r') as file:
      tests = json.load(file)
  except:
    tests = []
  
  output_str = ""
  if len(tests) > 0:
    # Run tests on sample server
    sample_server = start_server("/autograder/source/sample-server")
    sample_results = run_tests(tests)
    stop_server(sample_server)

    # Format feedback and ensure they passed sample
    feedback = [{
      "name": "SAMPLE SOLUTION RESULT: " + result["name"],
      "status": "Failed" if not result["result"]["success"] else "Passed",
      "score": 0 if not result["result"]["success"] else 0,
      "output": "Description: " + result["test"]["description"] + "\n\n" + result["result"]["reason"] if "description" in result["test"] and result["test"]["description"] else result["result"]["reason"],
      "visibility": "visible"
    } for result in sample_results["results"]]
    successful_tests = []
    successful_test_names = []
    for result in sample_results["results"]:
      if result["result"]["success"] and result["test"]["name"] not in successful_test_names:
        successful_tests.append(result["test"])
        successful_test_names.append(result["test"]["name"])

    if sample_results["total"] != sample_results["passed"]:
      output_str += "Some test cases did not pass sample implementation. If you believe any of these to be a mistake, please contact the assignment administrators. Only test cases that pass this sample may be uploaded. You can find the outcomes of running your tests on THE SAMPLE SOLUTION below.\n"
    else:
      output_str += "All uploaded tests passed the sample implementation!\n"
  else:
    output_str += "No tests were uploaded. You must have submitted at least one working test at some point to be able to run other students' tests.\n"
    feedback = []
    successful_tests = []

  # Ensure database is running
  if not check_database_health():
    write_output({"output": "Server is not running or not healthy. Please contact the assignment administrators. In the meantime, here are the outcomes of running your tests on THE SAMPLE SOLUTION.\n" + output_str, "tests": feedback})
    return
  student_id = get_student_id()
  assignment_title = get_assignment_title()

  # Upload tests to the database, get response of all tests
  response = upload_tests(assignment_title, student_id, successful_tests, config)
  json_response = response.json()
  if response.status_code < 200 or response.status_code >= 300 or not json_response['success']:
    write_output({"output": "Error uploading tests to the database. Please contact the assignment administrators. In the meantime, here are the outcomes of running your tests on THE SAMPLE SOLUTION.\n" + output_str, "tests": feedback})
    return
  if len(json_response['failedToAdd']) > 0:
    output_str += "Failed to upload all tests to the database. Make sure test names are unique if you want them to be counted seperately! Please see the following reasons:\n\n"
    for failure in json_response['failedToAdd']:
      output_str += failure['name'] + ": \t" + failure['reason'] + "\n"
    output_str += "\n"
  elif len(successful_tests) > 0:
    output_str += "All tests successfully uploaded to the database!\n"
  all_tests = response.json()['tests']

  # Run tests on student submission
  student_server = start_server("/autograder/submission", setup=True)
  all_results = run_tests(all_tests)
  stop_server(student_server)
  
  # Format feedback and return results
  feedback += [{
    "name": result["name"],
    "status": "Failed" if not result["result"]["success"] else "Passed",
    "score": 0 if not result["result"]["success"] else 0,
    "output": "Description: " + result["test"]["description"] + "\n\n" + result["result"]["reason"] if "description" in result["test"] and result["test"]["description"] else result["result"]["reason"],
    "visibility": "visible"
  } for result in all_results["results"]]

  if all_results["total"] != all_results["passed"]:
    output_str += "\nNot all available test cases passed your implementation. Please see the following breakdown.\n"
  elif all_results["total"] == 0:
    output_str += "\nNo available tests to run on your implementation. You must have submitted at least one working test at some point to be able to run other students' tests.\n"
  else:
    output_str += "\nAll available test cases passed your implementation!\n"

  # Upload results to the database
  upload_response = upload_results(assignment_title, student_id, [{"name": result["name"], "passed": result["result"]["success"]} for result in all_results["results"]])
  if upload_response.status_code != 200:
    output_str += "\nError uploading results to the database. Please contact the assignment administrators. You can still see the results of the test cases below, but the updated statistics have not been uploaded.\n"
  
  write_output({"output": output_str, "tests": feedback})

def setup():
  load_config()
  
  # Read default tests
  try:
    with open('/autograder/source/sample-server/default-tests.json', 'r') as file:
      tests = json.load(file)
  except:
    tests = []
  
  output_str = ""
  if len(tests) > 0:
    # Run tests on sample server
    sample_server = start_server("/autograder/source/sample-server")
    sample_results = run_tests(tests, setup=True)
    stop_server(sample_server)

    feedback = [{
      "name": "SAMPLE SOLUTION RESULT: " + result["name"],
      "status": "Failed" if not result["result"]["success"] else "Passed",
      "score": 0 if not result["result"]["success"] else 0,
      "output": "Description: " + result["test"]["description"] + "\n\n" + result["result"]["reason"] if "description" in result["test"] and result["test"]["description"] else result["result"]["reason"],
      "visibility": "visible"
    } for result in sample_results["results"]]
    successful_tests = []
    successful_test_names = []
    for result in sample_results["results"]:
      if result["result"]["success"] and result["test"]["name"] not in successful_test_names:
        successful_tests.append(result["test"])
        successful_test_names.append(result["test"]["name"])

    if sample_results["total"] != sample_results["passed"]:
      output_str += "Some test cases did not pass sample implementation. Only test cases that pass this sample may be uploaded. You can find the outcomes of running your tests on THE SAMPLE SOLUTION below.\n"
    else:
      output_str += "All uploaded tests passed the sample implementation!\n"
  else:
    output_str += "No default tests were uploaded.\n"
    feedback = []
    successful_tests = []

  test_response = ""
  for test in feedback:
    test_response += test['name'] + ": " + test['status'] + "\n"
    test_response += test['output'] + "\n\n"

  # Ensure database is running
  if not check_database_health():
    print("Server is not running or not healthy. Please contact the database administrators. In the meantime, here are the outcomes of running your tests on THE SAMPLE SOLUTION.\n" + output_str + "\n" + test_response)
    return
  assignment_title = get_assignment_title()

  # Upload tests to the database, get response of all tests
  response = upload_tests(assignment_title, "-1", successful_tests, config)
  json_response = response.json()
  if response.status_code < 200 or response.status_code >= 300 or not json_response['success']:
    print("Error uploading tests to the database. Please contact the database administrators. In the meantime, here are the outcomes of running your tests on THE SAMPLE SOLUTION.\n" + output_str + "\n" + test_response)
    return
  if len(json_response['failedToAdd']) > 0:
    output_str += "Failed to upload all tests to the database. Make sure test names are unique if you want them to be counted seperately! Please see the following reasons:\n\n"
    for failure in json_response['failedToAdd']:
      output_str += failure['name'] + ": \t" + failure['reason'] + "\n"
    output_str += "\n"
  elif len(successful_tests) > 0:
    output_str += "All tests successfully uploaded to the database!\n"

  print(output_str)
  print(test_response)

if __name__ == "__main__":
  if len(sys.argv) == 2:
    if sys.argv[1] == "--setup":
      setup()
    else:
      print("Invalid argument. Use --setup in autograder setup.")
  elif len(sys.argv) == 1:
    main()
  else:
    print("Invalid number of arguments. Use --setup in autograder setup.")
