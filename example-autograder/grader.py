import json
import subprocess
import requests
import shlex
import time, os


SERVER_IP = os.getenv('SERVER_IP')  # EC2 instance IP of database/server
SERVER_PORT = os.getenv('SERVER_PORT', '3000')
SERVER_URI = f"http://{SERVER_IP}:{SERVER_PORT}"
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
  feedback = {
    "tests": [
      {
        "name": result["name"],
        "status": "failed" if not result["result"]["success"] else "passed",
        "score": -1.0 if not result["result"]["success"] else 0,
        "output": result["result"]["reason"],
        "visibility": "visible"
      } for result in sample_results["results"]
    ]
  }
  if sample_results["total"] != sample_results["passed"]:
    write_output({"output": "Test cases did not pass sample implementation.", "tests": feedback["tests"]})
    return

  if not check_database_health():
    write_output({"output": "Server is not running or not healthy. Contact the assignment administrators.", "tests": feedback["tests"]})
    return

  student_id = get_student_id()

  # Upload tests to the database, get response of all tests
  response = upload_tests(student_id, tests)
  if response.status_code != 201:
    # TODO: modify testit-server response + handling so that duplicate tests are filtered out properly
    write_output({"output": "Error uploading tests to the database. Contact the assignment administrators.", "tests": feedback["tests"]})
    return
  json_response = response.json()
  if not json_response['success']:
    write_output({"output": "Failed to upload all tests"})
    return
  all_tests = response.json()['tests']

  student_server = start_server("/autograder/submission")

  all_results = run_tests(all_tests)
  stop_server(student_server)
  
  formatted_results = [{
    "name": result["name"],
    "status": "failed" if not result["result"]["success"] else "passed",
    "score": -1.0 if not result["result"]["success"] else 0,
    "output": result["result"]["reason"],
    "visibility": "visible"
  } for result in all_results["results"]]
  feedback["tests"].extend(formatted_results)
  if all_results["total"] != all_results["passed"]:
    # TODO: give detailed feedback message with description of failed/passed tests
    write_output({"output": "All test cases did not pass.", "tests": feedback["tests"]})
    return
  
  write_output({"output": "All test cases passed.", "tests": feedback["tests"]})

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