import pandas as pd
import json

excel_data = pd.read_csv('accounts.csv')

json_output = []
count = 0
for index, row in excel_data.iterrows():
    if pd.notnull(row['SID']) and pd.notnull(row['Email']) and 'upenn.edu' in row['Email']:
        username = row['Email'].split('@')[0]
        json_object = {
            "username": username,
            "id": row['Email'],
            "admin": False,
            "password": str(int(row['SID']))
        }
        json_output.append(json_object)
        count += 1

json_data = json.dumps(json_output, indent=2)

with open('accounts.json', 'w') as json_file:
    json_file.write(json_data)
print(count)
