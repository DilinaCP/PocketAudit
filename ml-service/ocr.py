import json
import requests

url = "https://api.ocr.space/parse/image"
image = "/Users/dilinachathurakaperera/Code/personal/projects/PocketAudit/ml-service/005.jpg"

res = requests.post(
    url,
    data={
        'apikey': 'K83657809388957',  
        'language': 'eng',
        'isTable': True,
        'OCREngine': 2
    },
    files={'file': open(image, 'rb')}
)

with open("response1.json", "w") as f:
    json.dump(res.json(), f, indent=4)

with open("response1.json", "r") as f:
    data = json.load(f)


parsed_text = data.get("ParsedResults", [{}])[0].get("ParsedText", "")
print("\n Parsed Text:\n")
print(parsed_text)
