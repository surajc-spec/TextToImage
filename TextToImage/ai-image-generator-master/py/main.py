from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

FREEPIK_API_URL = "https://api.freepik.com/v1/ai/mystic"
FREEPIK_API_KEY = "FPSX3af3c52a70744210b7e150564bdc2dca"

headers = {
    "x-freepik-api-key": FREEPIK_API_KEY,
    "Content-Type": "application/json"
}

@app.route('/generate-image', methods=['POST'])
def generate_image():
    """Start image generation and return the task_id"""
    try:
        data = request.json
        prompt = data.get("prompt", "Default prompt")

        # Step 1: Request image generation
        payload = {"prompt": prompt}
        response = requests.post(FREEPIK_API_URL, headers=headers, json=payload)

        if response.status_code != 200:
            return jsonify({"error": "Failed to start image generation"}), response.status_code

        task_id = response.json().get("data", {}).get("task_id")
        if not task_id:
            return jsonify({"error": "No task ID received"}), 500

        return jsonify({"task_id": task_id})  # Return task ID to the frontend

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get-image/<task_id>', methods=['GET'])
def get_image(task_id):
    """Check if the image is generated and return the URL if available"""
    try:
        task_url = f"{FREEPIK_API_URL}/{task_id}"
        task_response = requests.get(task_url, headers=headers)

        if task_response.status_code != 200:
            return jsonify({"error": "Failed to check task status"}), task_response.status_code

        generated_images = task_response.json().get("data", {}).get("generated", [])

        if generated_images:
            return jsonify({"image_url": generated_images[0]})
        else:
            return jsonify({"status": "processing"})  # Image still generating

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5000)
