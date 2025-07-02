import qrcode
import random
import string
import os

# Create 'qrcodes' folder if it doesn't exist
os.makedirs("qrcodes", exist_ok=True)

def generate_qr(random_string):
    # data = f"{random_string}"
    data = "ABCDEF1234567890ABCDEF1234567890"
    img = qrcode.make(data)
    img.save(f"qrcodes/new.png")
    print(f"QR Code generated for {random_string}")


# Create random 128-character string
characters = string.ascii_letters + string.digits + string.punctuation
random_string = ''.join(random.choices(characters, k=128))

print("Generated String:\n", random_string)

# Correct call
generate_qr(random_string)
