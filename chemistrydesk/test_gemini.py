import json
import urllib.request
from openai import OpenAI

# 1. Connect to Google Gemini
client = OpenAI(
    api_key="GEMINI_API_KEY", "YOUR_API_KEY",
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

# 2. Fetch your OpenAPI schema directly from your live deployment
url = "https://chemistrycal.com/openapi.json"
try:
    print(f"Fetching tools from {url}...")
    req = urllib.request.urlopen(url)
    openapi_spec = json.loads(req.read().decode("utf-8"))
except Exception as e:
    # Fallback to local public folder if offline
    print(f"Live fetch failed ({e}), loading from public/openapi.json...")
    with open("public/openapi.json", "r") as f:
        openapi_spec = json.load(f)

# 3. Parse all tools dynamically from the spec
tools = []
for path, methods in openapi_spec.get("paths", {}).items():
    for method, details in methods.items():
        func_name = details.get("operationId", path.strip("/").replace("/", "_"))
        description = details.get("summary", details.get("description", "Chemistry calculation studio tool"))
        
        parameters = details.get("parameters", {})
        if not parameters and "requestBody" in details:
            try:
                content = details["requestBody"]["content"]
                content_type = list(content.keys())[0]
                parameters = content[content_type].get("schema", {"type": "object", "properties": {}})
            except Exception:
                parameters = {"type": "object", "properties": {}}

        tools.append({
            "type": "function",
            "function": {
                "name": func_name,
                "description": description,
                "parameters": parameters
            }
        })

print(f"Successfully loaded {len(tools)} tools dynamically!")

# 4. Universal tool execution dispatcher
def execute_tool_dispatcher(func_name, args):
    if func_name == "calculateMolarity":
        c = args.get("concentration", 0)
        v = args.get("volumeMl", 0)
        mw = args.get("anhydrousMw", 0)
        mass = c * (v / 1000.0) * mw
        return {"massGrams": round(mass, 4), "unit": "g"}
    
    return {"result": f"Executed {func_name} with arguments {args}"}

# 5. Test query
messages = [
    {"role": "user", "content": "I need to prepare 250 mL of a 0.5 M NaCl solution (MW 58.44). What mass should I weigh?"}
]

response = client.chat.completions.create(
    model="gemini-3.8-flash",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

response_message = response.choices[0].message
messages.append(response_message)

# 6. Handle tool call and get final answer
if response_message.tool_calls:
    for tool_call in response_message.tool_calls:
        f_name = tool_call.function.name
        f_args = json.loads(tool_call.function.arguments)
        
        print(f"\n[AI Triggered Tool]: {f_name}")
        print(f"[Arguments]: {f_args}")
        
        tool_output = execute_tool_dispatcher(f_name, f_args)
        print(f"[Output]: {tool_output}")
        
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(tool_output)
        })

    final_response = client.chat.completions.create(
        model="gemini-3.8-flash",
        messages=messages
    )
    print("\n[Final AI Answer]:")
    print(final_response.choices[0].message.content)