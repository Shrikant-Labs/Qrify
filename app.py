
from io import BytesIO
from urllib.parse import urlparse

import qrcode
from flask import Flask, jsonify, render_template, request, send_file

app = Flask(__name__)


@app.route("/")
def home():
    # Display the frontend
    return render_template("index.html")


@app.route("/api/qr", methods=["POST"])
def generate_qr():
    # Get the URL from the frontend
    data = request.get_json(silent=True) or {}
    url = data.get("url", "")

    if not isinstance(url, str):
        return jsonify({"error": "URL must be a string."}), 400

    url = url.strip()

    if not url or len(url) > 2048:
        return jsonify({"error": "Enter a URL up to 2048 characters."}), 400

    # Validate the URL format
    parsed_url = urlparse(url)

    if (
        parsed_url.scheme not in ("http", "https")
        or not parsed_url.hostname
        or any(char.isspace() for char in url)
    ):
        return jsonify({
            "error": "Enter a valid HTTP or HTTPS URL."
        }), 400

    try:
        # Generate QR code using Python
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )

        qr.add_data(url)
        qr.make(fit=True)

        img = qr.make_image(
            fill_color="#20213a",
            back_color="white",
        )

        # Save the image in memory, without creating a file
        image_buffer = BytesIO()
        img.save(image_buffer, format="PNG")
        image_buffer.seek(0)

        # Return the PNG to the frontend
        return send_file(
            image_buffer,
            mimetype="image/png",
            download_name="qrify-code.png",
        )

    except Exception:
        app.logger.exception("QR code generation failed")
        return jsonify({
            "error": "Unable to generate the QR code."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
