import pytesseract
from PIL import Image
import cv2
import numpy as np
import io
import re
from difflib import get_close_matches


def preprocess_image(image_buffer):
    # Convert bytes to OpenCV format
    np_arr = np.frombuffer(image_buffer, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Resize to enhance small text
    gray = cv2.resize(gray, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_LINEAR)

    # Adaptive threshold to improve OCR clarity
    thresh = cv2.adaptiveThreshold(gray, 255,
                                   cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 11, 2)

    # Median blur to remove noise
    denoised = cv2.medianBlur(thresh, 3)

    # Convert back to PIL Image for pytesseract
    pil_image = Image.fromarray(denoised)
    return pil_image


def find_line_with_keyword(lines, keywords):
    for line in lines:
        for keyword in keywords:
            if get_close_matches(keyword.lower(), [line.lower()], cutoff=0.8):
                return line
    return None


def extract_items(lines):
    items = []
    pattern = re.compile(r'(.+?)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)')
    for line in lines:
        match = pattern.match(line.strip())
        if match:
            desc = match.group(1).strip()
            qty = int(match.group(2))
            price = float(match.group(3).replace(',', ''))
            amount = float(match.group(4).replace(',', ''))
            items.append({
                'description': desc,
                'qty': qty,
                'price': price,
                'amount': amount
            })
    return items


def parse_receipt(text):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    merchant = lines[0] if lines else 'Unknown Merchant'
    address = ', '.join(lines[1:5]).strip() if len(lines) > 1 else ''

    invoice_line = find_line_with_keyword(lines, ['Invoice No', 'Invoice', 'Receipt No'])
    date_line = find_line_with_keyword(lines, ['Date', 'Purchase Date'])
    cashier_line = find_line_with_keyword(lines, ['Cashier', 'Clerk'])

    items = []
    in_items = False
    for i, line in enumerate(lines):
        if any(k in line for k in ['Description', 'Item', 'Qty']) and 'Price' in line:
            in_items = True
            continue
        if in_items:
            if any(k in line for k in ['Total', 'TOTAL', 'Subtotal', 'SUBTOTAL']):
                break
            item = re.match(r'(.+?)\s+(\d+)\s+([\d,.]+)\s+([\d,.]+)', line)
            if item:
                items.append({
                    'description': item.group(1).strip(),
                    'qty': int(item.group(2)),
                    'price': float(item.group(3).replace(',', '')),
                    'amount': float(item.group(4).replace(',', ''))
                })

    total_line = find_line_with_keyword(lines, ['Total', 'TOTAL'])
    total = float(re.sub(r'[^\d.]', '', total_line.split()[-1])) if total_line else sum(i['amount'] for i in items)

    payment_method_line = find_line_with_keyword(lines, ['VISA', 'CARD', 'CASH', 'MasterCard', 'Paid by'])
    payment_method = payment_method_line.strip() if payment_method_line else 'Unknown Payment'

    return {
        'merchant': merchant,
        'address': address,
        'invoiceNo': invoice_line.split(':')[1].strip() if invoice_line and ':' in invoice_line else 'N/A',
        'date': date_line.split(':')[1].strip() if date_line and ':' in date_line else 'N/A',
        'cashier': cashier_line.split(':')[1].strip() if cashier_line and ':' in cashier_line else 'N/A',
        'items': items,
        'subtotal': sum(i['amount'] for i in items),
        'total': total,
        'paymentMethod': payment_method
    }


def process_receipt(image_buffer):
    image = preprocess_image(image_buffer)
    text = pytesseract.image_to_string(image, lang='eng')
    return parse_receipt(text)
