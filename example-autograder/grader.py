import json
import subprocess
import requests
import shlex
import time, os


SERVER_IP = os.getenv('SERVER_IP') # EC2 instance IP of database/server
SERVER_PORT = os.getenv('SERVER_PORT', '3000')
SERVER_URI = f"http://{SERVER_IP}:{SERVER_PORT}"
AUTH_TOKEN = os.getenv('AUTH_TOKEN')


def run_curl_command(curl_command):
  modified_curl_command = curl_command + ' -w "\\n%{http_code}"'
  args = shlex.split(modified_curl_command)

  result = subprocess.run(args, capture_output=True, text=True)

  output_parts = result.stdout.strip().split('\n')
  response_body = '\n'.join(output_parts[:-1])
  response_code = int(output_parts[-1])

  return result.returncode, result.stdout, result.stderr, response_code, response_body


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
        "result": test_result
    })
    if test_result["success"]:
      results["passed"] += 1
    else:
      results["failed"] += 1
      
  return results


def upload_results(student_id, results):
  url = f"{SERVER_URI}/upload-results?student_id={student_id}"
  headers = {'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN}
  response = requests.post(url, json=results, headers=headers)
  return response


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
  

def upload_tests(student_id, tests):
  url = f"{SERVER_URI}/submit-tests?student_id={student_id}"
  headers = {'Content-Type': 'application/json', 'Authorization': AUTH_TOKEN}
  response = requests.post(url, json=tests, headers=headers)
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
  with open('/autograder/results/results.json', 'w') as file:
    json.dump(data, file)


def main():
  # Read tests
  with open('tests.json', 'r') as file:
    tests = json.load(file)

  # Run tests on sample server
  sample_server = start_server("/autograder/source/sample-server")
  sample_results = run_tests(tests)
  stop_server(sample_server)

  # Format feedback and ensure they passed sample
  feedback = [{
    "name": result["name"],
    "status": "failed" if not result["result"]["success"] else "passed",
    "score": -1.0 if not result["result"]["success"] else 0,
    "output": result["result"]["reason"],
    "visibility": "visible"
  } for result in sample_results["results"]]

  if sample_results["total"] != sample_results["passed"]:
    write_output({"output": "Test cases did not pass sample implementation. If you believe any of these to be a mistake, please contact the assignment administrators. Here are the outcomes of running your tests on THE SAMPLE SOLUTION.", "tests": feedback})
    return
  output_str = "All uploaded tests passed the sample implementation!\n"

  # Ensure database is running
  if not check_database_health():
    write_output({"output": "Server is not running or not healthy. Please contact the assignment administrators. In the meantime, here are the outcomes of running your tests on THE SAMPLE SOLUTION.\n" + output_str, "tests": feedback})
    return
  student_id = get_student_id()

  # Upload tests to the database, get response of all tests
  response = upload_tests(student_id, tests)
  json_response = response.json()
  if response.status_code < 200 or response.status_code >= 300 or not json_response['success']:
    write_output({"output": "Error uploading tests to the database. Please contact the assignment administrators. In the meantime, here are the outcomes of running your tests on THE SAMPLE SOLUTION.\n" + output_str, "tests": feedback})
    return
  if len(json_response['failedToAdd']) > 0:
    output_str += "Failed to upload all tests to the database. Make sure test names are unique if you want them to be counted seperately! Please see the following reasons:\n\n"
    for failure in json_response['failedToAdd']:
      output_str += failure['name'] + ": \t" + failure['reason'] + "\n"
    output_str += "\n"
  else:
    output_str += "All tests successfully uploaded to the database!\n"
  all_tests = response.json()['tests']

  # Run tests on student submission
  student_server = start_server("/autograder/submission", npm_install=True)
  all_results = run_tests(all_tests)
  stop_server(student_server)
  
  # Format feedback and return results (note that we don't need feedback.extend because upload_tests
  # should return EVERY test case that student has ever uploaded successfully, so that test case
  # will just be included and re-ran).
  feedback = [{
    "name": result["name"],
    "status": "failed" if not result["result"]["success"] else "passed",
    "score": -1.0 if not result["result"]["success"] else 0,
    "output": result["result"]["reason"],
    "visibility": "visible"
  } for result in all_results["results"]]

  if all_results["total"] != all_results["passed"]:
    output_str += "\nNot all uploaded test cases passed your implementation. Please see the following breakdown.\n"
  else:
    output_str += "\nAll uploaded test cases passed your implementation!\n"
  
  write_output({"output": output_str, "tests": feedback})

  # TODO: Upload results to the database
  # upload_response = upload_results(student_id, {"success": "All tests passed"})
  # if upload_response.status_code != 200:
  #   results = {"error": "Error uploading results to the database"}
  #   with open('/autograder/results/results.json', 'w') as file:
  #       json.dump(results, file)
  #   return

if __name__ == "__main__":
  main()


# { "score": 44.0, // optional, but required if not on each test case below. Overrides total of tests if specified.
#   "execution_time": 136, // optional, seconds
#   "output": "Text relevant to the entire submission", // optional
#   "output_format": "simple_format", // Optional output format settings, see "Output String Formatting" below
#   "test_output_format": "text", // Optional default output format for test case outputs, see "Output String Formatting" below
#   "test_name_format": "text", // Optional default output format for test case names, see "Output String Formatting" below
#   "visibility": "after_due_date", // Optional visibility setting
#   "stdout_visibility": "visible", // Optional stdout visibility setting
#   "extra_data": {}, // Optional extra data to be stored
#   "tests": // Optional, but required if no top-level score
#     [
#         {
#             "score": 2.0, // optional, but required if not on top level submission
#             "max_score": 2.0, // optional
#             "status": "passed", // optional, see "Test case status" below
#             "name": "Your name here", // optional
#             "name_format": "text", // optional formatting for the test case name, see "Output String Formatting" below
#             "number": "1.1", // optional (will just be numbered in order of array if no number given)
#             "output": "Giant multiline string that will be placed in a <pre> tag and collapsed by default", // optional
#             "output_format": "text", // optional formatting for the test case output, see "Output String Formatting" below
#             "tags": ["tag1", "tag2", "tag3"], // optional
#             "visibility": "visible", // Optional visibility setting
#             "extra_data": {} // Optional extra data to be stored
#         },
#         // and more test cases...
#     ],
#   "leaderboard": // Optional, will set up leaderboards for these values
#     [
#       {"name": "Accuracy", "value": .926},
#       {"name": "Time", "value": 15.1, "order": "asc"},
#       {"name": "Stars", "value": "*****"}
#     ]
# }